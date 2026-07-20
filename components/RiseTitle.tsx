"use client";

// 섹션 제목을 히어로 FILM NOUVELLE 처럼 "아래에서 위로 올라오며" 드러내는 제목.
//  각 글자를 clip-path 마스크 창(.riseMask) + 안쪽(.riseInner)으로 감싸, 안쪽을 y:115%(창 아래)에서
//  0 으로 올려 순차(stagger)로 등장시킨다. solid(채움) + outline(em, 라인) 구조는 TypeTitle 과 동일.
import { motion, useReducedMotion, type Variants } from "framer-motion";
import styles from "./Landing.module.css";

export default function RiseTitle({
  solid,
  outline,
  inViewMargin = "-10% 0px",
}: {
  solid: string;
  outline: string;
  /** useInView(whileInView) 트리거 여백 — 더 일찍/늦게 발동시키려면 조정 */
  inViewMargin?: string;
}) {
  const reduce = useReducedMotion();

  // 컨테이너: 자식(글자)들을 좌→우 순차로 올림. 글자: y 115%(창 아래) → 0.
  const group: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.055, delayChildren: reduce ? 0 : 0.05 } },
  };
  const glyph: Variants = {
    hidden: { y: reduce ? "0%" : "115%" },
    show: {
      y: "0%",
      transition: { duration: reduce ? 0 : 0.62, ease: [0.16, 1, 0.3, 1] }, // power3.out 무드
    },
  };

  const letters = (text: string) =>
    Array.from(text).map((ch, i) => (
      <span key={i} className={styles.riseMask} aria-hidden="true">
        <motion.span className={styles.riseInner} variants={glyph}>
          {ch}
        </motion.span>
      </span>
    ));

  return (
    <motion.h2
      className={styles.title}
      aria-label={`${solid}${outline}`}
      variants={group}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: inViewMargin as never }}
    >
      <span aria-hidden="true">{letters(solid)}</span>
      <em aria-hidden="true">{letters(outline)}</em>
    </motion.h2>
  );
}
