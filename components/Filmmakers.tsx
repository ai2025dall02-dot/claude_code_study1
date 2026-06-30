"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
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
  const reduce = useReducedMotion();
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

  // [2] 카드 가로 이동을 0.2 이후로 미룸 — 0~0.2 는 제목 타이핑 노출 구간 (카드는 첫 위치 고정)
  const x = useTransform(scrollYProgress, [0.2, 1], [range.start, range.end]);

  // [3] 타이핑 구간(0~0.2)에는 카드가 살짝 흐릿하게 대기 → 0.2 부터 또렷
  const waitBlurN = useTransform(scrollYProgress, [0.12, 0.2], [5, 0]);
  const waitBlur = useMotionTemplate`blur(${waitBlurN}px)`;
  const waitOpacity = useTransform(scrollYProgress, [0, 0.2], [0.5, 1]);
  const trackFilter = reduce ? "none" : waitBlur;
  const trackOpacity = reduce ? 1 : waitOpacity;

  return (
    <section ref={sectionRef} className={styles.fm} id="filmmakers">
      <div ref={viewportRef} className={styles.fmViewport}>
        {/* 배경에 고정된 큰 FILMMAKERS 텍스트 (카드가 그 앞을 지나감) */}
        <div className={styles.fmBg} aria-hidden="true">
          <span className={styles.eyebrow}>Directors &amp; Authors</span>
          {/* [1] sticky 로 화면에 들어오는 즉시 타이핑 발동 (이른 트리거) */}
          <TypeTitle solid="FILM" outline="MAKERS" inViewMargin="0px" />
          <span className={styles.fmHeadSub}>우리가 동행하는 작가들</span>
        </div>

        {/* 가로 트랙 — 0.2 이후부터 x 연동, 그 전엔 첫 위치 고정 */}
        <motion.div
          ref={trackRef}
          className={styles.fmTrack}
          style={{ x, filter: trackFilter, opacity: trackOpacity }}
        >
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
