import React from "react";
import { ChainLoadingOverlay as ChainLoadingOverlayComponent } from "../../components/ChainLoadingOverlay/ChainLoadingOverlay";
import { useStartChain } from "../../hooks/chain/useStartChain";

export const ChainLoadingOverlay: React.FC = () => {
  const loading = useStartChain();
  return <ChainLoadingOverlayComponent loading={loading} />;
};
