import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { query as q } from "faunadb";
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";

type User = {
  ref: {
    id: string;
  };
  data: {
    stripe_customer_id: string;
  };
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const session = await getSession({ req }); // descobre o usuário logado na aplicação com o método getSession

    const user = await fauna.query<User>( // SELECT no usuário do fauna
      q.Get(q.Match(q.Index("user_by_email"), q.Casefold(session.user.email)))
    );  

    let customerId = user.data.stripe_customer_id; // verifica se existe stripe_customer_id no fauna
    if (!customerId) { // se não existir
      const stripeCustomer = await stripe.customers.create({ // cria um stripe customer com o email do fauna
        email: session.user.email,
      });

      await fauna.query( // UPDATE no usuário do fauna com o novo stripe_custumer_id
        q.Update(q.Ref(q.Collection("users"), user.ref.id), {
          data: {
            stripe_customer_id: stripeCustomer.id,
          },
        })
      );

      customerId = stripeCustomer.id;
    }

    const checkoutSession = await stripe.checkout.sessions.create({ // criando a sessão do usuário do stripe
      customer: customerId,
      payment_method_types: ["card"],
      billing_address_collection: "required", // endereço obrigatorio = required ou endereço configurado no painel do stripe = auto
      line_items: [
        {
          price: "price_1IbPIBG6VviFFmNbOctLUnvT",
          quantity: 1,
        },
      ],
      mode: "subscription", // pagamento recorrente
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });

    return res.status(200).json({ sessionId: checkoutSession.id });
  } else {
    res.setHeader("Allow", "POST"); // retorna para o front-end que o método dessa requisição é apenas POST
    res.status(405).end("Method not allowed");
  }
};
