import type { PropsWithChildren } from "react";
import { colors } from "../styles/theme";
import { useServerDocumentContext } from "expo-router/html";
export default function RootHTML({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } =
    useServerDocumentContext();
  return (
    <html {...htmlAttributes} lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content={colors.primary} />
        <link rel="icon" href="/favicon.ico?v=2" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32.png"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
