import type { Metadata } from "next";
import FloatingHero from "@/components/FloatingHero";

export const metadata: Metadata = {
  title: "히어로 애니메이션 미리보기 — 필름 누벨",
};

export default function HeroPreviewPage() {
  return <FloatingHero />;
}
