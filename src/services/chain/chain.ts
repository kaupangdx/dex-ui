import "@abraham/reflection";
import * as Comlink from "comlink";
import { API } from "./worker";

export const worker = new Worker(
  new URL("./worker.ts?worker&inline", import.meta.url),
  {
    type: "module",
  }
);
export const api = Comlink.wrap<API>(worker);

export const awaitWorker = async () => {
  await new Promise<void>(async (resolve) => {
    const listener = (message: MessageEvent<unknown>) => {
      if (message.data === "ready") {
        worker.removeEventListener("message", listener);
        resolve();
      }
    };
    worker.addEventListener("message", listener);
    const ready = await api.ready;
    if (ready) {
      resolve();
      worker.removeEventListener("message", listener);
    }
  });
};
