import { produce } from "immer";
import { ImmerStateCreator } from "./store";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface AccountStore {
  address?: string;
  status: "initial" | "not-installed" | "installed" | "loading" | "connected";
  connectAccount: () => Promise<void>;

  observeAccountChange: () => void;
  initializeWallet: () => Promise<void>;
}

export const createAccountStore: ImmerStateCreator<AccountStore> = (set) => ({
  address: undefined,
  status: "initial",
  initializeWallet: async () => {
    if (!window.mina) {
      return set(
        produce<AccountStore>((state) => {
          state.status = "not-installed";
        })
      );
    }

    const [account] = await window.mina.getAccounts();

    set(
      produce<AccountStore>((state) => {
        state.status = account !== undefined ? "connected" : "installed";
      })
    );
  },
  connectAccount: async () => {
    if (!window.mina) return;
    set(
      produce<AccountStore>((state) => {
        state.status = "loading";
      })
    );

    const [address] = await window.mina.requestAccounts();

    setTimeout(() => {
      set(
        produce<AccountStore>((state) => {
          state.address = address;
          state.status = "connected";
        })
      );
    }, 300);
  },

  observeAccountChange: () => {
    if (!window.mina) return;
    window.mina.on("accountsChanged", ([address]) =>
      set(
        produce<AccountStore>((state) => {
          state.address = address;
          state.status = address ? "connected" : "installed";
        })
      )
    );
  },
});

export const useAccountStore = create<AccountStore>()(
  devtools(persist(immer(createAccountStore), { name: "account-store" }))
);
