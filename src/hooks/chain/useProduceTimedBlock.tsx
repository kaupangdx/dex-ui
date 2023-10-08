import { useEffect, useState } from "react";
import { useChainStore } from "../../store/useChainStore";

export const useProduceTimedBlock = () => {
  const chain = useChainStore();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (chain.loading) return;
    const intervalId1 = setInterval(async () => {
      await chain.produceBlock();
      setCountdown(5);
    }, 5000);

    const intervalId2 = setInterval(
      () =>
        setCountdown((countdown) => {
          if (countdown == 0) return 0;
          return countdown - 1;
        }),
      1000
    );

    return () => {
      clearInterval(intervalId1);
      clearInterval(intervalId2);
    };
  }, [chain.loading]);

  return countdown;
};
