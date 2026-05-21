import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@retardmaxxing/ui",
    "@retardmaxxing/contract",
    "@retardmaxxing/domains",
  ],
};

export default config;
