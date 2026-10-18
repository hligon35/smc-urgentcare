import clinic from "./clinic.json";
import routes from "../content/routes.json";

export { clinic, routes };
export type PageId = (typeof routes)[number]["id"];
export const siteUrl = (
  process.env.EXPO_PUBLIC_SITE_URL || "https://smc-urgentcare.com"
).replace(/\/$/, "");
