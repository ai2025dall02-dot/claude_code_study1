"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { films, type Film } from "@/data/films";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 라인업 작품에 사진 포스터 매핑 (public/posters-photo) */
const FILM_PHOTO: Record<string, string> = {
  afterimage: "/posters-photo/m1.jpg",
  north: "/posters-photo/m4.jpg",
  exile: "/posters-photo/m3.jpg",
  salt: "/posters-photo/m8.jpg",
  winter: "/posters-photo/m6.jpg",
  reel: "/posters-photo/m2.jpg",
};

/* 카드별 불규칙 배치/패럴랙스 설정
   mt: 세로 오프셋(masonry), x: 가로 미세 오프셋, ar: 높이(aspect), mag: 패럴랙스 세기(px) */
const CONF = [
  { mt: 0, x: -14, ar: "3 / 4.2", mag: 70 },
  { mt: 74, x: 12, ar: "3 / 3.6", mag: 150 },
  { mt: 28, x: -8, ar: "3 / 4.6", mag: 100 },
  { mt: 98, x: 18, ar: "3 / 3.8", mag: 58 },
  { mt: 14, x: -20, ar: "3 / 4.4", mag: 132 },
  { mt: 58, x: 8, ar: "3 / 4.0", mag: 92 },
];

export default function Lineup() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  // ABOUT 하단~LINEUP 진입에서 원이 화면 정중앙에서 커지며 밝은 배경이 차오름
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });
  const radius = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const clipPath = useTransform(radius, (v) => `circle(${v}% at 50% 50%)`);
  const revealOpacity = useTransform(scrollYProgress, [0, 0.96, 1], [1, 1, 0]);

  return (
    <section ref={sectionRef} className={`${styles.section} ${styles.lineup}`} id="lineup">
      {!reduce && (
        <motion.div
          className={styles.lineupReveal}
          aria-hidden="true"
          style={{ clipPath, opacity: revealOpacity }}
        />
      )}

      <div className={styles.inner}>
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>The Programme</span>
            <TypeTitle solid="LINE" outline="UP" />
          </div>
          <span className={styles.index}>현재 배급 · 2024–2025 / 전 {films.length}편</span>
        </header>

        <div className={styles.grid}>
          {films.map((f, i) => (
            <LineupCard key={f.id} film={f} conf={CONF[i % CONF.length]} reduce={!!reduce} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LineupCard({
  film: f,
  conf,
  reduce,
}: {
  film: Film;
  conf: { mt: number; x: number; ar: string; mag: number };
  reduce: boolean;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  // 카드가 화면을 지나는 동안의 진행도 (0: 하단 진입 ~ 1: 상단 이탈)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yRaw = useTransform(scrollYProgress, [0, 1], [0, -conf.mag]); // 카드마다 다른 속도로 위로 흐름
  const opRaw = useTransform(
    scrollYProgress,
    [0.1, 0.28, 0.7, 0.95],
    [0, 1, 1, 0]
  ); // 중앙에서 1, 위로 갈수록 0 (하단 진입 시 페이드인)

  const y = reduce ? 0 : yRaw;
  const opacity = reduce ? 1 : opRaw;

  return (
    <motion.a
      ref={ref}
      className={styles.card}
      href="#contact"
      style={{ marginTop: conf.mt, x: conf.x, y, opacity }}
    >
      <div className={styles.card__media} style={{ aspectRatio: conf.ar }}>
        <Image
          src={FILM_PHOTO[f.id] ?? "/posters-photo/m1.jpg"}
          alt={`${f.title} 스틸`}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 980px) 50vw, 33vw"
        />
        <span className={styles.card__idx}>{f.index}</span>
        <span className={styles.card__status}>{f.status}</span>
      </div>
      <div className={styles.card__body}>
        <span className={styles.card__title}>{f.title}</span>
        <span className={styles.card__en}>{f.titleEn}</span>
        <span className={styles.card__meta}>
          {f.director} · {f.country} {f.year} · {f.format} · {f.genre}
        </span>
      </div>
    </motion.a>
  );
}
