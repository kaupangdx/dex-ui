import React, { PropsWithChildren, useCallback, useEffect } from "react";
import { MantineProvider, useMantineTheme } from "@mantine/core";
import { theme } from "../../theme";
import { useColorSchemeStore } from "../../store/useColorSchemeStore";
import { useObserveAccountChange } from "../../hooks/account/useObserveAccountChange";
import { AppShell as AppShellComponent } from "../../components/AppShell/AppShell";
import { WalletButton } from "../../components/WalletButton/WalletButton";
import { useChainStore } from "../../store/useChainStore";
import { useAccountStore } from "../../store/useAccountStore";
import { useInitializeWallet } from "../../hooks/account/useInitializeWallet";
import { ChainLoadingOverlay } from "../ChainLoadingOverlay/ChainLoadingOverlay";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { useNotifyAboutTransactions } from "../../hooks/notifications/useNotifyAboutTransactions";

export const AppShell: React.FC<PropsWithChildren> = ({ children }) => {
  const { colorScheme } = useMantineTheme();
  useInitializeWallet();
  useObserveAccountChange();
  useNotifyAboutTransactions();

  return (
    <>
      <AppShellComponent header={<Header />} footer={<Footer />}>
        {children}
      </AppShellComponent>
      <ChainLoadingOverlay />
    </>
  );
};
