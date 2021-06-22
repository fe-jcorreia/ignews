import { render } from "@testing-library/react";
import { ActiveLink } from ".";

jest.mock("next/router", () => {
  // mock do retorno de useRouter
  return {
    useRouter() {
      return { asPath: "/" };
    },
  };
});

describe("Active Link component", () => {
  test("renders correctly", () => {
    const { getByText, debug } = render(
      // cria uma vizualização de forma virtual desse HTML
      <ActiveLink href="/" activeClassName="active">
        <a>Home</a>
      </ActiveLink>
    );

    //debug(); funciona como um console.log

    expect(getByText("Home")).toBeInTheDocument();
  });

  it("adds active class if the link is currently active", () => {
    const { getByText, debug } = render(
      <ActiveLink href="/" activeClassName="active">
        <a>Home</a>
      </ActiveLink>
    );

    expect(getByText("Home")).toHaveClass("active");
    // expect(screen.getByText("Home")).toHaveClass("active");
  });
});
