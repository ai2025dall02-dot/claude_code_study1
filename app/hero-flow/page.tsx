import type { Metadata } from "next";
import IntroProvider from "@/components/Intro";
import SiteNav from "@/components/SiteNav";
import FlowHero from "@/components/FlowHero";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "필름 누벨 — 독립·예술영화 배급",
};

export default function HeroFlowPage() {
  return (
    <IntroProvider>
      <main>
        <SiteNav />
        <FlowHero />
        <Landing />
      </main>
    </IntroProvider>
  );
}
