import { useEffect } from "react";
import { useAccountStore } from "../../store/useAccountStore";

export const useInitializeWallet = () => {
  const { initializeWallet } = useAccountStore();

  useEffect(() => {
    initializeWallet();
  }, [initializeWallet]);
};
