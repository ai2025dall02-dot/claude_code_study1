import type { Metadata } from "next";
import Nav from "@/components/Nav";
import FloatingHero from "@/components/FloatingHero";
import Programme from "@/components/Programme";
import Manifesto from "@/components/Manifesto";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "히어로 애니메이션 미리보기 — 필름 누벨",
};

export default function HeroPreviewPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <FloatingHero />
        <Programme />
        <Manifesto />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
