import "@abraham/reflection";

import * as Comlink from "comlink";
import { TestingAppChain } from "@proto-kit/sdk";
import { Balances, XYK } from "dex-runtime";
import { Field, PrivateKey, PublicKey, UInt64 } from "snarkyjs";
import log from "loglevel";
import { decimals } from "../../hooks/balances/useFormatBalance";
import { container } from "tsyringe";
import { RuntimeMethodExecutionContext } from "@proto-kit/protocol";
import { PrivateMempool } from "@proto-kit/sequencer";

type Modules = {
  Balances: typeof Balances.Balances;
  XYK: typeof XYK.XYK;
};

let chain: TestingAppChain<Modules>;

const nonces = {
  signer: -1,
  user: -1,
};
const signerKey = PrivateKey.random();

const initialLiquidity = 100_000_000 * Math.pow(10, 2);
async function createPool() {
  chain.setSigner(signerKey);

  await mint(signerKey.toPublicKey().toBase58(), "0", initialLiquidity);
  await mint(signerKey.toPublicKey().toBase58(), "1", initialLiquidity / 2);

  const tokenIdA = Balances.TokenId.from("0");
  const tokenIdB = Balances.TokenId.from("1");

  nonces.signer++;
  const tx = chain.transaction(
    signerKey.toPublicKey(),
    () => {
      const xyk = chain.runtime.resolve("XYK");
      xyk.createPool(
        tokenIdA,
        tokenIdB,
        Balances.Balance.from(initialLiquidity),
        Balances.Balance.from(initialLiquidity / 2)
      );
    },
    { nonce: nonces.signer }
  );

  await tx.sign();
  await tx.send();

  await produceBlock();

  const pool = await chain.query.runtime.XYK.pools.get(
    XYK.PoolKey.fromTokenIdPair(tokenIdA, tokenIdB)
  );
}

async function start() {
  chain = TestingAppChain.fromRuntime({
    modules: {
      Balances: Balances.Balances,
      XYK: XYK.XYK,
    },
    config: {
      Balances: {},
      XYK: {},
    },
  });

  await chain.start();

  await createPool();

  chain.useAuroSigner();
}

async function mint(
  to: string,
  tokenId: string,
  amount: number = 100 * Math.pow(10, 2)
) {
  if (to === signerKey.toPublicKey().toBase58()) {
    nonces.signer++;
  } else {
    nonces.user++;
  }

  const tx = chain.transaction(
    PublicKey.fromBase58(to),
    () => {
      const balances = chain.runtime.resolve("Balances");

      balances.mint(
        Balances.TokenId.from(tokenId),
        PublicKey.fromBase58(to),
        Balances.Balance.from(amount)
      );
    },
    {
      nonce:
        to === signerKey.toPublicKey().toBase58() ? nonces.signer : nonces.user,
    }
  );

  await tx.sign();
  await tx.send();

  const mempool = chain.sequencer.resolveOrFail("Mempool", PrivateMempool);

  return tx.transaction!.hash().toString();
}

async function produceBlock() {
  console.time("block");

  const mempool = chain.sequencer.resolveOrFail("Mempool", PrivateMempool);

  const block = await chain.produceBlock();
  console.timeEnd("block");
  return block?.txs.map((transaction) => ({
    hash: transaction.tx.hash().toString(),
    status: transaction.status,
    statusMessage: transaction.statusMessage,
  }));
}

async function getBalance(address: string, tokenId: string): Promise<string> {
  const addressPublicKey = PublicKey.fromBase58(address);
  const balance = await chain.query.runtime.Balances.balances.get(
    new Balances.BalancesKey({
      tokenId: Balances.TokenId.from(tokenId),
      address: addressPublicKey,
    })
  );

  return balance?.toString() ?? "0";
}

async function calculateTokenOutAmountOutFromReserves(
  tokenInReserve: string,
  tokenOutReserve: string,
  tokenInAmountIn: string
) {
  const tokenInReserveUInt64 = UInt64.from(tokenInReserve);
  const tokenOutReserveUInt64 = UInt64.from(tokenOutReserve);
  const tokenInAmountInBalance = Balances.Balance.from(tokenInAmountIn);

  const tokenOutAmountOut = chain.runtime
    .resolve("XYK")
    .calculateTokenOutAmountFromReserves(
      tokenInReserveUInt64,
      tokenOutReserveUInt64,
      tokenInAmountInBalance
    );

  return tokenOutAmountOut.toString();
}

async function calculateTokenInAmountInFromReserves(
  tokenInReserve: string,
  tokenOutReserve: string,
  tokenInAmountIn: string
) {
  const tokenInReserveUInt64 = UInt64.from(tokenInReserve);
  const tokenOutReserveUInt64 = UInt64.from(tokenOutReserve);
  const tokenInAmountInBalance = Balances.Balance.from(tokenInAmountIn);

  let tokenOutAmountIn: UInt64 = UInt64.from(0);

  container
    .resolve<RuntimeMethodExecutionContext>(RuntimeMethodExecutionContext)
    .setup({
      transaction: {
        sender: PublicKey.empty(),
        nonce: UInt64.from(0),
        argsHash: Field(0),
      } as any,

      networkState: {
        block: {
          height: UInt64.from(0),
        },
      } as any,
    });

  tokenOutAmountIn = chain.runtime
    .resolve("XYK")
    .calculateTokenInAmountFromReserves(
      tokenInReserveUInt64,
      tokenOutReserveUInt64,
      tokenInAmountInBalance
    );

  return tokenOutAmountIn.toString();
}

async function sell(
  sender: string,
  tokenInId: string,
  tokenOutId: string,
  tokenInAmountIn: string,
  minTokenBAmountOut: string
) {
  nonces.user++;

  const tx = chain.transaction(
    PublicKey.fromBase58(sender),
    () => {
      const xyk = chain.runtime.resolve("XYK");

      xyk.sell(
        Balances.TokenId.from(tokenInId),
        Balances.TokenId.from(tokenOutId),
        Balances.Balance.from(tokenInAmountIn),
        Balances.Balance.from(minTokenBAmountOut)
      );
    },
    { nonce: nonces.user }
  );

  await tx.sign();
  await tx.send();

  return tx.transaction!.hash().toString();
}

async function buy(
  sender: string,
  tokenInId: string,
  tokenOutId: string,
  tokenInAmountOut: string,
  maxTokenBAmountIn: string
) {
  nonces.user++;

  const tx = chain.transaction(
    PublicKey.fromBase58(sender),
    () => {
      const xyk = chain.runtime.resolve("XYK");

      xyk.buy(
        Balances.TokenId.from(tokenInId),
        Balances.TokenId.from(tokenOutId),
        Balances.Balance.from(tokenInAmountOut),
        Balances.Balance.from(maxTokenBAmountIn)
      );
    },
    { nonce: nonces.user }
  );

  await tx.sign();
  await tx.send();

  return tx.transaction!.hash().toString();
}

const api = {
  start,
  mint,
  getBalance,
  produceBlock,
  createPool,
  calculateTokenInAmountInFromReserves,
  calculateTokenOutAmountOutFromReserves,
  sell,
  buy,
  ready: true,
};

export type API = typeof api;

Comlink.expose(api);
self.postMessage("ready");
