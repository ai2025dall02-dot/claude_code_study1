"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { TextReveal } from "./TextReveal";
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

/* 제목 "FILM NOUVELLE" — 뷰포트 진입 시 한 글자씩 타이핑 (1회) */
function TypeTitle() {
  const ref = useRef<HTMLHeadingElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();

  const SOLID = "FILM ";
  const OUTLINE = "NOUVELLE";
  const full = SOLID.length + OUTLINE.length;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setCount(full);
      return;
    }
    let c = 0;
    const id = setInterval(() => {
      c += 1;
      setCount(c);
      if (c >= full) clearInterval(id);
    }, 90);
    return () => clearInterval(id);
  }, [inView, reduce, full]);

  const solidShown = SOLID.slice(0, Math.min(count, SOLID.length));
  const outlineShown = OUTLINE.slice(0, Math.max(0, count - SOLID.length));

  return (
    <h2 ref={ref} className={styles.title} aria-label="FILM NOUVELLE">
      <span aria-hidden="true">{solidShown}</span>
      <em aria-hidden="true">{outlineShown}</em>
      <span className={styles.caret} aria-hidden="true" />
    </h2>
  );
}

export default function About() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  // 섹션을 지나는 동안 배경이 흰색(히어로와 연결) → 검정으로 또렷하게 어두워짐.
  // 입력 구간을 [0,0.6]으로 좁혀 진입~중반에 변화가 집중되게 한다.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // 인용문이 화면 중앙에 오기 전(섹션 진입 초반)에 어두워짐이 끝나도록 구간을
  // 앞당김. 0.3 지점에서 이미 검정이며, 이후는 clamp 되어 계속 어두운 상태 유지.
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.2],
    ["#f8f8f8", "#0b0b0c"]
  );
  // 인용문 글자색도 같은 구간에서 어두운→밝은으로 전환 (밝은 배경 대비 유지)
  const quoteFill = useTransform(
    scrollYProgress,
    [0, 0.2],
    ["#1a1a1a", "#f4f4f2"]
  );
  const quoteGhost = useTransform(
    scrollYProgress,
    [0, 0.2],
    ["rgba(26,26,26,0.22)", "rgba(244,244,242,0.16)"]
  );

  // 인용문이 끝난 뒤(아래쪽) 등장하는 그룹: 위/좌측에서부터 순차 cascade
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

  return (
    <motion.section
      ref={ref}
      id="about"
      className={`${styles.section} ${styles.about}`}
      style={{ backgroundColor }}
    >
      {/* 1) 인용문 — 가장 먼저 등장하는 word-by-word reveal (2줄·중앙정렬) */}
      <TextReveal
        text={["좋은 영화는 사라지지 않는다.", "다만 옮겨질 곳을 기다릴 뿐이다."]}
        fillColor={quoteFill}
        ghostColor={quoteGhost}
      />

      {/* 2) 텀(공백)을 두고 이어서 나머지 텍스트들이 순차로 등장 */}
      <motion.div
        className={`${styles.inner} ${styles.aboutAfter}`}
        variants={group}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-15% 0px" }}
      >
        <motion.header className={styles.head} variants={item}>
          <div>
            <span className={styles.eyebrow}>About — 배급사 소개</span>
            <TypeTitle />
          </div>
          <span className={styles.index}>Since 2014 · Seoul</span>
        </motion.header>

        <motion.p className={styles.aboutBody} variants={item}>
          필름 누벨은 2014년, 극장에서 사라져 가던 독립·예술영화를 다시 스크린에
          올리기 위해 시작했습니다. 우리는 한 해에 단 몇 편만을 고릅니다. 적게
          고르는 대신, 한 편의 영화가 관객을 만나는 모든 길 — 개봉, 기획전, 공동체
          상영, 아카이브 — 을 끝까지 동행합니다.
        </motion.p>

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
    </motion.section>
  );
}
