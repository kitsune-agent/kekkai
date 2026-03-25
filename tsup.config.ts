import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node18",
  splitting: false,
  sourcemap: true,
  tsconfig: "tsconfig.build.json",
  banner: ({ format }) => {
    if (format === "esm") {
      return { js: '#!/usr/bin/env node\n' };
    }
    return {};
  },
});
