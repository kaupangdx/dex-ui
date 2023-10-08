import type { MantineThemeOverride } from "@mantine/core";
import "@fontsource/lato";
import "@fontsource/montserrat";
import "@fontsource/montserrat/500.css";

export const theme: MantineThemeOverride = {
  primaryColor: "violet",
  fontFamily: "Lato",
  headings: {
    fontFamily: "Montserrat",
  },
  globalStyles: (theme) => ({
    "html, body, #root": {
      height: "100%",
    },
    "#root": {
      position: "relative",
    },
    "h1,h2,h3,h4,h5,h6": {
      opacity: 0.85,
      letterSpacing: "-0.25px",
    },
  }),
};
