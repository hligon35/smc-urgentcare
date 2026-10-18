import type { ExpoConfig } from "expo/config";
import colors from "./src/styles/palette.json";

const config: ExpoConfig = {
  name: "SMC Urgent Care",
  slug: "smc-urgentcare",
  scheme: "smcurgentcare",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  platforms: ["ios", "android", "web"],
  plugins: [["expo-router", { sitemap: false }], "expo-splash-screen"],
  ios: { supportsTablet: true },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: colors.paper,
    },
  },
  web: { bundler: "metro", output: "static", favicon: "./public/favicon.ico" },
};
export default config;
