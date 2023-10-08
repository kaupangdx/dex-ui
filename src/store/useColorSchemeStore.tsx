import { ColorScheme } from "@mantine/core";
import { ImmerStateCreator } from "./store";
import { produce } from "immer";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface ColorSchemeStore {
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
}

export const createColorSchemeStore: ImmerStateCreator<ColorSchemeStore> = (
  set
): ColorSchemeStore => ({
  colorScheme: "dark",
  toggleColorScheme: () =>
    set(
      produce<ColorSchemeStore>((state) => {
        state.colorScheme = state.colorScheme === "dark" ? "light" : "dark";
      })
    ),
});

export const useColorSchemeStore = create<ColorSchemeStore>()(
  devtools(persist(immer(createColorSchemeStore), { name: "color-scheme" }))
);
