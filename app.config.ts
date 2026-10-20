import type { ExpoConfig } from "expo/config";
import colors from "./src/styles/palette.json";

const config: ExpoConfig = {
  name: "SMC Urgent Care",
  slug: "smc-urgentcare",
  scheme: "smcurgentcare",
  version: "1.0.0",
  // Keep OTA updates compatible with the native app version.
  runtimeVersion: { policy: "appVersion" },
  updates: {
    enabled: true,
    url: "https://u.expo.dev/34c4c00b-c13a-4322-86ca-522b12e9d920",
    checkAutomatically: "ON_LOAD",
    fallbackToCacheTimeout: 0,
  },
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  platforms: ["ios", "android", "web"],
  plugins: [["expo-router", { sitemap: false }], "expo-splash-screen"],
  extra: { eas: { projectId: "34c4c00b-c13a-4322-86ca-522b12e9d920" } },
  owner: "azlabsllc",
  ios: { supportsTablet: true, bundleIdentifier: "com.azlabsllc.smcurgentcare" },
  android: {
    package: "com.azlabsllc.smcurgentcare",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: colors.paper,
    },
  },
  web: { bundler: "metro", output: "static", favicon: "./public/favicon.ico" },
};
export default config;
