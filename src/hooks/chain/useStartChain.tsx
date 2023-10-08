import { useEffect } from "react";
import { useChainStore } from "../../store/useChainStore";
import log from "loglevel";

export const useStartChain = () => {
  const chain = useChainStore();
  useEffect(() => {
    if (chain.started || chain.loading) return;

    (async () => {
      await chain.start();
    })();
  }, [chain.started, chain]);

  return chain.loading || !chain.started;
};
