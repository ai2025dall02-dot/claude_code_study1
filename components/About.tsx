"use client";

import { useRef } from "react";
import {
  motion,
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

export default function About() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  // 섹션을 지나는 동안 배경이 점점 더 어두워짐
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 1],
    ["#26262a", "#060607"]
  );

  // 아래에서 위로 + opacity 0→1 (원칙은 custom 인덱스로 좌측부터 stagger)
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 48 },
    show: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        delay: reduce ? 0 : i * 0.15,
      },
    }),
  };

  return (
    <motion.section
      ref={ref}
      id="about"
      className={`${styles.section} ${styles.about}`}
      style={{ backgroundColor }}
    >
      <div className={styles.inner}>
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>About — 배급사 소개</span>
            <h2 className={styles.title}>
              FILM <em>NOUVELLE</em>
            </h2>
          </div>
          <span className={styles.index}>Since 2014 · Seoul</span>
        </header>

        <motion.p
          className={styles.aboutBody}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-12% 0px" }}
        >
          필름 누벨은 2014년, 극장에서 사라져 가던 독립·예술영화를 다시 스크린에
          올리기 위해 시작했습니다. 우리는 한 해에 단 몇 편만을 고릅니다. 적게
          고르는 대신, 한 편의 영화가 관객을 만나는 모든 길 — 개봉, 기획전, 공동체
          상영, 아카이브 — 을 끝까지 동행합니다.
        </motion.p>

        <div className={styles.principles}>
          {PRINCIPLES.map((pr, i) => (
            <motion.div
              key={pr.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-10% 0px" }}
            >
              <span className={styles.principle__label}>원칙 / {pr.label}</span>
              <h3 className={styles.principle__title}>{pr.title}</h3>
              <p className={styles.principle__text}>{pr.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 인용문: word-by-word reveal 유지 + 섹션 하단으로 이동 */}
      <TextReveal text="좋은 영화는 사라지지 않는다. 다만 옮겨질 곳을 기다릴 뿐이다." />
    </motion.section>
  );
}
