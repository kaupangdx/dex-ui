import { P as ProvableTransactionHook, M as ModuleContainer, S as StateServiceProvider, L as Lifecycle, l as log, a as StateTransitionProver, B as BlockProver, N, b as NA, c as ProtocolTransaction, i as ia, H, o as oA, n as notInCircuit, r as rA, C as ConfigurableModule, d as injectable, e as dependency, f as dependencyFactory, D as DependencyFactory, s as scoped, g as inject, _ as _baseGetTag, h as isObject_1, j as _root, k as isObjectLike_1, m as _freeGlobal, p as _Symbol, q as singleton, t as ProvableMethodExecutionContext, R as Runtime, u as BlockProverPublicInput, v as BlockProverExecutionData, w as StateTransitionProverPublicInput, x as ProvableStateTransition, y as RollupMerkleWitness, z as ProvableStateTransitionType, A as L, E as RollupMerkleTree, F as StateTransitionProvableBatch, G as StateTransitionProverPublicOutput, I as NetworkState, J as RuntimeMethodExecutionContext, K as RuntimeTransaction, O as getDefaultExportFromCjs, Q as toInteger_1, T as noop, U as DefaultProvableHashList, V as StateTransitionType, W as constants, X as requireTrue, Y as StateMap, Z as State, $ as instance, a0 as StateTransitionWitnessProviderReference, a1 as __vitePreload, __tla as __tla_0 } from "./index-acdfa0ee.js";
let AppChain, AppChainModule, AppChainTransaction, AuroSigner, AuroSignerHandler, InMemorySigner, InMemoryTransactionSender, QueryBuilderFactory, StateServiceQueryModule, TestingAppChain;
let __tla = Promise.all([
  (() => {
    try {
      return __tla_0;
    } catch {
    }
  })()
]).then(async () => {
  class InMemoryMerkleTreeStorage {
    constructor() {
      this.nodes = {};
    }
    getNode(key, level) {
      var _a;
      return (_a = this.nodes[level]) == null ? void 0 : _a[key.toString()];
    }
    setNode(key, level, value) {
      var _a;
      ((_a = this.nodes)[level] ?? (_a[level] = {}))[key.toString()] = value;
    }
  }
  class NoopTransactionHook extends ProvableTransactionHook {
    onTransaction(executionData) {
    }
  }
  class Protocol extends ModuleContainer {
    static from(modules) {
      const protocol = new Protocol(modules);
      const emptyConfig = Object.keys(modules.modules).reduce((agg, item) => {
        agg[item] = {};
        return agg;
      }, {});
      protocol.configure(emptyConfig);
      return protocol;
    }
    constructor(definition) {
      super(definition);
      this.stateServiceProviderInstance = new StateServiceProvider(this.definition.state);
      this.definition = definition;
      let atLeastOneTransactionHookRegistered = false;
      Object.entries(definition.modules).forEach(([key, value]) => {
        if (Object.prototype.isPrototypeOf.call(ProvableTransactionHook, value)) {
          this.container.register("ProvableTransactionHook", {
            useToken: key
          }, {
            lifecycle: Lifecycle.ContainerScoped
          });
          atLeastOneTransactionHookRegistered = true;
        }
      });
      if (!atLeastOneTransactionHookRegistered) {
        this.container.register("ProvableTransactionHook", {
          useClass: NoopTransactionHook
        }, {
          lifecycle: Lifecycle.ContainerScoped
        });
      }
    }
    get stateService() {
      return this.stateServiceProviderInstance.stateService;
    }
    get stateServiceProvider() {
      return this.stateServiceProviderInstance;
    }
    decorateModule(moduleName, containedModule) {
      log.debug(`Decorated ${moduleName}`);
      containedModule.protocol = this;
      log.debug("Is instanceof:", containedModule instanceof ProvableTransactionHook);
      if (containedModule instanceof ProvableTransactionHook) {
        containedModule.name = moduleName;
      }
      super.decorateModule(moduleName, containedModule);
    }
    get dependencyContainer() {
      return this.container;
    }
    isModule(moduleName) {
      return this.definition.modules[moduleName] !== void 0;
    }
    get blockProver() {
      return this.container.resolve("BlockProver");
    }
    get stateTransitionProver() {
      return this.container.resolve("StateTransitionProver");
    }
  }
  const VanillaProtocol = {
    create(stateService) {
      return VanillaProtocol.from({}, stateService);
    },
    from(additionalModules, stateService) {
      return Protocol.from({
        modules: {
          StateTransitionProver,
          BlockProver,
          ...additionalModules
        },
        state: stateService
      });
    }
  };
  class InMemoryStateService {
    constructor() {
      this.values = {};
    }
    get(key) {
      return this.values[key.toString()];
    }
    set(key, value) {
      if (value === void 0 && Object.prototype.hasOwnProperty.call(this.values, key.toString())) {
        delete this.values[key.toString()];
      } else {
        this.values[key.toString()] = value;
      }
    }
  }
  const errors$6 = {
    fieldLengthNotMatching: (expected, actual) => new Error(`Expected ${expected} field elements, got ${actual}`),
    typeNotCompatible: (name) => new Error(`Cannot decode type ${name}, it has to be either a Struct, CircuitValue or built-in snarkyjs type`)
  };
  class MethodParameterDecoder {
    static fromMethod(target, methodName) {
      const paramtypes = Reflect.getMetadata("design:paramtypes", target, methodName);
      return new MethodParameterDecoder(paramtypes);
    }
    constructor(types) {
      this.types = types;
    }
    fromFields(fields) {
      if (fields.length < this.fieldSize) {
        throw errors$6.fieldLengthNotMatching(this.fieldSize, fields.length);
      }
      let stack = fields.slice();
      return this.types.map((type) => {
        var _a, _b;
        const numberFieldsNeeded = ((_a = type.prototype._fields) == null ? void 0 : _a.length) ?? ((_b = type.sizeInFields) == null ? void 0 : _b.call(type)) ?? -1;
        if (numberFieldsNeeded === -1) {
          throw errors$6.typeNotCompatible(type.name);
        }
        const structFields = stack.slice(0, numberFieldsNeeded);
        stack = stack.slice(numberFieldsNeeded);
        return type.fromFields(structFields);
      });
    }
    get fieldSize() {
      return this.types.map((type) => {
        var _a, _b;
        return ((_a = type.prototype._fields) == null ? void 0 : _a.length) ?? ((_b = type.sizeInFields) == null ? void 0 : _b.call(type)) ?? 0;
      }).reduce((a, b) => a + b, 0);
    }
  }
  function distinctByString(value, index, array) {
    return array.findIndex((it) => it.toString() === value.toString()) === index;
  }
  class ProofTaskSerializer {
    constructor(proofClass) {
      this.proofClass = proofClass;
    }
    toJSON(proof) {
      return JSON.stringify(this.toJSONProof(proof));
    }
    toJSONProof(proof) {
      if (proof.proof === "mock-proof") {
        return {
          publicInput: this.proofClass.publicInputType.toFields(proof.publicInput).map(String),
          publicOutput: this.proofClass.publicOutputType.toFields(proof.publicOutput).map(String),
          maxProofsVerified: proof.maxProofsVerified,
          proof: "mock-proof"
        };
      }
      return proof.toJSON();
    }
    fromJSON(json) {
      return this.fromJSONProof(JSON.parse(json));
    }
    fromJSONProof(jsonProof) {
      if (jsonProof.proof === "mock-proof") {
        const publicInput = this.proofClass.publicInputType.fromFields(jsonProof.publicInput.map(N));
        const publicOutput = this.proofClass.publicOutputType.fromFields(jsonProof.publicOutput.map(N));
        return new this.proofClass({
          publicInput,
          publicOutput,
          proof: "mock-proof",
          maxProofsVerified: jsonProof.maxProofsVerified
        });
      }
      return this.proofClass.fromJSON(jsonProof);
    }
  }
  class PairProofTaskSerializer {
    constructor(proofClass) {
      this.proofClass = proofClass;
      this.proofSerializer = new ProofTaskSerializer(this.proofClass);
    }
    fromJSON(json) {
      const array = JSON.parse(json);
      return [
        this.proofSerializer.fromJSONProof(array[0]),
        this.proofSerializer.fromJSONProof(array[1])
      ];
    }
    toJSON(input) {
      return JSON.stringify(input.map((element) => this.proofSerializer.toJSONProof(element)));
    }
  }
  class UnsignedTransaction {
    constructor(data) {
      this.methodId = data.methodId;
      this.nonce = data.nonce;
      this.sender = data.sender;
      this.args = data.args;
    }
    argsHash() {
      return NA.hash(this.args);
    }
    hash() {
      return NA.hash([
        this.methodId,
        ...this.sender.toFields(),
        ...this.nonce.toFields(),
        this.argsHash()
      ]);
    }
    getSignatureData() {
      return ProtocolTransaction.getSignatureData({
        nonce: this.nonce,
        methodId: this.methodId,
        argsHash: this.argsHash()
      });
    }
    sign(privateKey) {
      const signature = ia.create(privateKey, this.getSignatureData());
      return this.signed(signature);
    }
    signed(signature) {
      return new PendingTransaction({
        methodId: this.methodId,
        sender: this.sender,
        nonce: this.nonce,
        signature,
        args: this.args
      });
    }
  }
  class PendingTransaction extends UnsignedTransaction {
    static fromJSON(object) {
      return new PendingTransaction({
        methodId: N.fromJSON(object.methodId),
        nonce: H.from(object.nonce),
        sender: oA.fromBase58(object.sender),
        args: object.args.map((x) => N.fromJSON(x)),
        signature: ia.fromJSON(object.signature)
      });
    }
    constructor(data) {
      super(data);
      this.signature = data.signature;
    }
    toJSON() {
      return {
        methodId: this.methodId.toJSON(),
        nonce: this.nonce.toString(),
        sender: this.sender.toBase58(),
        args: this.args.map((x) => x.toJSON()),
        signature: {
          r: this.signature.r.toJSON(),
          s: this.signature.s.toJSON()
        }
      };
    }
    toProtocolTransaction() {
      return new ProtocolTransaction({
        methodId: this.methodId,
        nonce: this.nonce,
        argsHash: NA.hash(this.args),
        sender: this.sender,
        signature: this.signature
      });
    }
  }
  var __decorate$l = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$g = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  class CompressedSignature {
    static fromSignature(sig) {
      const scalar = rA.toJSON(sig.s);
      return new CompressedSignature(sig.r, scalar);
    }
    constructor(r, s) {
      this.r = r;
      this.s = s;
    }
    toSignature() {
      const s = rA.fromJSON(this.s);
      return ia.fromObject({
        r: this.r,
        s
      });
    }
  }
  __decorate$l([
    notInCircuit(),
    __metadata$g("design:type", Function),
    __metadata$g("design:paramtypes", []),
    __metadata$g("design:returntype", ia)
  ], CompressedSignature.prototype, "toSignature", null);
  __decorate$l([
    notInCircuit(),
    __metadata$g("design:type", Function),
    __metadata$g("design:paramtypes", [
      ia
    ]),
    __metadata$g("design:returntype", void 0)
  ], CompressedSignature, "fromSignature", null);
  class SequencerModule extends ConfigurableModule {
    constructor() {
      super(...arguments);
      this.isSequencerModule = true;
    }
  }
  SequencerModule.presets = {};
  function sequencerModule() {
    return (target) => {
      injectable()(target);
    };
  }
  class PrivateMempool extends SequencerModule {
    constructor(queue = []) {
      super();
      this.queue = queue;
      this.commitment = N(0);
    }
    validateTx(tx) {
      const valid = tx.signature.verify(tx.sender, tx.getSignatureData());
      return valid.toBoolean();
    }
    add(tx) {
      if (this.validateTx(tx)) {
        this.queue.push(tx);
        this.commitment = NA.hash([
          this.commitment,
          tx.hash()
        ]);
      }
      return {
        transactionsHash: this.commitment
      };
    }
    getTxs() {
      return {
        commitment: {
          transactionsHash: this.commitment
        },
        txs: this.queue
      };
    }
    removeTxs(txs) {
      const { length } = this.queue;
      this.queue = this.queue.filter((tx) => !txs.includes(tx));
      return length === this.queue.length + txs.length;
    }
    async start() {
    }
  }
  const errors$5 = {
    parentIsUndefined: () => new Error("Parent StateService is undefined")
  };
  class CachedStateService extends InMemoryStateService {
    constructor(parent, debugLogs = false) {
      super();
      this.parent = parent;
      this.debugLogs = debugLogs;
    }
    get(key) {
      return super.get(key);
    }
    assertParentNotNull(parent) {
      if (parent === void 0) {
        throw errors$5.parentIsUndefined();
      }
    }
    async preloadKey(key) {
      if (this.parent !== void 0 && this.get(key) === void 0) {
        const value = await this.parent.getAsync(key);
        if (this.debugLogs) {
          log.debug(`Preloading ${key.toString()}: ${(value == null ? void 0 : value.map((element) => element.toString())) ?? []}`);
        }
        this.set(key, value);
      }
    }
    async preloadKeys(keys) {
      await Promise.all(keys.map(async (key) => {
        await this.preloadKey(key);
      }));
    }
    async getAsync(key) {
      var _a;
      return this.get(key) ?? ((_a = this.parent) == null ? void 0 : _a.getAsync(key));
    }
    async setAsync(key, value) {
      this.set(key, value);
    }
    async mergeIntoParent() {
      const { parent, values } = this;
      this.assertParentNotNull(parent);
      const promises = Object.entries(values).map(async (value) => {
        await parent.setAsync(N(value[0]), value[1]);
      });
      await Promise.all(promises);
      this.values = {};
    }
  }
  var __decorate$k = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$f = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  class MockAsyncMerkleTreeStore {
    constructor() {
      this.store = new InMemoryMerkleTreeStorage();
    }
    commit() {
    }
    openTransaction() {
    }
    async getNodeAsync(key, level) {
      return this.store.getNode(key, level);
    }
    async setNodeAsync(key, level, value) {
      this.store.setNode(key, level, value);
    }
  }
  class MockBlockStorage {
    constructor() {
      this.height = 0;
    }
    async getCurrentBlockHeight() {
      return this.height;
    }
    async setBlockHeight(number) {
      this.height = number;
    }
  }
  let MockStorageDependencyFactory = class MockStorageDependencyFactory extends DependencyFactory {
    asyncMerkleStore() {
      return new MockAsyncMerkleTreeStore();
    }
    asyncStateService() {
      return new CachedStateService(void 0);
    }
    blockStorage() {
      return new MockBlockStorage();
    }
  };
  __decorate$k([
    dependency(),
    __metadata$f("design:type", Function),
    __metadata$f("design:paramtypes", []),
    __metadata$f("design:returntype", Object)
  ], MockStorageDependencyFactory.prototype, "asyncMerkleStore", null);
  __decorate$k([
    dependency(),
    __metadata$f("design:type", Function),
    __metadata$f("design:paramtypes", []),
    __metadata$f("design:returntype", Object)
  ], MockStorageDependencyFactory.prototype, "asyncStateService", null);
  __decorate$k([
    dependency(),
    __metadata$f("design:type", Function),
    __metadata$f("design:paramtypes", []),
    __metadata$f("design:returntype", Object)
  ], MockStorageDependencyFactory.prototype, "blockStorage", null);
  MockStorageDependencyFactory = __decorate$k([
    dependencyFactory()
  ], MockStorageDependencyFactory);
  var __decorate$j = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var Sequencer_1;
  let Sequencer = Sequencer_1 = class Sequencer extends ModuleContainer {
    static from(definition) {
      return new Sequencer_1(definition);
    }
    get runtime() {
      return this.container.resolve("Runtime");
    }
    get protocol() {
      return this.container.resolve("Protocol");
    }
    get dependencyContainer() {
      return this.container;
    }
    async start() {
      const factories = [
        MockStorageDependencyFactory
      ];
      this.registerDependencyFactories(factories);
      const moduleClassNames = Object.values(this.definition.modules).map((clazz) => clazz.name);
      log.info("Starting sequencer...");
      log.info("Modules:", moduleClassNames);
      log.info("Factories:", factories.map((clazz) => clazz.name));
      for (const moduleName in this.definition.modules) {
        const sequencerModule2 = this.resolve(moduleName);
        log.info(`Starting sequencer module ${moduleName} (${sequencerModule2.constructor.name})`);
        await sequencerModule2.start();
      }
    }
  };
  Sequencer = Sequencer_1 = __decorate$j([
    injectable()
  ], Sequencer);
  var __decorate$i = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$e = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$b = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  const errors$4 = {
    resolveNotDefined: () => new Error("The resolve callback has not been initialized yet. Call .withFlow() first!")
  };
  let ConnectionHolder = class ConnectionHolder {
    constructor(queueImpl) {
      this.queueImpl = queueImpl;
      this.queues = {};
      this.listeners = {};
    }
    registerListener(flowId, queue, listener) {
      if (this.listeners[queue] === void 0) {
        this.listeners[queue] = {};
      }
      this.listeners[queue][flowId] = listener;
    }
    unregisterListener(flowId, queue) {
      delete this.listeners[queue][flowId];
    }
    async openQueue(name) {
      const queue = await this.queueImpl.getQueue(name);
      await queue.onCompleted(async (payload) => {
        await this.onCompleted(name, payload);
      });
      return queue;
    }
    async onCompleted(name, payload) {
      var _a;
      const listener = (_a = this.listeners[name]) == null ? void 0 : _a[payload.flowId];
      if (listener !== void 0) {
        await listener(payload);
      }
    }
    async getQueue(name) {
      if (this.queues[name] !== void 0) {
        return this.queues[name];
      }
      const queue = await this.openQueue(name);
      this.queues[name] = queue;
      return queue;
    }
    async close() {
    }
  };
  ConnectionHolder = __decorate$i([
    injectable(),
    scoped(Lifecycle.ResolutionScoped),
    __param$b(0, inject("TaskQueue")),
    __metadata$e("design:paramtypes", [
      Object
    ])
  ], ConnectionHolder);
  let FlowCreator = class FlowCreator {
    constructor(connectionHolder) {
      this.connectionHolder = connectionHolder;
    }
    createFlow(flowId, state) {
      return new Flow(this.connectionHolder, flowId, state);
    }
  };
  FlowCreator = __decorate$i([
    injectable(),
    __metadata$e("design:paramtypes", [
      ConnectionHolder
    ])
  ], FlowCreator);
  class Flow {
    constructor(connectionHolder, flowId, state) {
      this.connectionHolder = connectionHolder;
      this.flowId = flowId;
      this.state = state;
      this.erroredOut = false;
      this.registeredListeners = [];
      this.resultsPending = {};
      this.taskCounter = 0;
      this.tasksInProgress = 0;
    }
    waitForResult(queue, taskId, callback) {
      this.resultsPending[taskId] = callback;
      if (!this.registeredListeners.includes(queue)) {
        this.connectionHolder.registerListener(this.flowId, queue, async (payload) => {
          await this.resolveResponse(payload);
        });
        this.registeredListeners.push(queue);
      }
    }
    resolve(result) {
      if (this.resolveFunction === void 0) {
        throw errors$4.resolveNotDefined();
      }
      this.resolveFunction(result);
    }
    async resolveResponse(response) {
      var _a;
      if (response.taskId !== void 0) {
        const resolveFunction = this.resultsPending[response.taskId];
        if (!this.erroredOut) {
          if (response.status === "error") {
            this.erroredOut = true;
            (_a = this.errorFunction) == null ? void 0 : _a.call(this, new Error(`Error in worker: ${response.payload}`));
            return;
          }
          if (resolveFunction !== void 0) {
            delete this.resultsPending[response.taskId];
            resolveFunction(response);
          }
        }
      }
    }
    async pushTask(task, input, completed, overrides) {
      const queueName = task.name;
      const taskName = (overrides == null ? void 0 : overrides.taskName) ?? task.name;
      const queue = await this.connectionHolder.getQueue(queueName);
      const payload = task.inputSerializer().toJSON(input);
      this.taskCounter += 1;
      const taskId = String(this.taskCounter);
      log.debug(`Pushing ${task.name}`);
      await queue.addTask({
        name: taskName,
        taskId,
        flowId: this.flowId,
        payload
      });
      this.tasksInProgress += 1;
      const callback = (returnPayload) => {
        log.debug(`Completed ${returnPayload.name}`);
        const decoded = task.resultSerializer().fromJSON(returnPayload.payload);
        this.tasksInProgress -= 1;
        return completed == null ? void 0 : completed(decoded, input);
      };
      this.waitForResult(queueName, taskId, callback);
    }
    async forEach(inputs, fun) {
      const promises = inputs.map(fun);
      await Promise.all(promises);
    }
    async withFlow(executor) {
      return await new Promise((resolve, reject) => {
        this.resolveFunction = resolve;
        this.errorFunction = reject;
        void executor(resolve, reject);
      });
    }
    async close() {
      this.registeredListeners.forEach((queue) => {
        this.connectionHolder.unregisterListener(this.flowId, queue);
      });
    }
  }
  async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
  class LocalTaskQueue {
    constructor(simulatedDuration) {
      this.simulatedDuration = simulatedDuration;
      this.queues = {};
      this.workers = {};
      this.listeners = {};
    }
    workNextTasks() {
      Object.entries(this.queues).forEach((queue) => {
        const [queueName, tasks] = queue;
        if (tasks.length > 0) {
          tasks.forEach((task) => {
            void this.workers[queueName].handler(task.payload).then((payload) => {
              log.debug("LocalTaskQueue got", JSON.stringify(payload));
              const listenerPromises = this.listeners[queueName].map(async (listener) => {
                await listener(payload);
              });
              void Promise.all(listenerPromises);
            });
          });
        }
        this.queues[queue[0]] = [];
      });
    }
    createWorker(queueName, executor) {
      this.workers[queueName] = {
        busy: false,
        handler: async (data) => {
          await sleep(this.simulatedDuration ?? 0);
          return await executor(data);
        }
      };
      this.workNextTasks();
      return {
        close: async () => {
        }
      };
    }
    async getQueue(queueName) {
      this.queues[queueName] = [];
      let id = 0;
      return {
        name: queueName,
        addTask: async (payload) => {
          id += 1;
          const nextId = String(id).toString();
          this.queues[queueName].push({
            payload,
            taskId: nextId
          });
          this.workNextTasks();
          return {
            taskId: nextId
          };
        },
        onCompleted: async (listener) => {
          var _a;
          ((_a = this.listeners)[queueName] ?? (_a[queueName] = [])).push(listener);
        },
        close: async () => {
        }
      };
    }
  }
  var baseGetTag$2 = _baseGetTag, isObject$2 = isObject_1;
  var asyncTag = "[object AsyncFunction]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
  function isFunction$2(value) {
    if (!isObject$2(value)) {
      return false;
    }
    var tag = baseGetTag$2(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }
  var isFunction_1 = isFunction$2;
  var root$6 = _root;
  var coreJsData$1 = root$6["__core-js_shared__"];
  var _coreJsData = coreJsData$1;
  var coreJsData = _coreJsData;
  var maskSrcKey = function() {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
    return uid ? "Symbol(src)_1." + uid : "";
  }();
  function isMasked$1(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }
  var _isMasked = isMasked$1;
  var funcProto$1 = Function.prototype;
  var funcToString$1 = funcProto$1.toString;
  function toSource$2(func) {
    if (func != null) {
      try {
        return funcToString$1.call(func);
      } catch (e) {
      }
      try {
        return func + "";
      } catch (e) {
      }
    }
    return "";
  }
  var _toSource = toSource$2;
  var isFunction$1 = isFunction_1, isMasked = _isMasked, isObject$1 = isObject_1, toSource$1 = _toSource;
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  var reIsHostCtor = /^\[object .+?Constructor\]$/;
  var funcProto = Function.prototype, objectProto$3 = Object.prototype;
  var funcToString = funcProto.toString;
  var hasOwnProperty$3 = objectProto$3.hasOwnProperty;
  var reIsNative = RegExp("^" + funcToString.call(hasOwnProperty$3).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
  function baseIsNative$1(value) {
    if (!isObject$1(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction$1(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource$1(value));
  }
  var _baseIsNative = baseIsNative$1;
  function getValue$1(object, key) {
    return object == null ? void 0 : object[key];
  }
  var _getValue = getValue$1;
  var baseIsNative = _baseIsNative, getValue = _getValue;
  function getNative$7(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : void 0;
  }
  var _getNative = getNative$7;
  var getNative$6 = _getNative;
  (function() {
    try {
      var func = getNative$6(Object, "defineProperty");
      func({}, "", {});
      return func;
    } catch (e) {
    }
  })();
  var baseGetTag$1 = _baseGetTag, isObjectLike$1 = isObjectLike_1;
  var argsTag = "[object Arguments]";
  function baseIsArguments$1(value) {
    return isObjectLike$1(value) && baseGetTag$1(value) == argsTag;
  }
  var _baseIsArguments = baseIsArguments$1;
  var baseIsArguments = _baseIsArguments, isObjectLike = isObjectLike_1;
  var objectProto$2 = Object.prototype;
  var hasOwnProperty$2 = objectProto$2.hasOwnProperty;
  var propertyIsEnumerable = objectProto$2.propertyIsEnumerable;
  baseIsArguments(function() {
    return arguments;
  }()) ? baseIsArguments : function(value) {
    return isObjectLike(value) && hasOwnProperty$2.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
  };
  var isBuffer = {
    exports: {}
  };
  function stubFalse() {
    return false;
  }
  var stubFalse_1 = stubFalse;
  isBuffer.exports;
  (function(module, exports) {
    var root2 = _root, stubFalse2 = stubFalse_1;
    var freeExports = exports && !exports.nodeType && exports;
    var freeModule = freeExports && true && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var Buffer = moduleExports ? root2.Buffer : void 0;
    var nativeIsBuffer = Buffer ? Buffer.isBuffer : void 0;
    var isBuffer2 = nativeIsBuffer || stubFalse2;
    module.exports = isBuffer2;
  })(isBuffer, isBuffer.exports);
  isBuffer.exports;
  var MAX_SAFE_INTEGER$1 = 9007199254740991;
  var reIsUint = /^(?:0|[1-9]\d*)$/;
  function isIndex$1(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER$1 : length;
    return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
  }
  var _isIndex = isIndex$1;
  var MAX_SAFE_INTEGER = 9007199254740991;
  function isLength$1(value) {
    return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }
  var isLength_1 = isLength$1;
  var _nodeUtil = {
    exports: {}
  };
  _nodeUtil.exports;
  (function(module, exports) {
    var freeGlobal = _freeGlobal;
    var freeExports = exports && !exports.nodeType && exports;
    var freeModule = freeExports && true && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil2 = function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    }();
    module.exports = nodeUtil2;
  })(_nodeUtil, _nodeUtil.exports);
  var _nodeUtilExports = _nodeUtil.exports;
  var nodeUtil = _nodeUtilExports;
  nodeUtil && nodeUtil.isTypedArray;
  var isFunction = isFunction_1, isLength = isLength_1;
  function isArrayLike$1(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }
  var isArrayLike_1 = isArrayLike$1;
  function listCacheClear$1() {
    this.__data__ = [];
    this.size = 0;
  }
  var _listCacheClear = listCacheClear$1;
  function eq$2(value, other) {
    return value === other || value !== value && other !== other;
  }
  var eq_1 = eq$2;
  var eq$1 = eq_1;
  function assocIndexOf$4(array, key) {
    var length = array.length;
    while (length--) {
      if (eq$1(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }
  var _assocIndexOf = assocIndexOf$4;
  var assocIndexOf$3 = _assocIndexOf;
  var arrayProto = Array.prototype;
  var splice = arrayProto.splice;
  function listCacheDelete$1(key) {
    var data = this.__data__, index = assocIndexOf$3(data, key);
    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }
  var _listCacheDelete = listCacheDelete$1;
  var assocIndexOf$2 = _assocIndexOf;
  function listCacheGet$1(key) {
    var data = this.__data__, index = assocIndexOf$2(data, key);
    return index < 0 ? void 0 : data[index][1];
  }
  var _listCacheGet = listCacheGet$1;
  var assocIndexOf$1 = _assocIndexOf;
  function listCacheHas$1(key) {
    return assocIndexOf$1(this.__data__, key) > -1;
  }
  var _listCacheHas = listCacheHas$1;
  var assocIndexOf = _assocIndexOf;
  function listCacheSet$1(key, value) {
    var data = this.__data__, index = assocIndexOf(data, key);
    if (index < 0) {
      ++this.size;
      data.push([
        key,
        value
      ]);
    } else {
      data[index][1] = value;
    }
    return this;
  }
  var _listCacheSet = listCacheSet$1;
  var listCacheClear = _listCacheClear, listCacheDelete = _listCacheDelete, listCacheGet = _listCacheGet, listCacheHas = _listCacheHas, listCacheSet = _listCacheSet;
  function ListCache$4(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  ListCache$4.prototype.clear = listCacheClear;
  ListCache$4.prototype["delete"] = listCacheDelete;
  ListCache$4.prototype.get = listCacheGet;
  ListCache$4.prototype.has = listCacheHas;
  ListCache$4.prototype.set = listCacheSet;
  var _ListCache = ListCache$4;
  var ListCache$3 = _ListCache;
  function stackClear$1() {
    this.__data__ = new ListCache$3();
    this.size = 0;
  }
  var _stackClear = stackClear$1;
  function stackDelete$1(key) {
    var data = this.__data__, result = data["delete"](key);
    this.size = data.size;
    return result;
  }
  var _stackDelete = stackDelete$1;
  function stackGet$1(key) {
    return this.__data__.get(key);
  }
  var _stackGet = stackGet$1;
  function stackHas$1(key) {
    return this.__data__.has(key);
  }
  var _stackHas = stackHas$1;
  var getNative$5 = _getNative, root$5 = _root;
  var Map$3 = getNative$5(root$5, "Map");
  var _Map = Map$3;
  var getNative$4 = _getNative;
  var nativeCreate$4 = getNative$4(Object, "create");
  var _nativeCreate = nativeCreate$4;
  var nativeCreate$3 = _nativeCreate;
  function hashClear$1() {
    this.__data__ = nativeCreate$3 ? nativeCreate$3(null) : {};
    this.size = 0;
  }
  var _hashClear = hashClear$1;
  function hashDelete$1(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }
  var _hashDelete = hashDelete$1;
  var nativeCreate$2 = _nativeCreate;
  var HASH_UNDEFINED$2 = "__lodash_hash_undefined__";
  var objectProto$1 = Object.prototype;
  var hasOwnProperty$1 = objectProto$1.hasOwnProperty;
  function hashGet$1(key) {
    var data = this.__data__;
    if (nativeCreate$2) {
      var result = data[key];
      return result === HASH_UNDEFINED$2 ? void 0 : result;
    }
    return hasOwnProperty$1.call(data, key) ? data[key] : void 0;
  }
  var _hashGet = hashGet$1;
  var nativeCreate$1 = _nativeCreate;
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  function hashHas$1(key) {
    var data = this.__data__;
    return nativeCreate$1 ? data[key] !== void 0 : hasOwnProperty.call(data, key);
  }
  var _hashHas = hashHas$1;
  var nativeCreate = _nativeCreate;
  var HASH_UNDEFINED$1 = "__lodash_hash_undefined__";
  function hashSet$1(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED$1 : value;
    return this;
  }
  var _hashSet = hashSet$1;
  var hashClear = _hashClear, hashDelete = _hashDelete, hashGet = _hashGet, hashHas = _hashHas, hashSet = _hashSet;
  function Hash$1(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  Hash$1.prototype.clear = hashClear;
  Hash$1.prototype["delete"] = hashDelete;
  Hash$1.prototype.get = hashGet;
  Hash$1.prototype.has = hashHas;
  Hash$1.prototype.set = hashSet;
  var _Hash = Hash$1;
  var Hash = _Hash, ListCache$2 = _ListCache, Map$2 = _Map;
  function mapCacheClear$1() {
    this.size = 0;
    this.__data__ = {
      "hash": new Hash(),
      "map": new (Map$2 || ListCache$2)(),
      "string": new Hash()
    };
  }
  var _mapCacheClear = mapCacheClear$1;
  function isKeyable$1(value) {
    var type = typeof value;
    return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
  }
  var _isKeyable = isKeyable$1;
  var isKeyable = _isKeyable;
  function getMapData$4(map, key) {
    var data = map.__data__;
    return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
  }
  var _getMapData = getMapData$4;
  var getMapData$3 = _getMapData;
  function mapCacheDelete$1(key) {
    var result = getMapData$3(this, key)["delete"](key);
    this.size -= result ? 1 : 0;
    return result;
  }
  var _mapCacheDelete = mapCacheDelete$1;
  var getMapData$2 = _getMapData;
  function mapCacheGet$1(key) {
    return getMapData$2(this, key).get(key);
  }
  var _mapCacheGet = mapCacheGet$1;
  var getMapData$1 = _getMapData;
  function mapCacheHas$1(key) {
    return getMapData$1(this, key).has(key);
  }
  var _mapCacheHas = mapCacheHas$1;
  var getMapData = _getMapData;
  function mapCacheSet$1(key, value) {
    var data = getMapData(this, key), size = data.size;
    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }
  var _mapCacheSet = mapCacheSet$1;
  var mapCacheClear = _mapCacheClear, mapCacheDelete = _mapCacheDelete, mapCacheGet = _mapCacheGet, mapCacheHas = _mapCacheHas, mapCacheSet = _mapCacheSet;
  function MapCache$3(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  MapCache$3.prototype.clear = mapCacheClear;
  MapCache$3.prototype["delete"] = mapCacheDelete;
  MapCache$3.prototype.get = mapCacheGet;
  MapCache$3.prototype.has = mapCacheHas;
  MapCache$3.prototype.set = mapCacheSet;
  var _MapCache = MapCache$3;
  var ListCache$1 = _ListCache, Map$1 = _Map, MapCache$2 = _MapCache;
  var LARGE_ARRAY_SIZE = 200;
  function stackSet$1(key, value) {
    var data = this.__data__;
    if (data instanceof ListCache$1) {
      var pairs = data.__data__;
      if (!Map$1 || pairs.length < LARGE_ARRAY_SIZE - 1) {
        pairs.push([
          key,
          value
        ]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new MapCache$2(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }
  var _stackSet = stackSet$1;
  var ListCache = _ListCache, stackClear = _stackClear, stackDelete = _stackDelete, stackGet = _stackGet, stackHas = _stackHas, stackSet = _stackSet;
  function Stack(entries) {
    var data = this.__data__ = new ListCache(entries);
    this.size = data.size;
  }
  Stack.prototype.clear = stackClear;
  Stack.prototype["delete"] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;
  var HASH_UNDEFINED = "__lodash_hash_undefined__";
  function setCacheAdd$1(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }
  var _setCacheAdd = setCacheAdd$1;
  function setCacheHas$1(value) {
    return this.__data__.has(value);
  }
  var _setCacheHas = setCacheHas$1;
  var MapCache$1 = _MapCache, setCacheAdd = _setCacheAdd, setCacheHas = _setCacheHas;
  function SetCache(values) {
    var index = -1, length = values == null ? 0 : values.length;
    this.__data__ = new MapCache$1();
    while (++index < length) {
      this.add(values[index]);
    }
  }
  SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
  SetCache.prototype.has = setCacheHas;
  var root$4 = _root;
  root$4.Uint8Array;
  var Symbol$1 = _Symbol;
  var symbolProto = Symbol$1 ? Symbol$1.prototype : void 0;
  symbolProto ? symbolProto.valueOf : void 0;
  var getNative$3 = _getNative, root$3 = _root;
  var DataView$1 = getNative$3(root$3, "DataView");
  var _DataView = DataView$1;
  var getNative$2 = _getNative, root$2 = _root;
  var Promise$2 = getNative$2(root$2, "Promise");
  var _Promise = Promise$2;
  var getNative$1 = _getNative, root$1 = _root;
  var Set$1 = getNative$1(root$1, "Set");
  var _Set = Set$1;
  var getNative = _getNative, root = _root;
  var WeakMap$1 = getNative(root, "WeakMap");
  var _WeakMap = WeakMap$1;
  var DataView = _DataView, Map = _Map, Promise$1 = _Promise, Set = _Set, WeakMap = _WeakMap, baseGetTag = _baseGetTag, toSource = _toSource;
  var mapTag = "[object Map]", objectTag = "[object Object]", promiseTag = "[object Promise]", setTag = "[object Set]", weakMapTag = "[object WeakMap]";
  var dataViewTag = "[object DataView]";
  var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map), promiseCtorString = toSource(Promise$1), setCtorString = toSource(Set), weakMapCtorString = toSource(WeakMap);
  var getTag = baseGetTag;
  if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map && getTag(new Map()) != mapTag || Promise$1 && getTag(Promise$1.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
    getTag = function(value) {
      var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag;
          case mapCtorString:
            return mapTag;
          case promiseCtorString:
            return promiseTag;
          case setCtorString:
            return setTag;
          case weakMapCtorString:
            return weakMapTag;
        }
      }
      return result;
    };
  }
  var MapCache = _MapCache;
  var FUNC_ERROR_TEXT = "Expected a function";
  function memoize$1(func, resolver) {
    if (typeof func != "function" || resolver != null && typeof resolver != "function") {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function() {
      var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
      if (cache.has(key)) {
        return cache.get(key);
      }
      var result = func.apply(this, args);
      memoized.cache = cache.set(key, result) || cache;
      return result;
    };
    memoized.cache = new (memoize$1.Cache || MapCache)();
    return memoized;
  }
  memoize$1.Cache = MapCache;
  var memoize_1 = memoize$1;
  var memoize = memoize_1;
  var MAX_MEMOIZE_SIZE = 500;
  function memoizeCapped$1(func) {
    var result = memoize(func, function(key) {
      if (cache.size === MAX_MEMOIZE_SIZE) {
        cache.clear();
      }
      return key;
    });
    var cache = result.cache;
    return result;
  }
  var _memoizeCapped = memoizeCapped$1;
  var memoizeCapped = _memoizeCapped;
  var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
  var reEscapeChar = /\\(\\)?/g;
  memoizeCapped(function(string) {
    var result = [];
    if (string.charCodeAt(0) === 46) {
      result.push("");
    }
    string.replace(rePropName, function(match, number, quote, subString) {
      result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
    });
    return result;
  });
  const errors$3 = {
    notComputable: (name) => new Error(`Task ${name} not computable on selected worker`)
  };
  class FlowTaskWorker {
    constructor(mq, tasks) {
      this.tasks = tasks;
      this.workers = [];
      this.queue = mq;
    }
    initHandler(task) {
      const queueName = task.name;
      return this.queue.createWorker(queueName, async (data) => {
        log.debug(`Received task in queue ${queueName}`);
        const input = task.inputSerializer().fromJSON(data.payload);
        try {
          const output = await task.compute(input);
          if (output === void 0) {
            throw errors$3.notComputable(data.name);
          }
          const result = {
            status: "success",
            taskId: data.taskId,
            flowId: data.flowId,
            name: data.name,
            payload: task.resultSerializer().toJSON(output)
          };
          return result;
        } catch (error) {
          const payload = error instanceof Error ? error.message : JSON.stringify(error);
          return {
            status: "error",
            taskId: data.taskId,
            flowId: data.flowId,
            name: data.name,
            payload
          };
        }
      });
    }
    async start() {
      for (const task of this.tasks) {
        await task.prepare();
      }
      this.workers = this.tasks.map((task) => this.initHandler(task));
    }
    async close() {
      await Promise.all(this.workers.map(async (worker) => {
        await worker.close();
      }));
    }
  }
  var __decorate$h = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  let CompileRegistry = class CompileRegistry {
    constructor() {
      this.compilationPromises = {};
    }
    async compile(name, zkProgram) {
      if (this.compilationPromises[name] === void 0) {
        this.compilationPromises[name] = zkProgram.compile();
      }
      await this.compilationPromises[name];
    }
  };
  CompileRegistry = __decorate$h([
    injectable(),
    singleton()
  ], CompileRegistry);
  class PreFilledStateService extends InMemoryStateService {
    constructor(values) {
      super();
      this.values = values;
    }
  }
  var __decorate$g = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$d = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$a = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  let BlockReductionTask = class BlockReductionTask {
    constructor(protocol, executionContext, compileRegistry) {
      this.protocol = protocol;
      this.executionContext = executionContext;
      this.compileRegistry = compileRegistry;
      this.name = "blockReduction";
      this.blockProver = this.protocol.blockProver;
    }
    inputSerializer() {
      return new PairProofTaskSerializer(this.blockProver.zkProgrammable.zkProgram.Proof);
    }
    resultSerializer() {
      return new ProofTaskSerializer(this.blockProver.zkProgrammable.zkProgram.Proof);
    }
    async compute(input) {
      const [r1, r2] = input;
      this.blockProver.merge(r1.publicInput, r1, r2);
      return await this.executionContext.current().result.prove();
    }
    async prepare() {
      await this.compileRegistry.compile("BlockProver", this.blockProver.zkProgrammable.zkProgram);
    }
  };
  BlockReductionTask = __decorate$g([
    injectable(),
    scoped(Lifecycle.ContainerScoped),
    __param$a(0, inject("Protocol")),
    __metadata$d("design:paramtypes", [
      Protocol,
      ProvableMethodExecutionContext,
      CompileRegistry
    ])
  ], BlockReductionTask);
  let BlockProvingTask = class BlockProvingTask {
    constructor(protocol, runtime, executionContext, compileRegistry) {
      this.protocol = protocol;
      this.runtime = runtime;
      this.executionContext = executionContext;
      this.compileRegistry = compileRegistry;
      this.runtimeProofType = this.runtime.zkProgrammable.zkProgram.Proof;
      this.name = "block";
      this.stateTransitionProver = protocol.stateTransitionProver;
      this.blockProver = this.protocol.blockProver;
    }
    inputSerializer() {
      const stProofSerializer = new ProofTaskSerializer(this.stateTransitionProver.zkProgrammable.zkProgram.Proof);
      const runtimeProofSerializer = new ProofTaskSerializer(this.runtimeProofType);
      return {
        toJSON(input) {
          const jsonReadyObject = {
            input1: stProofSerializer.toJSON(input.input1),
            input2: runtimeProofSerializer.toJSON(input.input2),
            params: {
              publicInput: BlockProverPublicInput.toJSON(input.params.publicInput),
              executionData: BlockProverExecutionData.toJSON(input.params.executionData),
              startingState: Object.fromEntries(Object.entries(input.params.startingState).map(([key, value]) => [
                key,
                value == null ? void 0 : value.map((field) => field.toString())
              ]))
            }
          };
          return JSON.stringify(jsonReadyObject);
        },
        fromJSON(json) {
          const jsonReadyObject = JSON.parse(json);
          return {
            input1: stProofSerializer.fromJSON(jsonReadyObject.input1),
            input2: runtimeProofSerializer.fromJSON(jsonReadyObject.input2),
            params: {
              publicInput: BlockProverPublicInput.fromJSON(jsonReadyObject.params.publicInput),
              executionData: BlockProverExecutionData.fromJSON(jsonReadyObject.params.executionData),
              startingState: Object.fromEntries(Object.entries(jsonReadyObject.params.startingState).map(([key, value]) => [
                key,
                value == null ? void 0 : value.map((encodedField) => N(encodedField))
              ]))
            }
          };
        }
      };
    }
    resultSerializer() {
      return new ProofTaskSerializer(this.blockProver.zkProgrammable.zkProgram.Proof);
    }
    async compute(input) {
      const stateTransitionProof = input.input1;
      const runtimeProof = input.input2;
      const prefilledStateService = new PreFilledStateService(input.params.startingState);
      this.protocol.stateServiceProvider.setCurrentStateService(prefilledStateService);
      this.blockProver.proveTransaction(input.params.publicInput, stateTransitionProof, runtimeProof, input.params.executionData);
      this.protocol.stateServiceProvider.popCurrentStateService();
      return await this.executionContext.current().result.prove();
    }
    async prepare() {
      await this.compileRegistry.compile("BlockProver", this.blockProver.zkProgrammable.zkProgram);
    }
  };
  BlockProvingTask = __decorate$g([
    injectable(),
    scoped(Lifecycle.ContainerScoped),
    __param$a(0, inject("Protocol")),
    __param$a(1, inject("Runtime")),
    __metadata$d("design:paramtypes", [
      Protocol,
      Runtime,
      ProvableMethodExecutionContext,
      CompileRegistry
    ])
  ], BlockProvingTask);
  class StateTransitionParametersSerializer {
    toJSON(parameters) {
      return JSON.stringify({
        publicInput: StateTransitionProverPublicInput.toJSON(parameters.publicInput),
        stateTransitions: parameters.stateTransitions.map((st) => {
          return {
            transition: ProvableStateTransition.toJSON(st.transition),
            type: st.type.type.toBoolean()
          };
        }),
        merkleWitnesses: parameters.merkleWitnesses.map((witness) => RollupMerkleWitness.toJSON(witness))
      });
    }
    fromJSON(json) {
      const parsed = JSON.parse(json);
      return {
        publicInput: StateTransitionProverPublicInput.fromJSON(parsed.publicInput),
        stateTransitions: parsed.stateTransitions.map((st) => {
          return {
            transition: new ProvableStateTransition(ProvableStateTransition.fromJSON(st.transition)),
            type: new ProvableStateTransitionType({
              type: L(st.type)
            })
          };
        }),
        merkleWitnesses: parsed.merkleWitnesses.map((witness) => new RollupMerkleWitness(RollupMerkleWitness.fromJSON(witness)))
      };
    }
  }
  const errors$2 = {
    noWitnessAvailable: () => new Error("No new witnesses are available, prefill empty"),
    keysDoNotMatch: () => new Error("Key of provided witness and request do not match")
  };
  class PreFilledWitnessProvider {
    constructor(witnesses) {
      this.cursor = 0;
      this.witnesses = witnesses;
    }
    getWitness(key) {
      if (key.equals(N(0)).toBoolean()) {
        return new RollupMerkleTree(new InMemoryMerkleTreeStorage()).getWitness(BigInt(0));
      }
      const witness = this.witnesses[this.cursor % this.witnesses.length];
      const computedKey = witness.calculateIndex();
      if (!computedKey.equals(key).toBoolean()) {
        throw errors$2.keysDoNotMatch();
      }
      this.cursor += 1;
      return witness;
    }
  }
  var __decorate$f = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$c = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$9 = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  let StateTransitionTask = class StateTransitionTask {
    constructor(protocol, executionContext, compileRegistry) {
      this.protocol = protocol;
      this.executionContext = executionContext;
      this.compileRegistry = compileRegistry;
      this.name = "stateTransitionProof";
      this.stateTransitionProver = this.protocol.stateTransitionProver;
    }
    inputSerializer() {
      return new StateTransitionParametersSerializer();
    }
    resultSerializer() {
      return new ProofTaskSerializer(this.stateTransitionProver.zkProgrammable.zkProgram.Proof);
    }
    async compute(input) {
      const witnessProvider = new PreFilledWitnessProvider(input.merkleWitnesses);
      const { witnessProviderReference } = this.stateTransitionProver;
      const previousProvider = witnessProviderReference.getWitnessProvider();
      witnessProviderReference.setWitnessProvider(witnessProvider);
      const stBatch = input.stateTransitions.slice();
      const output = this.stateTransitionProver.runBatch(input.publicInput, StateTransitionProvableBatch.fromMappings(stBatch));
      log.debug("STTask public io:", {
        input: StateTransitionProverPublicInput.toJSON(input.publicInput),
        output: StateTransitionProverPublicOutput.toJSON(output)
      });
      const proof = await this.executionContext.current().result.prove();
      if (previousProvider !== void 0) {
        witnessProviderReference.setWitnessProvider(previousProvider);
      }
      return proof;
    }
    async prepare() {
      await this.compileRegistry.compile("StateTransitionProver", this.stateTransitionProver.zkProgrammable.zkProgram);
    }
  };
  StateTransitionTask = __decorate$f([
    injectable(),
    scoped(Lifecycle.ContainerScoped),
    __param$9(0, inject("Protocol")),
    __metadata$c("design:paramtypes", [
      Protocol,
      ProvableMethodExecutionContext,
      CompileRegistry
    ])
  ], StateTransitionTask);
  let StateTransitionReductionTask = class StateTransitionReductionTask {
    constructor(protocol, executionContext, compileRegistry) {
      this.protocol = protocol;
      this.executionContext = executionContext;
      this.compileRegistry = compileRegistry;
      this.name = "stateTransitionReduction";
      this.stateTransitionProver = this.protocol.stateTransitionProver;
    }
    inputSerializer() {
      return new PairProofTaskSerializer(this.stateTransitionProver.zkProgrammable.zkProgram.Proof);
    }
    resultSerializer() {
      return new ProofTaskSerializer(this.stateTransitionProver.zkProgrammable.zkProgram.Proof);
    }
    async compute(input) {
      const [r1, r2] = input;
      this.stateTransitionProver.merge(r1.publicInput, r1, r2);
      return await this.executionContext.current().result.prove();
    }
    async prepare() {
      await this.compileRegistry.compile("StateTransitionProver", this.stateTransitionProver.zkProgrammable.zkProgram);
    }
  };
  StateTransitionReductionTask = __decorate$f([
    injectable(),
    scoped(Lifecycle.ContainerScoped),
    __param$9(0, inject("Protocol")),
    __metadata$c("design:paramtypes", [
      Protocol,
      ProvableMethodExecutionContext,
      CompileRegistry
    ])
  ], StateTransitionReductionTask);
  class RuntimeProofParametersSerializer {
    toJSON(parameters) {
      const jsonReadyObject = {
        tx: parameters.tx.toJSON(),
        networkState: NetworkState.toJSON(parameters.networkState),
        state: Object.fromEntries(Object.entries(parameters.state).map(([key, value]) => [
          key,
          value == null ? void 0 : value.map((v) => v.toString())
        ]))
      };
      return JSON.stringify(jsonReadyObject);
    }
    fromJSON(json) {
      const jsonReadyObject = JSON.parse(json);
      return {
        tx: PendingTransaction.fromJSON(jsonReadyObject.tx),
        networkState: new NetworkState(NetworkState.fromJSON(jsonReadyObject.networkState)),
        state: Object.fromEntries(Object.entries(jsonReadyObject.state).map(([key, values]) => [
          key,
          values == null ? void 0 : values.map((encodedField) => N(encodedField))
        ]))
      };
    }
  }
  var __decorate$e = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$b = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$8 = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  let RuntimeProvingTask = class RuntimeProvingTask {
    constructor(runtime, executionContext) {
      this.runtime = runtime;
      this.executionContext = executionContext;
      this.runtimeZkProgrammable = this.runtime.zkProgrammable.zkProgram;
      this.name = "runtimeProof";
    }
    inputSerializer() {
      return new RuntimeProofParametersSerializer();
    }
    resultSerializer() {
      return new ProofTaskSerializer(this.runtimeZkProgrammable.Proof);
    }
    async compute(input) {
      const method = this.runtime.getMethodById(input.tx.methodId.toBigInt());
      const methodDescriptors = this.runtime.dependencyContainer.resolve("MethodIdResolver").getMethodNameFromId(input.tx.methodId.toBigInt());
      if (methodDescriptors === void 0 || method === void 0) {
        throw new Error(`MethodId not found ${input.tx.methodId.toString()}`);
      }
      const [moduleName, methodName] = methodDescriptors;
      const parameterDecoder = MethodParameterDecoder.fromMethod(this.runtime.resolve(moduleName), methodName);
      const decodedArguments = parameterDecoder.fromFields(input.tx.args);
      const prefilledStateService = new PreFilledStateService(input.state);
      this.runtime.stateServiceProvider.setCurrentStateService(prefilledStateService);
      const transaction = RuntimeTransaction.fromProtocolTransaction(input.tx.toProtocolTransaction());
      const contextInputs = {
        networkState: input.networkState,
        transaction
      };
      this.executionContext.setup(contextInputs);
      method(...decodedArguments);
      const { result } = this.executionContext.current();
      this.executionContext.setup(contextInputs);
      const proof = await result.prove();
      this.runtime.stateServiceProvider.popCurrentStateService();
      return proof;
    }
    async prepare() {
      await this.runtimeZkProgrammable.compile();
    }
  };
  RuntimeProvingTask = __decorate$e([
    injectable(),
    scoped(Lifecycle.ContainerScoped),
    __param$8(0, inject("Runtime")),
    __metadata$b("design:paramtypes", [
      Runtime,
      RuntimeMethodExecutionContext
    ])
  ], RuntimeProvingTask);
  var __decorate$d = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$a = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$7 = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  let LocalTaskWorkerModule = class LocalTaskWorkerModule extends SequencerModule {
    constructor(taskQueue, stateTransitionTask, stateTransitionReductionTask, runtimeProvingTask, blockProvingTask, blockReductionTask, protocol) {
      super();
      this.taskQueue = taskQueue;
      this.stateTransitionTask = stateTransitionTask;
      this.stateTransitionReductionTask = stateTransitionReductionTask;
      this.runtimeProvingTask = runtimeProvingTask;
      this.blockProvingTask = blockProvingTask;
      this.blockReductionTask = blockReductionTask;
      this.protocol = protocol;
    }
    async start() {
      const worker = new FlowTaskWorker(this.taskQueue, [
        this.stateTransitionTask,
        this.stateTransitionReductionTask,
        this.runtimeProvingTask,
        this.blockProvingTask,
        this.blockReductionTask
      ]);
      worker.start().then(() => {
      }).catch((error) => {
        console.error(error);
      });
    }
  };
  LocalTaskWorkerModule = __decorate$d([
    sequencerModule(),
    __param$7(0, inject("TaskQueue")),
    __param$7(6, inject("Protocol")),
    __metadata$a("design:paramtypes", [
      Object,
      StateTransitionTask,
      StateTransitionReductionTask,
      RuntimeProvingTask,
      BlockProvingTask,
      BlockReductionTask,
      Protocol
    ])
  ], LocalTaskWorkerModule);
  var __decorate$c = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  let NoopBaseLayer = class NoopBaseLayer extends SequencerModule {
    async blockProduced() {
    }
    async start() {
    }
  };
  NoopBaseLayer = __decorate$c([
    sequencerModule()
  ], NoopBaseLayer);
  class DummyStateService {
    get(key) {
      return void 0;
    }
    set(key, value) {
    }
  }
  var __decorate$b = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$9 = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  let MerkleStoreWitnessProvider = class MerkleStoreWitnessProvider {
    constructor(merkleStore) {
      this.merkleStore = merkleStore;
      this.tree = new RollupMerkleTree(this.merkleStore);
    }
    getWitness(key) {
      return this.tree.getWitness(key.toBigInt());
    }
  };
  MerkleStoreWitnessProvider = __decorate$b([
    injectable(),
    __metadata$9("design:paramtypes", [
      Object
    ])
  ], MerkleStoreWitnessProvider);
  function baseSlice$1(array, start, end) {
    var index = -1, length = array.length;
    if (start < 0) {
      start = -start > length ? 0 : length + start;
    }
    end = end > length ? length : end;
    if (end < 0) {
      end += length;
    }
    length = start > end ? 0 : end - start >>> 0;
    start >>>= 0;
    var result = Array(length);
    while (++index < length) {
      result[index] = array[index + start];
    }
    return result;
  }
  var _baseSlice = baseSlice$1;
  var eq = eq_1, isArrayLike = isArrayLike_1, isIndex = _isIndex, isObject = isObject_1;
  function isIterateeCall$1(value, index, object) {
    if (!isObject(object)) {
      return false;
    }
    var type = typeof index;
    if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && index in object) {
      return eq(object[index], value);
    }
    return false;
  }
  var _isIterateeCall = isIterateeCall$1;
  var baseSlice = _baseSlice, isIterateeCall = _isIterateeCall, toInteger = toInteger_1;
  var nativeCeil = Math.ceil, nativeMax = Math.max;
  function chunk(array, size, guard) {
    if (guard ? isIterateeCall(array, size, guard) : size === void 0) {
      size = 1;
    } else {
      size = nativeMax(toInteger(size), 0);
    }
    var length = array == null ? 0 : array.length;
    if (!length || size < 1) {
      return [];
    }
    var index = 0, resIndex = 0, result = Array(nativeCeil(length / size));
    while (index < length) {
      result[resIndex++] = baseSlice(array, index, index += size);
    }
    return result;
  }
  var chunk_1 = chunk;
  const chunk$1 = getDefaultExportFromCjs(chunk_1);
  class CachedMerkleTreeStore extends InMemoryMerkleTreeStorage {
    constructor(parent) {
      super();
      this.parent = parent;
      this.writeCache = {};
      this.openTransaction = noop;
      this.commit = noop;
    }
    getNode(key, level) {
      return super.getNode(key, level);
    }
    setNode(key, level, value) {
      var _a;
      super.setNode(key, level, value);
      ((_a = this.writeCache)[level] ?? (_a[level] = {}))[key.toString()] = value;
    }
    getWrittenNodes() {
      return this.writeCache;
    }
    resetWrittenNodes() {
      this.writeCache = {};
    }
    async preloadKey(index) {
      const { leafCount, height } = RollupMerkleTree;
      if (index >= leafCount) {
        index %= leafCount;
      }
      for (let level = 0; level < height; level++) {
        const key = index;
        const isLeft = index % 2n === 0n;
        const siblingKey = isLeft ? index + 1n : index - 1n;
        if (this.getNode(key, level) === void 0) {
          const value = await this.parent.getNodeAsync(key, level);
          if (level === 0) {
            log.debug(`Preloaded ${key} @ ${level} -> ${value ?? "-"}`);
          }
          if (value !== void 0) {
            this.setNode(key, level, value);
          }
        }
        if (this.getNode(siblingKey, level) === void 0) {
          const sibling = await this.parent.getNodeAsync(siblingKey, level);
          if (sibling !== void 0) {
            this.setNode(siblingKey, level, sibling);
          }
        }
        index /= 2n;
      }
    }
    async mergeIntoParent() {
      if (Object.keys(this.writeCache).length === 0) {
        return;
      }
      this.parent.openTransaction();
      const { height } = RollupMerkleTree;
      const nodes = this.getWrittenNodes();
      const promises = Array.from({
        length: height
      }).flatMap((ignored, level) => Object.entries(nodes[level]).map(async (entry) => {
        await this.parent.setNodeAsync(BigInt(entry[0]), level, entry[1]);
      }));
      await Promise.all(promises);
      this.parent.commit();
      this.resetWrittenNodes();
    }
    async setNodeAsync(key, level, value) {
      this.setNode(key, level, value);
    }
    async getNodeAsync(key, level) {
      return this.getNode(key, level) ?? await this.parent.getNodeAsync(key, level);
    }
  }
  class SyncCachedMerkleTreeStore extends InMemoryMerkleTreeStorage {
    constructor(parent) {
      super();
      this.parent = parent;
      this.writeCache = {};
    }
    getNode(key, level) {
      return super.getNode(key, level) ?? this.parent.getNode(key, level);
    }
    setNode(key, level, value) {
      var _a;
      super.setNode(key, level, value);
      ((_a = this.writeCache)[level] ?? (_a[level] = {}))[key.toString()] = value;
    }
    mergeIntoParent() {
      if (Object.keys(this.writeCache).length === 0) {
        return;
      }
      const { height } = RollupMerkleTree;
      const nodes = this.writeCache;
      Array.from({
        length: height
      }).forEach((ignored, level) => Object.entries(nodes[level]).forEach((entry) => {
        this.parent.setNode(BigInt(entry[0]), level, entry[1]);
      }));
      this.writeCache = {};
    }
  }
  var __decorate$a = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$8 = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$6 = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  const errors$1 = {
    methodIdNotFound: (methodId) => new Error(`Can't find runtime method with id ${methodId}`)
  };
  let TransactionTraceService = class TransactionTraceService {
    constructor(runtime, protocol) {
      this.runtime = runtime;
      this.protocol = protocol;
      this.dummyStateService = new DummyStateService();
      this.transactionHooks = protocol.dependencyContainer.resolveAll("ProvableTransactionHook");
    }
    allKeys(stateTransitions) {
      return stateTransitions.map((st) => st.path).filter(distinctByString);
    }
    decodeTransaction(tx) {
      const methodDescriptors = this.runtime.dependencyContainer.resolve("MethodIdResolver").getMethodNameFromId(tx.methodId.toBigInt());
      const method = this.runtime.getMethodById(tx.methodId.toBigInt());
      if (methodDescriptors === void 0 || method === void 0) {
        throw errors$1.methodIdNotFound(tx.methodId.toString());
      }
      const [moduleName, methodName] = methodDescriptors;
      const module = this.runtime.resolve(moduleName);
      const parameterDecoder = MethodParameterDecoder.fromMethod(module, methodName);
      const args = parameterDecoder.fromFields(tx.args);
      return {
        method,
        args,
        module
      };
    }
    retrieveStateRecord(stateService, keys) {
      return keys.map((key) => [
        key.toString(),
        stateService.get(key)
      ]).reduce((a, b) => {
        const [recordKey, value] = b;
        a[recordKey] = value;
        return a;
      }, {});
    }
    async applyTransitions(stateService, stateTransitions) {
      await Promise.all(stateTransitions.filter((st) => st.to.isSome.toBoolean()).map(async (st) => {
        await stateService.setAsync(st.path, st.to.toFields());
      }));
    }
    getAppChainForModule(module) {
      if (module.runtime === void 0) {
        throw new Error("Runtime on RuntimeModule not set");
      }
      if (module.runtime.appChain === void 0) {
        throw new Error("AppChain on Runtime not set");
      }
      const { appChain } = module.runtime;
      return appChain;
    }
    async createTrace(tx, stateServices, networkState, bundleTracker) {
      const { executionResult, startingState } = await this.createExecutionTrace(stateServices.stateService, tx, networkState);
      const { stateTransitions, protocolTransitions, status, statusMessage } = executionResult;
      const { stParameters, fromStateRoot } = await this.createMerkleTrace(stateServices.merkleStore, stateTransitions, protocolTransitions, status.toBoolean());
      const transactionsHash = bundleTracker.commitment;
      bundleTracker.push(tx.hash());
      const trace = {
        runtimeProver: {
          tx,
          state: startingState.runtime,
          networkState
        },
        stateTransitionProver: stParameters,
        blockProver: {
          publicInput: {
            stateRoot: fromStateRoot,
            transactionsHash,
            networkStateHash: networkState.hash()
          },
          executionData: {
            networkState,
            transaction: tx.toProtocolTransaction()
          },
          startingState: startingState.protocol
        }
      };
      return {
        trace,
        computedTxs: {
          tx,
          status: status.toBoolean(),
          statusMessage
        }
      };
    }
    async createMerkleTrace(merkleStore, stateTransitions, protocolTransitions, runtimeSuccess) {
      const keys = this.allKeys(protocolTransitions.concat(stateTransitions));
      const runtimeSimulationMerkleStore = new SyncCachedMerkleTreeStore(merkleStore);
      await Promise.all(keys.map(async (key) => {
        await merkleStore.preloadKey(key.toBigInt());
      }));
      const tree = new RollupMerkleTree(merkleStore);
      const runtimeTree = new RollupMerkleTree(runtimeSimulationMerkleStore);
      const initialRoot = tree.getRoot();
      const transitionsList = new DefaultProvableHashList(ProvableStateTransition);
      const protocolTransitionsList = new DefaultProvableHashList(ProvableStateTransition);
      const allTransitions = protocolTransitions.map((protocolTransition) => [
        protocolTransition,
        StateTransitionType.protocol
      ]).concat(stateTransitions.map((transition) => [
        transition,
        StateTransitionType.normal
      ]));
      let stateRoot = initialRoot;
      let protocolStateRoot = initialRoot;
      const stParameters = chunk$1(allTransitions, constants.stateTransitionProverBatchSize).map((currentChunk, index) => {
        const fromStateRoot = stateRoot;
        const fromProtocolStateRoot = protocolStateRoot;
        const stateTransitionsHash = transitionsList.commitment;
        const protocolTransitionsHash = protocolTransitionsList.commitment;
        const merkleWitnesses = currentChunk.map(([transition, type]) => {
          const usedTree = StateTransitionType.isProtocol(type) ? tree : runtimeTree;
          const provableTransition = transition.toProvable();
          const witness = usedTree.getWitness(provableTransition.path.toBigInt());
          if (provableTransition.to.isSome.toBoolean()) {
            usedTree.setLeaf(provableTransition.path.toBigInt(), provableTransition.to.value);
            stateRoot = usedTree.getRoot();
            if (StateTransitionType.isProtocol(type)) {
              protocolStateRoot = stateRoot;
            }
          }
          (StateTransitionType.isNormal(type) ? transitionsList : protocolTransitionsList).pushIf(provableTransition, provableTransition.path.equals(N(0)).not());
          return witness;
        });
        return {
          merkleWitnesses,
          stateTransitions: currentChunk.map(([st, type]) => {
            return {
              transition: st.toProvable(),
              type: new ProvableStateTransitionType({
                type: L(type)
              })
            };
          }),
          publicInput: {
            stateRoot: fromStateRoot,
            protocolStateRoot: fromProtocolStateRoot,
            stateTransitionsHash,
            protocolTransitionsHash
          }
        };
      });
      if (runtimeSuccess) {
        runtimeSimulationMerkleStore.mergeIntoParent();
      }
      return {
        stParameters,
        fromStateRoot: initialRoot
      };
    }
    executeRuntimeMethod(method, args, contextInputs) {
      const executionContext = this.runtime.dependencyContainer.resolve(RuntimeMethodExecutionContext);
      executionContext.setup(contextInputs);
      method(...args);
      const runtimeResult = executionContext.current().result;
      executionContext.afterMethod();
      executionContext.clear();
      return runtimeResult;
    }
    async simulateMultiRound(method, contextInputs, parentStateService) {
      const executionContext = this.runtime.dependencyContainer.resolve(RuntimeMethodExecutionContext);
      let numberMethodSTs;
      let collectedSTs = 0;
      const touchedKeys = [];
      let lastRuntimeResult;
      do {
        executionContext.setup(contextInputs);
        executionContext.setSimulated(true);
        const stateService = new CachedStateService(parentStateService);
        this.runtime.stateServiceProvider.setCurrentStateService(stateService);
        this.protocol.stateServiceProvider.setCurrentStateService(stateService);
        await stateService.preloadKeys(touchedKeys.map((fieldString) => N(fieldString)));
        method();
        lastRuntimeResult = executionContext.current().result;
        executionContext.afterMethod();
        executionContext.clear();
        const { stateTransitions } = lastRuntimeResult;
        const latestST = stateTransitions.at(collectedSTs);
        if (latestST !== void 0 && !touchedKeys.includes(latestST.path.toString())) {
          touchedKeys.push(latestST.path.toString());
        }
        if (numberMethodSTs === void 0) {
          numberMethodSTs = stateTransitions.length;
        }
        collectedSTs += 1;
        this.runtime.stateServiceProvider.popCurrentStateService();
        this.protocol.stateServiceProvider.popCurrentStateService();
      } while (collectedSTs < numberMethodSTs);
      return lastRuntimeResult;
    }
    executeProtocolHooks(runtimeContextInputs, blockContextInputs, runUnchecked = false) {
      const executionContext = this.runtime.dependencyContainer.resolve(RuntimeMethodExecutionContext);
      executionContext.setup(runtimeContextInputs);
      if (runUnchecked) {
        executionContext.setSimulated(true);
      }
      this.transactionHooks.forEach((transactionHook) => {
        transactionHook.onTransaction(blockContextInputs);
      });
      const protocolResult = executionContext.current().result;
      executionContext.afterMethod();
      executionContext.clear();
      return protocolResult;
    }
    async extractAccessedKeys(method, args, runtimeContextInputs, blockContextInputs, parentStateService) {
      const { stateTransitions } = await this.simulateMultiRound(() => {
        method(...args);
      }, runtimeContextInputs, parentStateService);
      const protocolSimulationResult = await this.simulateMultiRound(() => {
        this.transactionHooks.forEach((transactionHook) => {
          transactionHook.onTransaction(blockContextInputs);
        });
      }, runtimeContextInputs, parentStateService);
      const protocolTransitions = protocolSimulationResult.stateTransitions;
      log.debug(`Got ${stateTransitions.length} StateTransitions`);
      log.debug(`Got ${protocolTransitions.length} ProtocolStateTransitions`);
      return {
        runtimeKeys: this.allKeys(stateTransitions),
        protocolKeys: this.allKeys(protocolTransitions)
      };
    }
    async createExecutionTrace(stateService, tx, networkState) {
      const { method, args, module } = this.decodeTransaction(tx);
      const appChain = this.getAppChainForModule(module);
      const previousProofsEnabled = appChain.areProofsEnabled;
      appChain.setProofsEnabled(false);
      const blockContextInputs = {
        transaction: tx.toProtocolTransaction(),
        networkState
      };
      const runtimeContextInputs = {
        networkState,
        transaction: RuntimeTransaction.fromProtocolTransaction(blockContextInputs.transaction)
      };
      const { runtimeKeys, protocolKeys } = await this.extractAccessedKeys(method, args, runtimeContextInputs, blockContextInputs, stateService);
      await stateService.preloadKeys(runtimeKeys.concat(protocolKeys).filter(distinctByString));
      this.runtime.stateServiceProvider.setCurrentStateService(stateService);
      this.protocol.stateServiceProvider.setCurrentStateService(stateService);
      const startingProtocolState = this.retrieveStateRecord(stateService, protocolKeys);
      const protocolResult = this.executeProtocolHooks(runtimeContextInputs, blockContextInputs);
      log.debug("PSTs:", protocolResult.stateTransitions.map((x) => x.toJSON()));
      await this.applyTransitions(stateService, protocolResult.stateTransitions);
      const startingRuntimeState = this.retrieveStateRecord(stateService, runtimeKeys);
      const runtimeResult = this.executeRuntimeMethod(method, args, runtimeContextInputs);
      log.debug("STs:", runtimeResult.stateTransitions.map((x) => x.toJSON()));
      if (runtimeResult.status.toBoolean()) {
        await this.applyTransitions(stateService, runtimeResult.stateTransitions);
      }
      this.runtime.stateServiceProvider.popCurrentStateService();
      this.protocol.stateServiceProvider.popCurrentStateService();
      appChain.setProofsEnabled(previousProofsEnabled);
      return {
        executionResult: {
          stateTransitions: runtimeResult.stateTransitions,
          protocolTransitions: protocolResult.stateTransitions,
          status: runtimeResult.status,
          statusMessage: runtimeResult.statusMessage
        },
        startingState: {
          runtime: startingRuntimeState,
          protocol: startingProtocolState
        }
      };
    }
  };
  TransactionTraceService = __decorate$a([
    injectable(),
    scoped(Lifecycle.ContainerScoped),
    __param$6(0, inject("Runtime")),
    __param$6(1, inject("Protocol")),
    __metadata$8("design:paramtypes", [
      Runtime,
      Protocol
    ])
  ], TransactionTraceService);
  var __decorate$9 = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$7 = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$5 = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  let BlockTaskFlowService = class BlockTaskFlowService {
    constructor(taskQueue, flowCreator, stateTransitionTask, stateTransitionReductionTask, runtimeProvingTask, blockProvingTask, blockReductionTask) {
      this.taskQueue = taskQueue;
      this.flowCreator = flowCreator;
      this.stateTransitionTask = stateTransitionTask;
      this.stateTransitionReductionTask = stateTransitionReductionTask;
      this.runtimeProvingTask = runtimeProvingTask;
      this.blockProvingTask = blockProvingTask;
      this.blockReductionTask = blockReductionTask;
    }
    resolveReducibleTasks(pendingInputs, reducible) {
      const res = [];
      const touchedIndizes = [];
      for (const [index, first] of pendingInputs.entries()) {
        const secondIndex = pendingInputs.findIndex((second, index2) => index2 > index && (reducible(first, second) || reducible(second, first)));
        if (secondIndex > 0) {
          const r2 = pendingInputs[secondIndex];
          pendingInputs = pendingInputs.filter((unused, index2) => index2 !== index && index2 !== secondIndex);
          const [firstElement, secondElement] = reducible(first, r2) ? [
            first,
            r2
          ] : [
            r2,
            first
          ];
          res.push({
            r1: firstElement,
            r2: secondElement
          });
          touchedIndizes.push(index, secondIndex);
        }
      }
      return {
        availableReductions: res,
        touchedIndizes
      };
    }
    async pushPairing(flow, index) {
      const { runtimeProof, stProof, blockArguments } = flow.state.pairings[index];
      if (runtimeProof !== void 0 && stProof !== void 0) {
        log.debug(`Found pairing ${index}`);
        await flow.pushTask(this.blockProvingTask, {
          input1: stProof,
          input2: runtimeProof,
          params: blockArguments
        }, async (result) => {
          flow.state.blockReduction.queue.push(result);
          await this.resolveBlockReduction(flow);
        });
      }
    }
    async resolveBlockReduction(flow) {
      const reductions = flow.state.blockReduction;
      if (reductions.numProofs - reductions.numMergesCompleted === 1 && flow.tasksInProgress === 0) {
        flow.resolve(reductions.queue[0]);
        return;
      }
      if (reductions.queue.length >= 2) {
        const { availableReductions, touchedIndizes } = this.resolveReducibleTasks(reductions.queue, (a, b) => a.publicOutput.stateRoot.equals(b.publicInput.stateRoot).and(a.publicOutput.transactionsHash.equals(b.publicInput.transactionsHash)).and(a.publicInput.networkStateHash.equals(b.publicInput.networkStateHash)).toBoolean());
        await flow.forEach(availableReductions, async (reduction) => {
          const taskParameters = [
            reduction.r1,
            reduction.r2
          ];
          await flow.pushTask(this.blockReductionTask, taskParameters, async (result) => {
            flow.state.blockReduction.queue.push(result);
            flow.state.blockReduction.numMergesCompleted += 1;
            await this.resolveBlockReduction(flow);
          });
        });
        reductions.queue = reductions.queue.filter((ignored, index) => !touchedIndizes.includes(index));
      }
    }
    async resolveSTReduction(flow, index) {
      const reductionInfo = flow.state.stReduction[index];
      if (reductionInfo.queue.length >= 2) {
        const { availableReductions, touchedIndizes } = this.resolveReducibleTasks(reductionInfo.queue, (a, b) => a.publicOutput.stateRoot.equals(b.publicInput.stateRoot).and(a.publicOutput.protocolStateRoot.equals(b.publicInput.protocolStateRoot)).and(a.publicOutput.stateTransitionsHash.equals(b.publicInput.stateTransitionsHash)).toBoolean());
        await flow.forEach(availableReductions, async (reduction) => {
          const taskParameters = [
            reduction.r1,
            reduction.r2
          ];
          await flow.pushTask(this.stateTransitionReductionTask, taskParameters, async (result) => {
            reductionInfo.numMergesCompleted += 1;
            log.debug(`${reductionInfo.numMergesCompleted} from ${reductionInfo.numProofs} ST Reductions completed `);
            if (reductionInfo.numMergesCompleted === reductionInfo.numProofs - 1) {
              flow.state.pairings[index].stProof = result;
              await this.pushPairing(flow, index);
            } else {
              reductionInfo.queue.push(result);
              await this.resolveSTReduction(flow, index);
            }
          });
          reductionInfo.queue = reductionInfo.queue.filter((ignored, queueIndex) => !touchedIndizes.includes(queueIndex));
        });
      }
    }
    async executeFlow(transactionTraces, blockId) {
      const flow = this.flowCreator.createFlow(String(blockId), {
        pairings: transactionTraces.map((trace) => ({
          runtimeProof: void 0,
          stProof: void 0,
          blockArguments: trace.blockProver
        })),
        stReduction: transactionTraces.map((trace) => ({
          numProofs: trace.stateTransitionProver.length,
          numMergesCompleted: 0,
          queue: []
        })),
        blockReduction: {
          queue: [],
          numMergesCompleted: 0,
          numProofs: transactionTraces.length
        }
      });
      return await flow.withFlow(async () => {
        await flow.forEach(transactionTraces, async (trace, index) => {
          await flow.pushTask(this.runtimeProvingTask, trace.runtimeProver, async (result) => {
            flow.state.pairings[index].runtimeProof = result;
            await this.pushPairing(flow, index);
          });
          await flow.forEach(trace.stateTransitionProver, async (stTrace) => {
            await flow.pushTask(this.stateTransitionTask, stTrace, async (result) => {
              if (flow.state.stReduction[index].numProofs === 1) {
                flow.state.pairings[index].stProof = result;
                await this.pushPairing(flow, index);
              } else {
                flow.state.stReduction[index].queue.push(result);
                await this.resolveSTReduction(flow, index);
              }
            });
          });
        });
      });
    }
  };
  BlockTaskFlowService = __decorate$9([
    injectable(),
    scoped(Lifecycle.ContainerScoped),
    __param$5(0, inject("TaskQueue")),
    __metadata$7("design:paramtypes", [
      Object,
      FlowCreator,
      StateTransitionTask,
      StateTransitionReductionTask,
      RuntimeProvingTask,
      BlockProvingTask,
      BlockReductionTask
    ])
  ], BlockTaskFlowService);
  var __decorate$8 = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$6 = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$4 = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  const errors = {
    txRemovalFailed: () => new Error("Removal of txs from mempool failed"),
    blockWithoutTxs: () => new Error("Can't create a block with zero transactions")
  };
  let BlockProducerModule = class BlockProducerModule extends SequencerModule {
    constructor(mempool, asyncStateService, merkleStore, baseLayer, blockStorage, traceService, blockFlowService) {
      super();
      this.mempool = mempool;
      this.asyncStateService = asyncStateService;
      this.merkleStore = merkleStore;
      this.baseLayer = baseLayer;
      this.blockStorage = blockStorage;
      this.traceService = traceService;
      this.blockFlowService = blockFlowService;
      this.productionInProgress = false;
    }
    createNetworkState(lastHeight) {
      return new NetworkState({
        block: {
          height: H.from(lastHeight + 1)
        }
      });
    }
    async applyStateChanges(block) {
      await block.stateService.mergeIntoParent();
      await block.merkleStore.mergeIntoParent();
    }
    async createBlock() {
      log.info("Producing batch...");
      const block = await this.tryProduceBlock();
      if (block !== void 0) {
        log.debug("Batch produced");
        await this.applyStateChanges(block);
        await this.blockStorage.setBlockHeight(await this.blockStorage.getCurrentBlockHeight() + 1);
        await this.baseLayer.blockProduced(block.block);
        log.info("Batch submitted onto baselayer");
      }
      return block == null ? void 0 : block.block;
    }
    async start() {
    }
    async tryProduceBlock() {
      if (!this.productionInProgress) {
        try {
          return await this.produceBlock();
        } catch (error) {
          if (error instanceof Error) {
            this.productionInProgress = false;
            throw error;
          } else {
            log.error(error);
          }
        }
      }
      return void 0;
    }
    async produceBlock() {
      this.productionInProgress = true;
      const lastHeight = await this.blockStorage.getCurrentBlockHeight();
      const { txs } = this.mempool.getTxs();
      const networkState = this.createNetworkState(lastHeight);
      const block = await this.computeBlock(txs, networkState, lastHeight + 1);
      requireTrue(this.mempool.removeTxs(txs), errors.txRemovalFailed);
      this.productionInProgress = false;
      return {
        block: {
          proof: block.proof,
          txs: block.computedTransactions
        },
        stateService: block.stateSerivce,
        merkleStore: block.merkleStore
      };
    }
    async computeBlock(txs, networkState, blockId) {
      if (txs.length === 0) {
        throw errors.blockWithoutTxs();
      }
      const stateServices = {
        stateService: new CachedStateService(this.asyncStateService),
        merkleStore: new CachedMerkleTreeStore(this.merkleStore)
      };
      const bundleTracker = new DefaultProvableHashList(N);
      const traceResults = [];
      for (const tx of txs) {
        const result = await this.traceService.createTrace(tx, stateServices, networkState, bundleTracker);
        traceResults.push(result);
      }
      const traces = traceResults.map((result) => result.trace);
      const proof = await this.blockFlowService.executeFlow(traces, blockId);
      return {
        proof,
        stateSerivce: stateServices.stateService,
        merkleStore: stateServices.merkleStore,
        computedTransactions: traceResults.map((result) => result.computedTxs)
      };
    }
  };
  BlockProducerModule = __decorate$8([
    sequencerModule(),
    __param$4(0, inject("Mempool")),
    __param$4(1, inject("AsyncStateService")),
    __param$4(2, inject("AsyncMerkleStore")),
    __param$4(3, inject("BaseLayer")),
    __param$4(4, inject("BlockStorage")),
    __metadata$6("design:paramtypes", [
      Object,
      Object,
      Object,
      Object,
      Object,
      TransactionTraceService,
      BlockTaskFlowService
    ])
  ], BlockProducerModule);
  var __decorate$7 = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$5 = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$3 = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  let ManualBlockTrigger = class ManualBlockTrigger extends SequencerModule {
    constructor(blockProducerModule) {
      super();
      this.blockProducerModule = blockProducerModule;
    }
    async produceBlock() {
      return await this.blockProducerModule.createBlock();
    }
    async start() {
    }
  };
  ManualBlockTrigger = __decorate$7([
    injectable(),
    __param$3(0, inject("BlockProducerModule")),
    __metadata$5("design:paramtypes", [
      BlockProducerModule
    ])
  ], ManualBlockTrigger);
  var __decorate$6 = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$4 = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$2 = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  let TimedBlockTrigger = class TimedBlockTrigger extends SequencerModule {
    constructor(blockProducerModule, mempool) {
      super();
      this.blockProducerModule = blockProducerModule;
      this.mempool = mempool;
    }
    async start() {
      this.interval = setInterval(() => {
        if (this.mempool.getTxs().txs.length > 0) {
          void this.blockProducerModule.createBlock();
        }
      }, this.config.blocktime);
    }
    async close() {
      clearInterval(this.interval);
    }
  };
  TimedBlockTrigger = __decorate$6([
    injectable(),
    __param$2(0, inject("BlockProducerModule")),
    __param$2(1, inject("Mempool")),
    __metadata$4("design:paramtypes", [
      BlockProducerModule,
      Object
    ])
  ], TimedBlockTrigger);
  AppChainTransaction = class {
    constructor(signer, transactionSender) {
      this.signer = signer;
      this.transactionSender = transactionSender;
    }
    withUnsignedTransaction(unsignedTransaction) {
      this.transaction = unsignedTransaction;
    }
    hasUnsignedTransaction(transaction) {
      const isUnsignedTransaction = transaction instanceof UnsignedTransaction;
      if (!isUnsignedTransaction) {
        throw new Error("Not an unsigned transaction");
      }
    }
    hasPendingTransaction(transaction) {
      const isUnsignedTransaction = transaction instanceof PendingTransaction;
      if (!isUnsignedTransaction) {
        throw new Error("Not a pending transaction");
      }
    }
    async sign() {
      this.hasUnsignedTransaction(this.transaction);
      const signatureData = this.transaction.getSignatureData();
      const signature = await this.signer.sign(signatureData);
      this.transaction = this.transaction.signed(signature);
    }
    async send() {
      this.hasPendingTransaction(this.transaction);
      await this.transactionSender.send(this.transaction);
    }
  };
  QueryBuilderFactory = {
    fillQuery(runtimeModule, queryTransportModule) {
      let query = {};
      for (const propertyName in runtimeModule) {
        const property = runtimeModule[propertyName];
        if (property instanceof StateMap) {
          query = {
            ...query,
            [propertyName]: {
              get: async (key) => {
                const path = property.getPath(key);
                const fields = await queryTransportModule.get(path);
                return fields ? property.valueType.fromFields(fields) : void 0;
              }
            }
          };
        }
        if (property instanceof State) {
          query = {
            ...query,
            [propertyName]: {
              get: async () => {
                const path = property.path;
                const fields = await queryTransportModule.get(path);
                return fields ? property.valueType.fromFields(fields) : void 0;
              }
            }
          };
        }
      }
      return query;
    },
    fromRuntime(runtime, queryTransportModule) {
      const { modules } = runtime.definition;
      return Object.keys(modules).reduce((query, runtimeModuleName) => {
        runtime.isValidModuleName(modules, runtimeModuleName);
        const runtimeModule = runtime.resolve(runtimeModuleName);
        query[runtimeModuleName] = QueryBuilderFactory.fillQuery(runtimeModule, queryTransportModule);
        return query;
      }, {});
    },
    fromProtocol(runtime, queryTransportModule) {
      const { modules } = runtime.definition;
      return Object.keys(modules).reduce((query, protocolModuleName) => {
        runtime.isValidModuleName(modules, protocolModuleName);
        const protocolModule = runtime.resolve(protocolModuleName);
        query[protocolModuleName] = QueryBuilderFactory.fillQuery(protocolModule, queryTransportModule);
        return query;
      }, {});
    }
  };
  var __decorate$5 = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  AppChainModule = class AppChainModule extends ConfigurableModule {
  };
  AppChainModule.presets = {};
  AppChainModule = __decorate$5([
    injectable()
  ], AppChainModule);
  var __decorate$4 = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$3 = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param$1 = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  StateServiceQueryModule = class StateServiceQueryModule extends AppChainModule {
    constructor(sequencer) {
      super();
      this.sequencer = sequencer;
    }
    get asyncStateService() {
      return this.sequencer.dependencyContainer.resolve("AsyncStateService");
    }
    async get(key) {
      return await this.asyncStateService.getAsync(key);
    }
  };
  StateServiceQueryModule = __decorate$4([
    injectable(),
    __param$1(0, inject("Sequencer")),
    __metadata$3("design:paramtypes", [
      Sequencer
    ])
  ], StateServiceQueryModule);
  var __decorate$3 = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$2 = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  let NetworkStateQuery = class NetworkStateQuery {
    constructor(blockService) {
      this.blockService = blockService;
    }
    get currentNetworkState() {
      return this.getCurrentNetworkState();
    }
    async getCurrentNetworkState() {
      const height = await this.blockService.getCurrentBlockHeight();
      return new NetworkState({
        block: {
          height: H.from(height)
        }
      });
    }
  };
  NetworkStateQuery = __decorate$3([
    injectable(),
    __metadata$2("design:paramtypes", [
      Object
    ])
  ], NetworkStateQuery);
  AppChain = class extends ModuleContainer {
    static from(definition) {
      return new AppChain(definition);
    }
    get query() {
      const queryTransportModule = this.resolveOrFail("QueryTransportModule", StateServiceQueryModule);
      const network = new NetworkStateQuery(this.sequencer.dependencyContainer.resolve("BlockStorage"));
      return {
        runtime: QueryBuilderFactory.fromRuntime(this.definition.runtime, queryTransportModule),
        protocol: QueryBuilderFactory.fromProtocol(this.definition.protocol, queryTransportModule),
        network
      };
    }
    constructor(definition) {
      super(definition);
      this.definition = definition;
      this.proofsEnabled = false;
      this.registerValue({
        Sequencer: this.definition.sequencer,
        Runtime: this.definition.runtime,
        Protocol: this.definition.protocol
      });
    }
    get runtime() {
      return this.definition.runtime;
    }
    get sequencer() {
      return this.definition.sequencer;
    }
    get protocol() {
      return this.definition.protocol;
    }
    configureAll(config) {
      this.runtime.configure(config.runtime);
      this.sequencer.configure(config.sequencer);
      this.protocol.configure(config.protocol);
      this.configure(config.appChain);
    }
    transaction(sender, callback, options) {
      const executionContext = instance.resolve(RuntimeMethodExecutionContext);
      executionContext.setup({
        transaction: {
          sender,
          nonce: H.from((options == null ? void 0 : options.nonce) ?? 0),
          argsHash: N(0)
        },
        networkState: {
          block: {
            height: H.from(0)
          }
        }
      });
      callback();
      const { methodName, moduleName, args } = executionContext.current().result;
      if (!methodName || !moduleName || !args) {
        throw new Error("Unable to determine moduleName, methodName or args for the transaction");
      }
      const runtimeModule = this.runtime.resolve(moduleName);
      const paramTypes = Reflect.getMetadata("design:paramtypes", runtimeModule, methodName);
      const argsFields = args.flatMap((arg, index) => paramTypes[index].toFields(arg));
      const unsignedTransaction = new UnsignedTransaction({
        methodId: N(this.runtime.dependencyContainer.resolve("MethodIdResolver").getMethodId(moduleName, methodName)),
        args: argsFields,
        nonce: H.from((options == null ? void 0 : options.nonce) ?? 0),
        sender
      });
      const signer = this.container.resolve("Signer");
      const transactionSender = this.container.resolve("TransactionSender");
      const transaction = new AppChainTransaction(signer, transactionSender);
      transaction.withUnsignedTransaction(unsignedTransaction);
      return transaction;
    }
    async start() {
      [
        this.runtime,
        this.protocol,
        this.sequencer
      ].forEach((container) => {
        container.registerValue({
          AppChain: this
        });
      });
      this.protocol.registerValue({
        Runtime: this.runtime
      });
      const reference = new StateTransitionWitnessProviderReference();
      this.protocol.dependencyContainer.register("StateTransitionWitnessProviderReference", {
        useValue: reference
      });
      this.sequencer.registerValue({
        Runtime: this.runtime,
        Protocol: this.protocol,
        StateTransitionWitnessProviderReference: reference
      });
      this.runtime.start();
      await this.sequencer.start();
    }
    get areProofsEnabled() {
      return this.proofsEnabled;
    }
    setProofsEnabled(areProofsEnabled) {
      this.proofsEnabled = areProofsEnabled;
    }
  };
  var __decorate$2 = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  AuroSignerHandler = class {
    static fromWorker(worker) {
      return new AuroSignerHandler(worker);
    }
    constructor(worker) {
      this.worker = worker;
    }
    handleSignRequests() {
      const listener = (message) => {
        var _a;
        if (((_a = message.data) == null ? void 0 : _a.type) === "REQUEST_SIGNATURE") {
          window.mina.signFields({
            message: message.data.data
          }).catch(() => {
            this.worker.postMessage({
              type: "ERROR_SIGNATURE"
            });
          }).then(({ signature }) => {
            this.worker.postMessage({
              type: "RESPONSE_SIGNATURE",
              data: signature
            });
          });
        }
      };
      this.worker.addEventListener("message", listener);
    }
  };
  AuroSigner = class AuroSigner extends AppChainModule {
    async sign(signatureData) {
      const { Signature } = await __vitePreload(() => import("./index-acdfa0ee.js").then(async (m) => {
        await m.__tla;
        return m;
      }).then((n) => n.a2), true ? ["assets/index-acdfa0ee.js","assets/index-ec37013e.css"] : void 0);
      return await new Promise(async (resolve) => {
        const listener = async (message) => {
          var _a;
          if (((_a = message.data) == null ? void 0 : _a.type) == "RESPONSE_SIGNATURE") {
            const signature = Signature.fromBase58(message.data.data);
            self.removeEventListener("message", listener);
            return resolve(signature);
          }
        };
        self.addEventListener("message", listener);
        self.postMessage({
          type: "REQUEST_SIGNATURE",
          data: signatureData.map((field) => field.toString())
        });
      });
    }
  };
  AuroSigner = __decorate$2([
    injectable()
  ], AuroSigner);
  var __decorate$1 = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata$1 = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  InMemorySigner = class InMemorySigner extends AppChainModule {
    constructor() {
      super();
    }
    async sign(signatureData) {
      return ia.create(this.config.signer, signatureData);
    }
  };
  InMemorySigner = __decorate$1([
    injectable(),
    __metadata$1("design:paramtypes", [])
  ], InMemorySigner);
  var __decorate = globalThis && globalThis.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __metadata = globalThis && globalThis.__metadata || function(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
  var __param = globalThis && globalThis.__param || function(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  };
  InMemoryTransactionSender = class InMemoryTransactionSender extends AppChainModule {
    constructor(sequencer) {
      super();
      this.sequencer = sequencer;
      this.mempool = this.sequencer.resolveOrFail("Mempool", PrivateMempool);
    }
    async send(transaction) {
      this.mempool.add(transaction);
    }
  };
  InMemoryTransactionSender = __decorate([
    injectable(),
    __param(0, inject("Sequencer")),
    __metadata("design:paramtypes", [
      Sequencer
    ])
  ], InMemoryTransactionSender);
  TestingAppChain = class extends AppChain {
    static fromRuntime(definition) {
      const runtime = Runtime.from({
        state: new InMemoryStateService(),
        ...definition
      });
      const sequencer = Sequencer.from({
        modules: {
          Mempool: PrivateMempool,
          LocalTaskWorkerModule,
          BaseLayer: NoopBaseLayer,
          BlockProducerModule,
          BlockTrigger: ManualBlockTrigger
        },
        config: {
          BlockTrigger: {},
          Mempool: {},
          BlockProducerModule: {},
          LocalTaskWorkerModule: {},
          BaseLayer: {}
        }
      });
      sequencer.dependencyContainer.register("TaskQueue", {
        useValue: new LocalTaskQueue(0)
      });
      return new TestingAppChain({
        runtime,
        sequencer,
        protocol: VanillaProtocol.from({}, new InMemoryStateService()),
        modules: {
          Signer: InMemorySigner,
          TransactionSender: InMemoryTransactionSender,
          QueryTransportModule: StateServiceQueryModule
        },
        config: {
          Signer: {},
          TransactionSender: {},
          QueryTransportModule: {}
        }
      });
    }
    setSigner(signer) {
      this.configure({
        Signer: {
          signer
        },
        TransactionSender: {},
        QueryTransportModule: {}
      });
    }
    useAuroSigner() {
      this.registerModules({
        Signer: AuroSigner
      });
    }
    async produceBlock() {
      const blockTrigger = this.sequencer.resolveOrFail("BlockTrigger", ManualBlockTrigger);
      return await blockTrigger.produceBlock();
    }
  };
});
export {
  AppChain,
  AppChainModule,
  AppChainTransaction,
  AuroSigner,
  AuroSignerHandler,
  InMemorySigner,
  InMemoryTransactionSender,
  QueryBuilderFactory,
  StateServiceQueryModule,
  TestingAppChain,
  __tla
};
