"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 영화제 초청·수상 (데모용 가상 정보) */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명" },
  { yr: "2024", name: "전주국제영화제", section: "국제경쟁", film: "여름의 잔상" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도" },
  { yr: "2023", name: "야마가타 다큐멘터리", section: "International Competition", film: "필름의 끝" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막" },
];

export default function Festivals() {
  const reduce = useReducedMotion();

  // ABOUT(FILM NOUVELLE) 등장 애니메이션을 그대로 재사용 —
  // group: 부모 stagger, innerGroup: 리스트 내부 stagger,
  // item: fade-up, line: scaleX 0→1 (좌→우로 길어지는 라인).
  const group: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.18, delayChildren: 0.15 } },
  };
  const innerGroup: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 44 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  };
  const line: Variants = {
    hidden: { scaleX: reduce ? 1 : 0 },
    show: {
      scaleX: 1,
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section className={`${styles.section} ${styles.fests}`} id="festivals">
      <motion.div
        className={styles.inner}
        variants={group}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-20% 0px" }}
      >
        <motion.header className={styles.head} variants={item}>
          <div>
            <span className={styles.eyebrow}>Selections &amp; Awards</span>
            <TypeTitle solid="FESTI" outline="VALS" />
          </div>
          <span className={styles.index}>국내외 영화제 초청 · 수상</span>
        </motion.header>

        <motion.div
          className={`${styles.festsLine} ${styles.festsLineHead}`}
          variants={line}
          aria-hidden="true"
        />

        {/* 좌측정렬 리드문 (1~2줄) */}
        <motion.p className={styles.festsLead} variants={item}>
          우리가 고른 영화는 세계의 스크린을 먼저 통과합니다. 필름 누벨의 라인업은
          부산에서 로테르담까지, 작가의 첫 영화가 관객을 만나는 가장 먼 길을
          함께합니다.
        </motion.p>

        {/* 대형 리스트 — 항목별 순차 등장(item stagger) */}
        <motion.div className={styles.festsList} variants={innerGroup}>
          {FESTIVALS.map((fe) => (
            <motion.div
              key={`${fe.yr}-${fe.film}`}
              className={styles.fest}
              variants={item}
            >
              <span className={styles.fest__yr}>{fe.yr}</span>
              <span className={styles.fest__name}>
                {fe.name}
                <span>{fe.section}</span>
              </span>
              <span className={styles.fest__film}>{fe.film}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
