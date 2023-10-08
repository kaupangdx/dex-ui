# Dex UI

## Local development

If you're developing the DEX UI locally, using a locally built runtime, please make
sure to link to the runtime's dependencies to prevent any peer dependency issues.

```
"@proto-kit/sdk": "file:../dex-runtime/node_modules/@proto-kit/sdk",
"snarkyjs": "file:../dex-runtime/node_modules/snarkyjs",
```
