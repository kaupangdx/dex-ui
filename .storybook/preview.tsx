import type { Preview } from "@storybook/react";
import { ColorSchemeProvider, MantineProvider } from "@mantine/core";
import { theme } from "../src/theme";
import React from "react";
import { useDarkMode } from "storybook-dark-mode";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;

function ThemeWrapper(props: { children: React.ReactNode }) {
  const colorScheme = useDarkMode() ? "dark" : "light";
  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={() => {}}>
      <MantineProvider
        theme={{ ...theme, colorScheme }}
        withGlobalStyles
        withNormalizeCSS
      >
        {props.children}
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export const decorators = [
  (renderStory: Function) => <ThemeWrapper>{renderStory()}</ThemeWrapper>,
];
