import { PoolKey } from "dex-runtime/dist/runtime/XYK";
import {
  TradeForm,
  TradeFormFields,
  defaultAllowedSlippage,
} from "../../components/TradeForm/TradeForm";
import { useBalance, useBalancesStore } from "../../store/useBalancesStore";
import { TokenId } from "dex-runtime/dist/runtime/Balances";
import { useForm } from "@mantine/form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../services/chain/chain";
import BigNumber from "bignumber.js";
import {
  decimals,
  useFormatBalance,
} from "../../hooks/balances/useFormatBalance";
import { useChainStore } from "../../store/useChainStore";
import { useAccountStore } from "../../store/useAccountStore";

export const TradePage = () => {
  const form = useForm<TradeFormFields>({
    initialValues: {
      tokenIn: "0",
      tokenInAmount: "",
      tokenOut: "",
      tokenOutAmount: "",
      allowedSlippage: defaultAllowedSlippage,
    },
  });

  const shouldDetectTradeType = useRef(true);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("sell");
  const { sell, buy } = useChainStore();

  const { address } = useAccountStore();
  const formatBalance = useFormatBalance();
  useEffect(() => {
    shouldDetectTradeType.current && setTradeType("buy");
    // calculate amount a here
  }, [form.values.tokenOut, form.values.tokenOutAmount]);

  useEffect(() => {
    shouldDetectTradeType.current && setTradeType("sell");
    // calculate amount b here
  }, [form.values.tokenIn, form.values.tokenInAmount]);

  // add loading state

  // add empty state / no account connected state

  const handleSwitchTokens = useCallback(() => {
    const { tokenIn, tokenOut, tokenInAmount, tokenOutAmount } = form.values;
    // pause trade type detection while we manually edit the form
    shouldDetectTradeType.current = false;
    form.setFieldValue("tokenIn", tokenOut);
    form.setFieldValue("tokenOut", tokenIn);
    form.setFieldValue("tokenInAmount", tokenOutAmount);
    form.setFieldValue("tokenOutAmount", tokenInAmount);
    setTradeType((tradeType) => (tradeType === "sell" ? "buy" : "sell"));
    setTimeout(() => {
      shouldDetectTradeType.current = true;
    }, 300);
  }, [form]);

  useEffect(() => {
    if (form.values.tokenIn === form.values.tokenOut) {
      form.setFieldValue("tokenOut", "");
      form.setFieldValue("tokenOutAmount", "");
    }
  }, [form.values.tokenIn]);

  useEffect(() => {
    if (form.values.tokenIn === form.values.tokenOut) {
      form.setFieldValue("tokenIn", "");
      form.setFieldValue("tokenInAmount", "");
    }
  }, [form.values.tokenOut]);

  const poolKey = useMemo(() => {
    if (!form.values.tokenIn || !form.values.tokenOut) return;

    return PoolKey.fromTokenIdPair(
      TokenId.from(form.values.tokenIn),
      TokenId.from(form.values.tokenOut)
    ).toBase58();
  }, [form.values.tokenIn, form.values.tokenOut]);

  const balanceA = useBalance({
    address: poolKey,
    tokenId: form.values.tokenIn,
  });

  const balanceB = useBalance({
    address: poolKey,
    tokenId: form.values.tokenOut,
  });

  const userBalanceA = useBalance({
    address,
    tokenId: form.values.tokenIn,
  });

  const userBalanceB = useBalance({
    address,
    tokenId: form.values.tokenOut,
  });

  useEffect(() => {
    if (tradeType === "sell") {
      (async () => {
        if (!balanceA.value || !balanceB.value) return;
        const tokenOutAmountOut =
          await api.calculateTokenOutAmountOutFromReserves(
            balanceA.value,
            balanceB.value,
            new BigNumber(form.values.tokenInAmount)
              .multipliedBy(new BigNumber(10).pow(decimals))
              .toFixed(0)
          );

        shouldDetectTradeType.current = false;

        form.setFieldValue("tokenOutAmount", formatBalance(tokenOutAmountOut)!);
        setTimeout(() => {
          shouldDetectTradeType.current = true;
        }, 300);
      })();
    }

    if (tradeType === "buy") {
      (async () => {
        if (!balanceA.value || !balanceB.value) return;
        const tokenInAmountIn = await api.calculateTokenInAmountInFromReserves(
          balanceA.value,
          balanceB.value,
          new BigNumber(form.values.tokenOutAmount)
            .multipliedBy(new BigNumber(10).pow(decimals))
            .toFixed(0)
        );

        shouldDetectTradeType.current = false;

        form.setFieldValue("tokenInAmount", formatBalance(tokenInAmountIn)!);
        setTimeout(() => {
          shouldDetectTradeType.current = true;
        }, 300);
      })();
    }
  }, [
    tradeType,
    balanceA,
    balanceB,
    form.values.tokenInAmount,
    form.values.tokenOutAmount,
  ]);

  const handleSubmit = useCallback(
    (tradeLimit: string, values: TradeFormFields) => {
      if (tradeType === "sell") {
        sell(
          address!,
          values.tokenIn!,
          values.tokenOut!,
          new BigNumber(values.tokenInAmount)
            .multipliedBy(Math.pow(10, 2))
            .toFixed(0),
          new BigNumber(tradeLimit).multipliedBy(Math.pow(10, 2)).toFixed(0)
        );
      }

      if (tradeType === "buy") {
        buy(
          address!,
          values.tokenIn!,
          values.tokenOut!,
          new BigNumber(values.tokenOutAmount)
            .multipliedBy(Math.pow(10, 2))
            .toFixed(0),
          new BigNumber(tradeLimit).multipliedBy(Math.pow(10, 2)).toFixed(0)
        );
      }
    },
    [address, tradeType]
  );
  return (
    <TradeForm
      form={form}
      balanceA={balanceA}
      balanceB={balanceB}
      onSwitchTokens={handleSwitchTokens}
      tradeType={tradeType}
      onSubmit={handleSubmit}
      userBalanceA={userBalanceA}
      userBalanceB={userBalanceB}
    />
  );
};
