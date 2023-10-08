import minaLogo from "./static/mina.png";
import daiLogo from "./static/dai.svg";

export interface Token {
  id: string;
  name: string;
  ticker: string;
  logo: string;
}

export const tokens: Record<string, Token> = {
  "0": {
    id: "0",
    name: "MINA",
    ticker: "MINA",
    logo: minaLogo,
  },
  "1": {
    id: "1",
    name: "Dai Stablecoin",
    ticker: "DAI",
    logo: daiLogo,
  },
};
