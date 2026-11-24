import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: {
        compilerOptions: {
            ignoreDeprecations: "6.0",
        },
    },
    clean: true,
    sourcemap: true,
    minify: false,
  deps: {
    neverBundle: ["@flexiformal/ftml"],
  },
  target: false,
});