"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

export default function Hero() {
  const reduce = useReducedMotion();

  // 리더 인트로(약 2초)가 끝난 뒤 드러나도록 지연. reduced-motion이면 즉시.
  const base = reduce ? 0 : 2.05;

  const bars: Variants = {
    hidden: { scaleY: 6 },
    show: {
      scaleY: 1,
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1], delay: base },
    },
  };

  const up: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 26 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1],
        delay: base + 0.25 + i * 0.12,
      },
    }),
  };

  return (
    <section className="hero" id="top">
      <div className="hero__glow" />
      <div className="hero__grain" />

      <motion.div
        className="hero__bar hero__bar--top"
        style={{ transformOrigin: "top" }}
        variants={bars}
        initial="hidden"
        animate="show"
      />
      <motion.div
        className="hero__bar hero__bar--bottom"
        style={{ transformOrigin: "bottom" }}
        variants={bars}
        initial="hidden"
        animate="show"
      />

      <div className="hero__content">
        <motion.p
          className="eyebrow"
          variants={up}
          custom={0}
          initial="hidden"
          animate="show"
        >
          독립 · 예술영화 배급 — EST. 2014
        </motion.p>

        <motion.h1
          className="hero__title"
          variants={up}
          custom={1}
          initial="hidden"
          animate="show"
        >
          변방의 영화를
          <br />
          스크린 <em>한가운데로.</em>
        </motion.h1>

        <motion.p
          className="hero__sub"
          variants={up}
          custom={2}
          initial="hidden"
          animate="show"
        >
          필름 누벨은 국내외 독립·예술영화를 발굴해 극장과 관객을 잇습니다. 작은
          영화의 첫 문장이 가장 큰 화면에서 시작되도록.
        </motion.p>

        <motion.div
          className="hero__marquee"
          variants={up}
          custom={3}
          initial="hidden"
          animate="show"
        >
          <span>현재 배급작 6편</span> · 12개국 · 연간 4회 기획전 ·{" "}
          <span>전국 예술영화관 네트워크</span>
        </motion.div>
      </div>

      <motion.div
        className="hero__cue"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: base + 0.9, duration: 0.8 }}
      >
        <span className="hero__cue-line" />
        Scroll
      </motion.div>
    </section>
  );
}
