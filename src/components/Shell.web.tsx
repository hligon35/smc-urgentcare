import type { PropsWithChildren } from "react";
import Header from "./Header.web";
import Footer from "./Footer.web";
import "../styles/global.css";
export default function Shell({ children }: PropsWithChildren) {
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
