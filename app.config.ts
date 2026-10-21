import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "SMC Urgent Care",
  slug: "smc-urgentcare",
  version: "1.0.0",
  platforms: ["web"],
  plugins: [["expo-router", { sitemap: false }]],
  owner: "azlabsllc",
  web: { bundler: "metro", output: "static", favicon: "./public/favicon.ico" },
};
export default config;
