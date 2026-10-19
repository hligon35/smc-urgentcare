import type { PropsWithChildren } from "react";
import { usePathname } from "expo-router";
import Header from "./Header.web";
import Footer from "./Footer.web";
import "../styles/global.css";
export default function Shell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  if (pathname === "/portal" || pathname.startsWith("/portal/")) return <>{children}</>;
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
