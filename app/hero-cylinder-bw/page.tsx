import type { Metadata } from "next";
import CylinderHeroMono, { type Poster } from "@/components/CylinderHeroMono";

export const metadata: Metadata = {
  title: "B&W 원기둥 포스터 캐러셀 — 필름 누벨",
};

// 실사 포스터 이미지 (placeholder). 실제로는 props/CMS에서 컬러 원본 URL을 주입.
const POSTERS: Poster[] = [
  { src: "/posters-photo/m1.jpg", alt: "포스터 1" },
  { src: "/posters-photo/m2.jpg", alt: "포스터 2" },
  { src: "/posters-photo/m3.jpg", alt: "포스터 3" },
  { src: "/posters-photo/m4.jpg", alt: "포스터 4" },
  { src: "/posters-photo/m5.jpg", alt: "포스터 5" },
  { src: "/posters-photo/m6.jpg", alt: "포스터 6" },
  { src: "/posters-photo/m7.jpg", alt: "포스터 7" },
  { src: "/posters-photo/m8.jpg", alt: "포스터 8" },
];

export default function HeroCylinderBwPage() {
  return (
    <CylinderHeroMono
      posters={POSTERS}
      title={"흑백 위에\n오직 영화만 컬러로"}
      eyebrow="Film Nouvelle — In Cinemas"
      watermark="MOVIE"
    />
  );
}
