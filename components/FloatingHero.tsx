"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import styles from "./FloatingHero.module.css";

/* 배경 부유 요소 정의 — 중앙 카피 영역을 피해 가장자리에 분산 배치 */
type Shape = "orb" | "ring" | "sparkle" | "blob";
type El = {
  id: string;
  type: Shape;
  x: number; // % (center)
  y: number; // %
  size: number; // px
  c1: string;
  c2?: string;
  opacity: number; // 등장 후 최종 불투명도
  amp: number; // floating 진폭(px)
  dur: number; // floating 한 주기(초)
  fdelay: number; // floating 시작 지연
  blur?: number; // px
};

const ELEMENTS: El[] = [
  { id: "e1", type: "orb", x: 12, y: 22, size: 132, c1: "#c9b6ff", c2: "#7b5cff", opacity: 0.9, amp: 18, dur: 6, fdelay: 0 },
  { id: "e2", type: "orb", x: 81, y: 17, size: 96, c1: "#ffc6a8", c2: "#ff8a5c", opacity: 0.85, amp: 22, dur: 7.5, fdelay: 0.6 },
  { id: "e3", type: "ring", x: 23, y: 73, size: 86, c1: "#a8d5ff", opacity: 0.8, amp: 16, dur: 8, fdelay: 0.3 },
  { id: "e4", type: "sparkle", x: 66, y: 25, size: 36, c1: "#f3cd82", opacity: 0.95, amp: 14, dur: 5, fdelay: 0.2 },
  { id: "e5", type: "blob", x: 85, y: 70, size: 210, c1: "#3fd0a0", opacity: 0.5, amp: 24, dur: 9, fdelay: 0.8, blur: 30 },
  { id: "e6", type: "orb", x: 50, y: 11, size: 66, c1: "#ffc2da", c2: "#ff6fa5", opacity: 0.8, amp: 20, dur: 6.5, fdelay: 0.5 },
  { id: "e7", type: "sparkle", x: 15, y: 49, size: 22, c1: "#ffffff", opacity: 0.9, amp: 12, dur: 5.5, fdelay: 0.9 },
  { id: "e8", type: "ring", x: 90, y: 44, size: 56, c1: "#c9b6ff", opacity: 0.7, amp: 18, dur: 7, fdelay: 0.4 },
  { id: "e9", type: "blob", x: 7, y: 83, size: 180, c1: "#ff8a5c", opacity: 0.45, amp: 20, dur: 10, fdelay: 1.0, blur: 28 },
  { id: "e10", type: "sparkle", x: 75, y: 84, size: 30, c1: "#f3cd82", opacity: 0.9, amp: 16, dur: 6, fdelay: 0.7 },
  { id: "e11", type: "orb", x: 38, y: 86, size: 74, c1: "#a8d5ff", c2: "#4f9bff", opacity: 0.7, amp: 16, dur: 7.2, fdelay: 0.35 },
];

function ShapeSvg({ el }: { el: El }) {
  const gid = `grad-${el.id}`;
  switch (el.type) {
    case "orb":
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <radialGradient id={gid} cx="35%" cy="30%" r="72%">
              <stop offset="0%" stopColor={el.c1} stopOpacity="0.95" />
              <stop offset="55%" stopColor={el.c2 ?? el.c1} stopOpacity="0.7" />
              <stop offset="100%" stopColor={el.c2 ?? el.c1} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill={`url(#${gid})`} />
        </svg>
      );
    case "ring":
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke={el.c1} strokeWidth="1.1" />
        </svg>
      );
    case "sparkle":
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path
            d="M50 3 C54 36 64 46 97 50 C64 54 54 64 50 97 C46 64 36 54 3 50 C36 46 46 36 50 3 Z"
            fill={el.c1}
          />
        </svg>
      );
    case "blob":
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <radialGradient id={gid} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={el.c1} stopOpacity="0.6" />
              <stop offset="100%" stopColor={el.c1} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill={`url(#${gid})`} />
        </svg>
      );
  }
}

export default function FloatingHero() {
  const reduce = useReducedMotion();

  // 1) 등장: 컨테이너가 자식들을 stagger로 순차 재생
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.12, delayChildren: 0.15 },
    },
  };

  // 각 요소의 등장(페이드인 + 위로 떠오름)
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 42, scale: reduce ? 1 : 0.9 },
    show: (op: number) => ({
      opacity: op,
      y: 0,
      scale: 1,
      transition: { duration: reduce ? 0.4 : 0.9, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  // 카피 등장
  const copy: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 } },
  };

  return (
    <section className={styles.hero}>
      {/* 배경 부유 요소 */}
      <motion.div className={styles.bg} variants={container} initial="hidden" animate="show">
        {ELEMENTS.map((el) => (
          <motion.div
            key={el.id}
            className={styles.item}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: el.size,
              height: el.size,
              filter: el.blur ? `blur(${el.blur}px)` : undefined,
              zIndex: el.type === "blob" ? 1 : 2,
            }}
            variants={item}
            custom={el.opacity}
          >
            {/* 2) 상시 floating: 안쪽 래퍼가 위아래로 (요소마다 다른 속도) */}
            <motion.div
              className={styles.float}
              animate={reduce ? undefined : { y: [0, -el.amp, 0] }}
              transition={
                reduce
                  ? undefined
                  : {
                      duration: el.dur,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut",
                      delay: el.fdelay,
                    }
              }
            >
              <ShapeSvg el={el} />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* 중앙 카피 (단어별 reveal은 4번에서 추가 예정 — 지금은 정적) */}
      <motion.div className={styles.copy} variants={copy} initial="hidden" animate="show">
        <p className={styles.eyebrow}>Film Nouvelle — Day One</p>
        <h1 className={styles.headline}>
          오늘 꾼 꿈이
          <br />
          내일의 <span className={styles.accent}>첫 장면</span>이 된다
        </h1>
        <p className={styles.sub}>
          필름 누벨이 만드는 이야기의 시작. 가장 작은 영화가 가장 큰 화면에서
          깨어납니다.
        </p>
      </motion.div>
    </section>
  );
}
