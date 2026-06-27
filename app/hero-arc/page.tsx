import type { Metadata } from "next";
import MovieArcHero from "@/components/MovieArcHero";

export const metadata: Metadata = {
  title: "MOVIE 부채꼴 히어로 미리보기 — 필름 누벨",
};

export default function HeroArcPage() {
  return <MovieArcHero />;
}
