import BigNumber from "bignumber.js";
import { useCallback } from "react";

BigNumber.config({
  DECIMAL_PLACES: 100,
});

export const decimals = 2;
export const useFormatBalance = (
  options: { withDecimals: boolean } = { withDecimals: true }
) => {
  return useCallback((balance?: string | BigNumber) => {
    if (!balance) return;

    let formattedBalance = new BigNumber(balance);

    if (options.withDecimals) {
      formattedBalance = formattedBalance.div(new BigNumber(10).pow(decimals));
    }

    // in case the input string contains non numeric characters
    if (formattedBalance.isNaN()) return "0";

    const f = formattedBalance.toFixed(decimals);

    // trim excess zeroes after the decimal point
    const r = f.replace(/^(\d+(?:\.\d*?[1-9](?=0|\b))?)\.?0*$/, "$1");

    return r;
  }, []);
};
