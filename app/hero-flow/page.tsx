import type { Metadata } from "next";
import FlowHero from "@/components/FlowHero";

export const metadata: Metadata = {
  title: "FLOW 히어로 — 필름 누벨",
};

export default function HeroFlowPage() {
  return <FlowHero />;
}
