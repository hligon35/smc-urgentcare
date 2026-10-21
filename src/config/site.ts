import clinic from "./clinic.json";
import routes from "../content/routes.json";

export { clinic, routes };
export const siteUrl = (
  process.env.EXPO_PUBLIC_SITE_URL || "https://smcurgentcareindy.com"
).replace(/\/$/, "");
