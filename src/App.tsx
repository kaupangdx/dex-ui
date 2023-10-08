import React from "react";
import { AppShell } from "./containers/AppShell/AppShell";
import { theme } from "./theme";
import { MantineProvider } from "@mantine/core";
import { useColorSchemeStore } from "./store/useColorSchemeStore";
import { Notifications } from "@mantine/notifications";
import { TradePage } from "./pages/TradePage/TradePage";

export const App: React.FC = () => {
  const { colorScheme } = useColorSchemeStore();
  return (
    <MantineProvider
      theme={{ ...theme, colorScheme }}
      withGlobalStyles
      withNormalizeCSS
    >
      <Notifications position={"top-right"} />
      <AppShell>
        <TradePage />
      </AppShell>
    </MantineProvider>
  );
};
