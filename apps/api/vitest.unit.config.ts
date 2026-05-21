import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "unit",
    environment: "node",
    include: [
      "test/unit/**/*.unit.test.ts",
      "test/contracts/**/*.contract.test.ts",
      "src/**/*.unit.test.ts",
    ],
    globals: true,
  },
});
