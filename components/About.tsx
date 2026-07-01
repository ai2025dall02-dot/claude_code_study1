"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { TextReveal } from "./TextReveal";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

const PRINCIPLES = [
  {
    label: "Curation",
    title: "변방을 중심으로",
    text: "이미 검증된 흥행이 아니라, 아직 자리를 얻지 못한 목소리를 먼저 봅니다. 배급은 발견에서 시작합니다.",
  },
  {
    label: "Authorship",
    title: "감독의 첫 문장을 지킨다",
    text: "러닝타임도, 결말도, 침묵도 줄이지 않습니다. 만든 사람이 의도한 그대로 극장에 건넵니다.",
  },
  {
    label: "Theatre",
    title: "극장이라는 약속",
    text: "작은 영화일수록 큰 화면이 필요합니다. 전국 예술영화관과 함께 상영의 자리를 끝까지 지킵니다.",
  },
];

export default function About() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // 진입: 흰→검정(0~0.2), 이후 검정 유지. (LINEUP 전환은 LINEUP 의 원형 reveal 이 담당)
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.2],
    ["#f8f8f8", "#0b0b0c"]
  );
  // 인용문 글자색: 밝은 배경에선 어둡게, 어두워지면 밝게 (대비 유지)
  const quoteFill = useTransform(scrollYProgress, [0, 0.2], ["#1a1a1a", "#f4f4f2"]);
  const quoteGhost = useTransform(
    scrollYProgress,
    [0, 0.2],
    ["rgba(26,26,26,0.22)", "rgba(244,244,242,0.16)"]
  );

  // 원형 reveal — TextReveal 과 동일한 wrap+sticky pin 패턴.
  // 본문·원칙이 다 나온 뒤 pin 래퍼(바깥 200vh)에 진입하면 안쪽 sticky(100vh)가 화면에 고정되고,
  // 그 고정 상태에서 스크롤하는 동안 원이 그 자리에서 0→최대로 커진다. 이후 고정이 풀리며 LINEUP 으로.
  const pinRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: growProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end start"],
  });
  // sticky(100vh)는 pin 래퍼(200vh)의 앞 절반 동안 고정 → 그 구간(0~0.5)에 원이 최대(170)까지 커진 뒤
  // 뒤 절반에서 고정이 풀리며 밝은 원째로 스크롤업 → LINEUP 진입 (검은 띠 없이 이어짐).
  const revealRadius = useTransform(growProgress, [0, 0.5], [0, 170]);
  const revealClip = useTransform(revealRadius, (v) => `circle(${v}% at 50% 50%)`);

  // 마우스 따라다니는 옅은 흰 스포트라이트 (rAF throttle)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let nx = 0;
    let ny = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--mx", `${nx}px`);
      el.style.setProperty("--my", `${ny}px`);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      nx = e.clientX - r.left;
      ny = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onEnter = () => el.classList.add(styles.spotOn);
    const onLeave = () => el.classList.remove(styles.spotOn);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const group: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.18, delayChildren: 0.15 } },
  };
  const innerGroup: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.18 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 44 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  };
  // 가로 라인: 좌측을 기준으로 우측으로 길어짐 (scaleX 0→1)
  const line: Variants = {
    hidden: { scaleX: reduce ? 1 : 0 },
    show: {
      scaleX: 1,
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.section
      ref={ref}
      id="about"
      className={`${styles.section} ${styles.about}`}
      style={{ backgroundColor }}
    >
      <TextReveal
        text={["좋은 영화는 사라지지 않는다.", "다만 옮겨질 곳을 기다릴 뿐이다."]}
        fillColor={quoteFill}
        ghostColor={quoteGhost}
      />

      <motion.div
        className={`${styles.inner} ${styles.aboutAfter}`}
        variants={group}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40% 0px" }}
      >
        <motion.header className={styles.head} variants={item}>
          <div>
            <span className={styles.eyebrow}>About — 배급사 소개</span>
            <TypeTitle solid="FILM " outline="NOUVELLE" />
          </div>
          <span className={styles.index}>Since 2014 · Seoul</span>
        </motion.header>

        <motion.div
          className={`${styles.aboutLine} ${styles.aboutLineHead}`}
          variants={line}
          aria-hidden="true"
        />

        <motion.p className={styles.aboutBody} variants={item}>
          필름 누벨은 2014년, 극장에서 사라져 가던 독립·예술영화를 다시 스크린에
          올리기 위해 시작했습니다. 우리는 한 해에 단 몇 편만을 고릅니다. 적게
          고르는 대신, 한 편의 영화가 관객을 만나는 모든 길 — 개봉, 기획전, 공동체
          상영, 아카이브 — 을 끝까지 동행합니다.
        </motion.p>

        <motion.div
          className={`${styles.aboutLine} ${styles.aboutLinePrin}`}
          variants={line}
          aria-hidden="true"
        />

        <motion.div className={styles.principles} variants={innerGroup}>
          {PRINCIPLES.map((pr) => (
            <motion.div key={pr.title} variants={item}>
              <span className={styles.principle__label}>원칙 / {pr.label}</span>
              <h3 className={styles.principle__title}>{pr.title}</h3>
              <p className={styles.principle__text}>{pr.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* pin 구간: 바깥 래퍼(200vh) 안 sticky(100vh)가 고정되고, 그 안에서 원이 성장 →
          고정 해제되며 밝은 원째로 스크롤업해 LINEUP 으로 이어짐. (reduce 시 생략 → 바로 LINEUP) */}
      {!reduce && (
        <div ref={pinRef} className={styles.aboutPin} aria-hidden="true">
          <div className={styles.aboutPinSticky}>
            <motion.div
              className={styles.lineupReveal}
              style={{ clipPath: revealClip }}
            />
          </div>
        </div>
      )}

      {/* 마우스 따라다니는 옅은 흰 스포트라이트 */}
      <div className={styles.spotlight} aria-hidden="true" />
    </motion.section>
  );
}
