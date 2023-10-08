import React, { useCallback } from "react";
import { Header as HeaderComponent } from "../../components/Header/Header";
import { useColorSchemeStore } from "../../store/useColorSchemeStore";
import { useChainStore } from "../../store/useChainStore";
import { useAccountStore } from "../../store/useAccountStore";
import { WalletButton } from "../../components/WalletButton/WalletButton";
import { useBalance } from "../../store/useBalancesStore";

export const Header: React.FC = () => {
  const { toggleColorScheme: handleToggleTheme } = useColorSchemeStore();
  const { mint } = useChainStore();
  const {
    address,
    status,
    connectAccount: handleConnectAccount,
  } = useAccountStore();

  const handleMintTestFunds = useCallback(async () => {
    if (!address) return;

    await mint(address, "0");
  }, [address, mint]);

  const balance = useBalance({
    address,
    tokenId: "0",
  });
  return (
    <HeaderComponent
      walletStatus={status}
      onToggleTheme={handleToggleTheme}
      onMintTestFunds={handleMintTestFunds}
      walletButton={
        <WalletButton
          onConnectAccount={handleConnectAccount}
          status={status}
          address={address}
          balance={{
            value: balance.value,
            loading: !balance.value && balance.loading,
          }}
          usdPricePerUnit={{ loading: false, value: "0.5" }}
        />
      }
    />
  );
};
