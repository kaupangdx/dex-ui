import { StateCreator } from "zustand";

export type StoreSetter<Store> = (
  partial: Store | Partial<Store> | ((store: Store) => Store | Partial<Store>)
) => void;

export type StoreGetter<Store> = () => Store;

export type ImmerStateCreator<Store> = StateCreator<
  Store,
  [["zustand/immer", never], never],
  [],
  Store
>;
