# EAS development builds and OTA updates

This Expo SDK 58 project uses EAS Update for **native iOS and Android app JavaScript/assets**. Cloudflare website deployment is separate; `npm run deploy:production` does **not** publish OTA updates.

## One-time setup (run locally with your Expo account)

1. Use Node 22.13+ and run `npm ci`.
2. Run `npx expo install expo-dev-client expo-updates` to install SDK-compatible native packages and update `package.json` and `package-lock.json`. Commit both generated dependency changes.
3. Run `npx eas-cli@latest login`, then `npx eas-cli@latest project:init` (create/link the correct SMC Expo project).
4. Run `npx eas-cli@latest update:configure`. **Commit its edits** to `app.config.ts`, including `updates.url` and `extra.eas.projectId`. Do not invent a project ID or leave a placeholder URL in production.
5. Run `npx expo-doctor@latest` and `npx expo config --type public`. Verify the URL, project ID and runtime version.
6. Run `npx eas-cli@latest build --profile development --platform ios` to create the iPhone development client. iOS device installation/signing requires the appropriate Apple Developer setup. Start Metro with `npx expo start --dev-client --clear`.
7. For OTA testing, build a **preview** binary with `npx eas-cli@latest build --profile preview --platform ios` (or Android) and install it. Production binaries must be built with the `production` profile. A dev client is not a substitute for preview/production OTA verification.

## Publish updates

Preview first:

```sh
npx eas-cli@latest update --channel preview --message "Preview: describe change"
```

After testing and approval, publish the reviewed version:

```sh
npx eas-cli@latest update --channel production --message "Production: describe change"
```

These commands publish the *currently checked-out source*, so verify the Git commit before each release. OTA updates are fetched on launch and may apply on the following launch. Test cold restarts and rollback procedures before client release.

## Runtime and safety

- `runtimeVersion: { policy: "appVersion" }` matches native runtime compatibility to the app version. When changing native code, dependencies, plugins, or Expo SDK, bump `version` in `app.config.ts`, build new native binaries, then target that runtime.
- Preview and production use separate channels; publishing to preview does not update production.
- JavaScript, text, UI, and bundled assets can be OTA-updated. New native modules, entitlements, permissions, signing, or SDK upgrades **require a new build**.
- OTA updates are not delivered through Expo Go; use EAS-built binaries with `expo-updates`.
- This app handles clinic information. Avoid storing secrets or patient information in bundled JS/assets or OTA payloads; `EXPO_PUBLIC_*` variables are public.
- Initial Expo project association, package-lock updates, actual device builds and a live OTA test **must be completed locally** with the appropriate Expo/Apple credentials.
