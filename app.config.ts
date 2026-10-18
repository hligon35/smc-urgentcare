import type { ExpoConfig } from "expo/config";

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
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#214c40",
    },
  },
  web: { bundler: "metro", output: "static", favicon: "./public/favicon.ico" },
};
export default config;
