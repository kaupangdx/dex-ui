import { useEffect } from "react";
import { useAccountStore } from "../../store/useAccountStore";

export const useObserveAccountChange = () => {
  const { observeAccountChange } = useAccountStore();
  useEffect(() => {
    observeAccountChange();
  }, []);
};
