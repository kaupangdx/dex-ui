import { create } from "zustand";
import { produce } from "immer";
import { ImmerStateCreator } from "./store";
import { api } from "../services/chain/chain";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useEffect, useMemo } from "react";
import { useChainStore } from "./useChainStore";

export const artificialDelay = 250;

export interface BalancesStore {
  balances: {
    [id: string]:
      | {
          value?: string;
          loading: boolean;
        }
      | undefined;
  };
  fetchBalance: (address: string, tokenId: string) => Promise<void>;
}

export const getBalanceId = (address: string, tokenId: string) => {
  return `${address}-${tokenId}`;
};

export const createBalancesStore: ImmerStateCreator<BalancesStore> = (
  set
): BalancesStore => ({
  balances: {},
  fetchBalance: async (address: string, tokenId: string) => {
    const balanceId = getBalanceId(address, tokenId);

    set(
      produce<BalancesStore>((state) => {
        const balance = state.balances[balanceId];
        if (!balance) {
          state.balances[balanceId] = {
            loading: true,
            value: undefined,
          };
        } else {
          balance.loading = true;
        }
      })
    );

    const value = await api.getBalance(address, tokenId);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        set(
          produce<BalancesStore>((state) => {
            state.balances[balanceId] = {
              loading: false,
              value,
            };
          })
        );
        resolve();
      }, artificialDelay);
    });
  },
});

export const useBalancesStore = create<BalancesStore>()(
  devtools(immer(createBalancesStore))
);

export const useBalance = ({
  address,
  tokenId,
}: {
  address?: string;
  tokenId?: string;
}) => {
  const { balances, fetchBalance } = useBalancesStore();
  const chain = useChainStore();

  const balance = useMemo(
    () => balances[getBalanceId(address || "", tokenId || "")],
    [balances, address, tokenId]
  );

  useEffect(() => {
    !balance?.loading &&
      chain.started &&
      address &&
      tokenId &&
      fetchBalance(address, tokenId);
  }, [address, fetchBalance, tokenId, chain.started, chain.block.height]);

  return useMemo(
    () =>
      balance ??
      (chain.started && address ? { loading: true } : { loading: false }),
    [balance]
  );
};
