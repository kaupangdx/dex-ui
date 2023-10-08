import { notifications } from "@mantine/notifications";
import {
  Transaction,
  TransactionStatus,
  useChainStore,
  useTransactions,
} from "../../store/useChainStore";
import { useEffect } from "react";
import { usePrevious } from "@uidotdev/usehooks";
import difference from "lodash/difference";
import {
  IconCheck,
  IconClipboardCopy,
  IconClockHour9,
  IconCopy,
  IconHash,
  IconX,
} from "@tabler/icons-react";
import { Box, Flex, Space, Text, Tooltip } from "@mantine/core";
import Truncate from "react-truncate-inside/es";
import { useClipboard } from "@mantine/hooks";
import { tokens } from "../../tokens";
import BigNumber from "bignumber.js";

export const successStatuses: TransactionStatus[] = [
  "send-successful",
  "execution-successful",
];

export const transactionToTitle = (transaction: Transaction) => {
  switch (transaction.status) {
    case "send-failed":
      return "Failed to send transaction";
    case "send-successful":
      return "Transaction sent";
    case "execution-failed":
      return "Transaction failed";
    case "execution-successful":
      return "Transaction successful";
  }
};

export const transactionToIcon = (
  transaction: Transaction,
  size: string = "1.125rem"
) => {
  const error = <IconX stroke={"2"} size={size} />;
  const success = <IconCheck stroke={"2"} size={size} />;
  const pending = <IconClockHour9 stroke={"2"} size={size} />;

  switch (transaction.status) {
    case "send-failed":
      return error;
    case "send-successful":
      return pending;
    case "execution-failed":
      return error;
    case "execution-successful":
      return success;
  }
};

export const transactionToColor = (transaction: Transaction) => {
  const error = "red.7";
  const success = "green.7";
  const pending = "yellow.7";

  switch (transaction.status) {
    case "send-failed":
      return error;
    case "send-successful":
      return pending;
    case "execution-failed":
      return error;
    case "execution-successful":
      return success;
  }
};

export const transactionToMessage = (
  transaction: Transaction,
  showHash: boolean = true
) => {
  switch (transaction.type) {
    case "mint":
      return (
        <>
          Minting 100 <b>{tokens[transaction.details.tokenId].ticker}</b> for{" "}
          <b>
            <Box
              sx={{
                display: "inline",
                div: { display: "inline" },
              }}
            >
              <Truncate text={transaction.details.to} offset={6} width={100} />
            </Box>
          </b>
          {/* {transaction.hash && showHash ? (
            <>
              <Flex sx={{ alignItems: "center", cursor: "pointer" }}>
                <IconHash stroke={"2"} size={"0.75rem"} />{" "}
                <Text size={"xs"}>
                  <Truncate
                    text={transaction.hash ?? ""}
                    offset={7}
                    width={120}
                  />
                </Text>
              </Flex>
            </>
          ) : (
            <></>
          )} */}
        </>
      );
    case "sell":
      return (
        <>
          Selling{" "}
          <b>
            {new BigNumber(transaction.details.tokenInAmountIn)
              .div(Math.pow(10, 2))
              .toFixed(2)}{" "}
            {tokens[transaction.details.tokenInId].ticker}
          </b>{" "}
          for minimum of{" "}
          <b>
            {new BigNumber(transaction.details.minTokenBAmountOut)
              .div(Math.pow(10, 2))
              .toFixed(2)}{" "}
            {tokens[transaction.details.tokenOutId].ticker}
          </b>
        </>
      );
    case "buy":
      return (
        <>
          Buying{" "}
          <b>
            {new BigNumber(transaction.details.tokenInAmountOut)
              .div(Math.pow(10, 2))
              .toFixed(2)}{" "}
            {tokens[transaction.details.tokenOutId].ticker}
          </b>{" "}
          for maximum of{" "}
          <b>
            {new BigNumber(transaction.details.maxTokenBAmountIn)
              .div(Math.pow(10, 2))
              .toFixed(2)}{" "}
            {tokens[transaction.details.tokenInId].ticker}
          </b>
        </>
      );
  }
};

export const useNotifyAboutTransactions = () => {
  const transactions = useTransactions();
  const oldTransactions = usePrevious(transactions);

  useEffect(() => {
    const diff = difference(transactions, oldTransactions);

    diff.forEach((transaction) => {
      notifications.show({
        title: transactionToTitle(transaction),
        withCloseButton: true,
        withBorder: true,
        icon: transactionToIcon(transaction),
        color: transactionToColor(transaction),
        message: transactionToMessage(transaction, false),
      });
    });
  }, [transactions, oldTransactions]);
};
