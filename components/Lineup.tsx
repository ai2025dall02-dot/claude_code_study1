"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
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

/* 카드별 배치 설정 — mt: 카드별 추가 세로 여백(촘촘하게 0~60), ar: 높이(aspect)
   (패럴랙스 속도는 더 이상 카드별이 아니라 '열 단위'로 묶임 → COL_SPEED) */
const CONF = [
  { mt: 0, ar: "3 / 4.2" },
  { mt: 28, ar: "3 / 3.6" },
  { mt: 14, ar: "3 / 4.6" },
  { mt: 44, ar: "3 / 3.8" },
  { mt: 8, ar: "3 / 4.4" },
  { mt: 36, ar: "3 / 4.0" },
  { mt: 20, ar: "3 / 3.9" },
  { mt: 52, ar: "3 / 4.5" },
  { mt: 6, ar: "3 / 3.7" },
  { mt: 32, ar: "3 / 4.3" },
  { mt: 48, ar: "3 / 4.1" },
  { mt: 16, ar: "3 / 3.6" },
];

/* 6편 데이터를 2회 반복해 12개로 노출 (key 충돌 방지 위해 인덱스 suffix) */
const ITEMS = [...films, ...films];

/* 세로 흐름 masonry: 3개 열로 라운드로빈 분배 (각 열이 세로로 이어짐) */
const COLS = 3;
const COL_CLASS = ["", "col1", "col2"] as const;
/* 열별 속도 계수 (음수=위로 흐름, 절댓값 클수록 빠름) — 속도 격차를 크게 벌려 어긋남 강조
   (가운데 열은 빠르게 -0.55, 마지막 열은 거의 정지 -0.05) */
const COL_SPEED = [-0.25, -0.55, -0.05];
/* 패럴랙스 기준 이동 폭(px). 계수 × 이 값 = 열의 (반)이동량 — 크게 잡아 '슉' 미끄러지게 */
const PARALLAX_DISTANCE = 2200;

export default function Lineup() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  // ABOUT 하단~LINEUP 진입에서 원이 화면 정중앙에서 커지며 밝은 배경이 차오름
  const { scrollYProgress: revealProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });
  const radius = useTransform(revealProgress, [0, 1], [0, 150]);
  const clipPath = useTransform(radius, (v) => `circle(${v}% at 50% 50%)`);
  const revealOpacity = useTransform(revealProgress, [0, 0.96, 1], [1, 1, 0]);

  // 패럴랙스용 — 섹션이 화면을 지나는 전체 진행도 (0: 하단 진입 ~ 1: 상단 이탈)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

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
            <ParallaxColumn
              key={c}
              className={`${styles.col} ${styles[COL_CLASS[c]] ?? ""}`}
              progress={scrollYProgress}
              speed={COL_SPEED[c]}
              reduce={!!reduce}
            >
              {ITEMS.map((f, i) => ({ f, i }))
                .filter(({ i }) => i % COLS === c)
                .map(({ f, i }) => (
                  <LineupCard key={`${f.id}-${i}`} film={f} conf={CONF[i % CONF.length]} reduce={!!reduce} />
                ))}
            </ParallaxColumn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 한 열 전체를 묶어 섹션 진행도 × 열 계수로 선형(scrub) 이동 — 스프링/딜레이 없이 즉각 반응 */
function ParallaxColumn({
  progress,
  speed,
  reduce,
  className,
  children,
}: {
  progress: MotionValue<number>;
  speed: number;
  reduce: boolean;
  className: string;
  children: ReactNode;
}) {
  const yRaw = useTransform(
    progress,
    [0, 1],
    [-speed * PARALLAX_DISTANCE, speed * PARALLAX_DISTANCE]
  );
  const y = reduce ? 0 : yRaw;
  return (
    <motion.div className={className} style={{ y, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}

function LineupCard({
  film: f,
  conf,
  reduce,
}: {
  film: Film;
  conf: { mt: number; ar: string };
  reduce: boolean;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  // 카드가 화면을 지나는 동안의 진행도 (0: 하단 진입 ~ 1: 상단 이탈)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // 화면 중앙(0.35~0.65)에서 또렷, 위아래로 페이드
  const opRaw = useTransform(
    scrollYProgress,
    [0.12, 0.35, 0.65, 0.88],
    [0, 1, 1, 0]
  );
  const opacity = reduce ? 1 : opRaw;

  return (
    <motion.a ref={ref} className={styles.card} href="#contact" style={{ marginTop: conf.mt, opacity }}>
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
