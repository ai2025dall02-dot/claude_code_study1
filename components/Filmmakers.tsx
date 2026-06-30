"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { films } from "@/data/films";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 감독 카드용 사진 매핑 (public/posters-photo) — LINEUP 과 동일 매핑으로 일관성 유지 */
const MAKER_PHOTO: Record<string, string> = {
  afterimage: "/posters-photo/m1.jpg",
  north: "/posters-photo/m4.jpg",
  exile: "/posters-photo/m3.jpg",
  salt: "/posters-photo/m8.jpg",
  winter: "/posters-photo/m6.jpg",
  reel: "/posters-photo/m2.jpg",
};

/* 감독 데이터 — films 에서 파생 (사진 + 이름 + 필모/정보) */
const MAKERS = films.map((f) => ({
  id: f.id,
  index: f.index,
  name: f.director,
  country: f.country,
  year: f.year,
  genre: f.genre,
  film: f.title,
  filmEn: f.titleEn,
  photo: MAKER_PHOTO[f.id] ?? "/posters-photo/m1.jpg",
}));

export default function Filmmakers() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // 세로 스크롤 진행도 (섹션 상단 도달 ~ 섹션 하단 도달)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // 첫 카드가 화면 중앙에서 시작 → 마지막 카드가 화면 중앙에서 끝나도록 x 범위 계산
  const [range, setRange] = useState({ start: 0, end: 0 });
  useEffect(() => {
    const measure = () => {
      const vp = viewportRef.current;
      const track = trackRef.current;
      if (!vp || !track) return;
      const cards = track.children;
      if (cards.length === 0) return;
      const first = cards[0] as HTMLElement;
      const cardW = first.offsetWidth;
      const pitch =
        cards.length > 1
          ? (cards[1] as HTMLElement).offsetLeft - first.offsetLeft
          : cardW;
      const start = (vp.clientWidth - cardW) / 2; // 첫 카드 중앙 정렬
      const travel = (cards.length - 1) * pitch; // 마지막 카드까지 이동량
      setRange({ start, end: start - travel });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const x = useTransform(scrollYProgress, [0, 1], [range.start, range.end]);

  return (
    <section ref={sectionRef} className={styles.fm} id="filmmakers">
      <div ref={viewportRef} className={styles.fmViewport}>
        {/* 배경에 고정된 큰 FILMMAKERS 텍스트 (카드가 그 앞을 지나감) */}
        <div className={styles.fmBg} aria-hidden="true">
          <span className={styles.eyebrow}>Directors &amp; Authors</span>
          <TypeTitle solid="FILM" outline="MAKERS" />
          <span className={styles.fmHeadSub}>우리가 동행하는 작가들</span>
        </div>

        {/* 가로 트랙 — 세로 스크롤 진행도에 x 연동 */}
        <motion.div ref={trackRef} className={styles.fmTrack} style={{ x }}>
          {MAKERS.map((m) => (
            <article key={m.id} className={styles.fmCard}>
              <div className={styles.fmCard__photo}>
                <Image
                  src={m.photo}
                  alt={`${m.name} 감독`}
                  fill
                  sizes="(max-width: 600px) 80vw, 360px"
                />
                <span className={styles.fmCard__idx}>{m.index}</span>
              </div>
              <div className={styles.fmCard__info}>
                <h3 className={styles.fmCard__name}>
                  {m.name}
                  <span>Director</span>
                </h3>
                <p className={styles.fmCard__meta}>
                  {m.country} · {m.year} · {m.genre}
                </p>
                <p className={styles.fmCard__film}>
                  <b>{m.film}</b> · {m.filmEn}
                </p>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
