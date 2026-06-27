import type { Metadata } from "next";
import CylinderHero, { type Poster } from "@/components/CylinderHero";

export const metadata: Metadata = {
  title: "3D 원기둥 포스터 캐러셀 — 필름 누벨",
};

const POSTERS: Poster[] = [
  { src: "/posters/p1.svg", alt: "여름의 잔상 포스터" },
  { src: "/posters/p2.svg", alt: "북위 48도 포스터" },
  { src: "/posters/p3.svg", alt: "조용한 망명 포스터" },
  { src: "/posters/p4.svg", alt: "소금사막 포스터" },
  { src: "/posters/p5.svg", alt: "겨울 손님 포스터" },
  { src: "/posters/p6.svg", alt: "필름의 끝 포스터" },
  { src: "/posters/p7.svg", alt: "붉은 방 포스터" },
  { src: "/posters/p8.svg", alt: "바다의 문 포스터" },
];

export default function HeroCylinderPage() {
  return (
    <CylinderHero
      posters={POSTERS}
      title={"극장에서 만날\n올해의 영화들"}
      eyebrow="Film Nouvelle — 2024·2025"
    />
  );
}
