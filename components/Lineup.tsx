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

/* 카드별 배치/패럴랙스 설정 (세로 오프셋·높이·패럴랙스 제각각)
   mt: 카드별 추가 세로 여백(촘촘하게 0~60), ar: 높이(aspect), mag: 패럴랙스 세기(px) */
const CONF = [
  { mt: 0, ar: "3 / 4.2", mag: 160 },
  { mt: 28, ar: "3 / 3.6", mag: 240 },
  { mt: 14, ar: "3 / 4.6", mag: 130 },
  { mt: 44, ar: "3 / 3.8", mag: 200 },
  { mt: 8, ar: "3 / 4.4", mag: 260 },
  { mt: 36, ar: "3 / 4.0", mag: 150 },
  { mt: 20, ar: "3 / 3.9", mag: 220 },
  { mt: 52, ar: "3 / 4.5", mag: 120 },
  { mt: 6, ar: "3 / 3.7", mag: 250 },
  { mt: 32, ar: "3 / 4.3", mag: 175 },
  { mt: 48, ar: "3 / 4.1", mag: 200 },
  { mt: 16, ar: "3 / 3.6", mag: 235 },
];

/* 6편 데이터를 2회 반복해 12개로 노출 (key 충돌 방지 위해 인덱스 suffix) */
const ITEMS = [...films, ...films];

/* 세로 흐름 masonry: 3개 열로 라운드로빈 분배 (각 열이 세로로 이어지고 높낮이 제각각) */
const COLS = 3;
const COL_CLASS = ["", "col1", "col2"] as const;

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
          <span className={styles.index}>현재 배급 · 2024–2025 / 전 {ITEMS.length}편</span>
        </header>

        <div className={styles.grid}>
          {Array.from({ length: COLS }, (_, c) => (
            <div key={c} className={`${styles.col} ${styles[COL_CLASS[c]] ?? ""}`}>
              {ITEMS.map((f, i) => ({ f, i }))
                .filter(({ i }) => i % COLS === c)
                .map(({ f, i }) => (
                  <LineupCard key={`${f.id}-${i}`} film={f} conf={CONF[i % CONF.length]} reduce={!!reduce} />
                ))}
            </div>
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
  conf: { mt: number; ar: string; mag: number };
  reduce: boolean;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  // 카드가 화면을 지나는 동안의 진행도 (0: 하단 진입 ~ 1: 상단 이탈)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yRaw = useTransform(scrollYProgress, [0, 1], [conf.mag, -conf.mag]); // 아래에서 올라와 위로 빨려나감 (이동 폭 2배)
  const opRaw = useTransform(
    scrollYProgress,
    [0.12, 0.35, 0.65, 0.88],
    [0, 1, 1, 0]
  ); // 0.35~0.65 구간을 또렷(1)하게 넓혀 더 오래 보이고, 페이드는 완만하게
  // 화면 중앙(0.5)에서 살짝 커지며 '제자리에 끌려 들어와 자리잡는' 스냅 느낌
  const scaleRaw = useTransform(
    scrollYProgress,
    [0.12, 0.5, 0.88],
    [0.94, 1, 0.94]
  );

  const y = reduce ? 0 : yRaw;
  const opacity = reduce ? 1 : opRaw;
  const scale = reduce ? 1 : scaleRaw;

  return (
    <motion.a
      ref={ref}
      className={styles.card}
      href="#contact"
      style={{ marginTop: conf.mt, y, opacity, scale }}
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
