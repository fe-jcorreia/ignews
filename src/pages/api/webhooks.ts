import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";
import Stripe from "stripe";
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/manageSubscription";

async function buffer(readable: Readable) {
  // leitura do stream de dados e concatenação da mensagem
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

export const config = {
  // Nesse caso a requisição vem como uma stream e não JSON entao desabilitamos o default da req
  api: {
    bodyParser: false,
  },
};

const relevantEvents = new Set([
  // eventos que vamos observar
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const buff = await buffer(req);
    const secret = req.headers["stripe-signature"]; // cabeçalho contendo a chave secret do stripe

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        buff,
        secret,
        process.env.STRIPE_WEBHOOK_SECRET // chave para validar que as requisições estão vindo do Stripe
      );
    } catch (err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    const { type } = event; // retorna o tipo do evento
    if (relevantEvents.has(type)) {
      // se o evento é um dos que observamos
      try {
        switch (type) {
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
            const subscription = event.data.object as Stripe.Subscription;

            await saveSubscription(
              // salvamos a nova subscription com a função de manageSubscriptions.ts de _lib
              subscription.id,
              subscription.customer.toString(),
              false
            );

            break;

          case "checkout.session.completed":
            const checkoutSession = event.data
              .object as Stripe.Checkout.Session;
            await saveSubscription(
              // salvamos a nova subscription com a função de manageSubscriptions.ts de _lib
              checkoutSession.subscription.toString(),
              checkoutSession.customer.toString(),
              true
            );

            break;
          default:
            throw new Error("Unhandled event.");
        }
      } catch (err) {
        return res.json({ error: "Webhook handler failed." });
      }
    }

    res.json({ received: true });
  } else {
    res.setHeader("Allow", "POST"); // apenas aceitamos requisições POST nessa rota
    res.status(405).end("Method not allowed");
  }
};
