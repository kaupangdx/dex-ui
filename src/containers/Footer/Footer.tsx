import React from "react";
import { Footer as FooterComponent } from "../../components/Footer/Footer";
import { useProduceTimedBlock } from "../../hooks/chain/useProduceTimedBlock";
import { useChainStore } from "../../store/useChainStore";

export const Footer: React.FC = () => {
  const countdown = useProduceTimedBlock();
  const {
    block: { height, loading },
  } = useChainStore();
  return (
    <FooterComponent
      countdown={countdown}
      blockHeight={`${height}`}
      loading={loading}
    />
  );
};
