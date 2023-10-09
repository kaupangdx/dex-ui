import { produce } from "immer";
import { api, awaitWorker, worker } from "../services/chain/chain";
import { ImmerStateCreator } from "./store";
import log from "loglevel";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// TODO: export from @proto-kit/sequencer
export type BlockTransactions = Exclude<
  Awaited<ReturnType<typeof api.produceBlock>>,
  undefined
>;

log.setLevel("debug");

const amountOfTransactionsToKeep = 10;

export type TransactionStatus =
  | "send-failed"
  | "send-successful"
  | "execution-successful"
  | "execution-failed";

export interface BaseTransaction<Type extends string, Details> {
  type: Type;
  hash?: string;
  error?: string;
  status: TransactionStatus;
  details: Details;
}
export type Transaction =
  | BaseTransaction<"mint", { to: string; tokenId: string }>
  | BaseTransaction<
      "sell",
      {
        tokenInId: string;
        tokenOutId: string;
        tokenInAmountIn: string;
        minTokenBAmountOut: string;
      }
    >
  | BaseTransaction<
      "buy",
      {
        tokenInId: string;
        tokenOutId: string;
        tokenInAmountOut: string;
        maxTokenBAmountIn: string;
      }
    >;

export interface ChainStore {
  transactions: Transaction[];
  loading: boolean;
  started: boolean;
  block: {
    loading: boolean;
    height: number;
  };
  start: () => Promise<void>;
  mint: (to: string, tokenId: string) => Promise<void>;
  produceBlock: () => Promise<BlockTransactions | undefined>;
  pushTransaction: (transction: Transaction) => void;
  updateTransactionByHash: (hash: string, transaction: Transaction) => void;
  sell: (
    sender: string,
    tokenInId: string,
    tokenOutId: string,
    tokenInAmountIn: string,
    minTokenBAmountOut: string
  ) => Promise<void>;
  buy: (
    sender: string,
    tokenInId: string,
    tokenOutId: string,
    tokenInAmountOut: string,
    maxTokenBAmountIn: string
  ) => Promise<void>;
}

export const findTransactionByHash = (
  transactions: Transaction[],
  hash: string
) => {
  return transactions.find((transaction) => transaction.hash === hash);
};

export const createChainStore: ImmerStateCreator<ChainStore> = (
  set,
  get
): ChainStore => ({
  transactions: [],
  loading: false,
  started: false,
  block: {
    loading: false,
    height: 0,
  },
  start: async () => {
    set(
      produce<ChainStore>((state) => {
        state.loading = true;
      })
    );

    log.debug("Waiting for chain worker to start...");
    await awaitWorker();
    log.debug("Chain worker has started successfully");

    log.debug("Waiting for worker-friendly auro signer to start");
    const { AuroSignerHandler } = await import("@proto-kit/sdk");
    const auroHandler = AuroSignerHandler.fromWorker(worker);
    auroHandler.handleSignRequests();
    log.debug("Worker-friendly auro signer started successfully");

    log.debug("Starting testing app chain");
    await api.start();
    log.debug("App chain started successfully");

    set(
      produce<ChainStore>((state) => {
        state.loading = false;
        state.started = true;
      })
    );
  },
  sell: async (
    sender: string,
    tokenInId: string,
    tokenOutId: string,
    tokenInAmountIn: string,
    minTokenBAmountOut: string
  ) => {
    let hash: string | undefined;

    try {
      hash = await api.sell(
        sender,
        tokenInId,
        tokenOutId,
        tokenInAmountIn,
        minTokenBAmountOut
      );
    } catch (e) {
      get().pushTransaction({
        type: "sell",
        status: "send-failed",
        details: {
          tokenInId,
          tokenOutId,
          tokenInAmountIn,
          minTokenBAmountOut,
        },
      });
      e && console.error(e);
      throw new Error("Failed to send transaction");
    }

    if (hash) {
      get().pushTransaction({
        type: "sell",
        hash,
        status: "send-successful",
        details: {
          tokenInId,
          tokenOutId,
          tokenInAmountIn,
          minTokenBAmountOut,
        },
      });
    }
  },
  buy: async (
    sender: string,
    tokenInId: string,
    tokenOutId: string,
    tokenInAmountOut: string,
    maxTokenBAmountIn: string
  ) => {
    let hash: string | undefined;

    try {
      hash = await api.buy(
        sender,
        tokenInId,
        tokenOutId,
        tokenInAmountOut,
        maxTokenBAmountIn
      );
    } catch (e) {
      get().pushTransaction({
        type: "buy",
        status: "send-failed",
        details: {
          tokenInId,
          tokenOutId,
          tokenInAmountOut,
          maxTokenBAmountIn,
        },
      });
      e && console.error(e);
      throw new Error("Failed to send transaction");
    }

    if (hash) {
      get().pushTransaction({
        type: "buy",
        hash,
        status: "send-successful",
        details: {
          tokenInId,
          tokenOutId,
          tokenInAmountOut,
          maxTokenBAmountIn,
        },
      });
    }
  },
  mint: async (to: string, tokenId: string) => {
    let hash: string | undefined;

    try {
      hash = await api.mint(to, tokenId);
    } catch (e) {
      console.error(e);
      get().pushTransaction({
        type: "mint",
        status: "send-failed",
        details: {
          to,
          tokenId,
        },
      });
    }

    if (hash) {
      get().pushTransaction({
        type: "mint",
        hash,
        status: "send-successful",
        details: {
          to,
          tokenId,
        },
      });
    }
  },
  produceBlock: async () => {
    set(
      produce<ChainStore>((state) => {
        state.block.loading = true;
      })
    );

    let blockTransactions: BlockTransactions | undefined;
    try {
      blockTransactions = await api.produceBlock();
    } catch (e) {
      log.error("There was a an error during produceBlock()", e);
    }

    set(
      produce<ChainStore>((state) => {
        state.block.loading = false;
        if (blockTransactions) {
          state.block.height = state.block.height + 1;
        }
      })
    );
    blockTransactions?.forEach((transaction) => {
      const hash = transaction.hash;
      const foundTransaction = findTransactionByHash(get().transactions, hash);
      if (foundTransaction) {
        get().updateTransactionByHash(hash, {
          ...foundTransaction,
          status: transaction.status
            ? "execution-successful"
            : "execution-failed",
          error: transaction.statusMessage,
        });
      }
    });

    return blockTransactions;
  },
  pushTransaction: (transaction: Transaction) => {
    set(
      produce<ChainStore>((state) => {
        state.transactions.push(transaction);
        state.transactions = state.transactions.slice(
          amountOfTransactionsToKeep * -1
        );
      })
    );
  },
  updateTransactionByHash: (hash: string, updatedTransaction: Transaction) => {
    const transactions = get().transactions;
    const index = transactions.findIndex((tx) => tx.hash === hash);

    set(
      produce<ChainStore>((state) => {
        state.transactions[index] = updatedTransaction;
      })
    );
  },
});

export const useChainStore = create<ChainStore>()(
  devtools(immer(createChainStore))
);

export const useTransactions = () =>
  useChainStore((state) => state.transactions);
