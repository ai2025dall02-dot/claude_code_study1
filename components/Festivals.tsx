"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  type Variants,
} from "framer-motion";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 영화제 초청·수상 (데모용 가상 정보)
   image: 활성 항목에 노출되는 행사 이미지 — 임시로 posters-photo/m* 매핑 */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명", image: "/posters-photo/m3.jpg" },
  { yr: "2024", name: "전주국제영화제", section: "국제경쟁", film: "여름의 잔상", image: "/posters-photo/m1.jpg" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도", image: "/posters-photo/m4.jpg" },
  { yr: "2023", name: "야마가타 다큐멘터리", section: "International Competition", film: "필름의 끝", image: "/posters-photo/m6.jpg" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막", image: "/posters-photo/m8.jpg" },
];

/* 이미지 등장/퇴장 — spring 으로 '뿅', 반대각(+10°)에서 -15° 로 회전하며 커짐 */
const THUMB_V: Variants = {
  off: { scale: 0, rotate: 10, transition: { type: "spring", stiffness: 300, damping: 26 } },
  on: {
    scale: 1,
    rotate: -15,
    transition: { type: "spring", stiffness: 260, damping: 18 },
  },
};

export default function Festivals() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const N = FESTIVALS.length;

  // FILMMAKERS 식 sticky pin — 섹션(300vh) 진행도 0~1 을 항목 수로 나눠 활성 인덱스 산출.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const [activeIndex, setActiveIndex] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.min(N - 1, Math.max(0, Math.floor(p * N)));
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  });

  return (
    <section ref={sectionRef} className={styles.festsWrap} id="festivals">
      <div className={styles.festsSticky}>
        <motion.div
          className={styles.inner}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className={styles.head}>
            <div>
              <span className={styles.eyebrow}>Selections &amp; Awards</span>
              <TypeTitle solid="FESTI" outline="VALS" />
            </div>
            <span className={styles.index}>국내외 영화제 초청 · 수상</span>
          </header>

          <p className={styles.festsLead}>
            우리가 고른 영화는 세계의 스크린을 먼저 통과합니다. 필름 누벨의 라인업은
            부산에서 로테르담까지, 작가의 첫 영화가 관객을 만나는 가장 먼 길을
            함께합니다.
          </p>

          {/* 리스트 — sticky 로 머무는 동안 스크롤 진행도에 따라 activeIndex 가 순차 이동 */}
          <div className={styles.festsList}>
            {FESTIVALS.map((fe, i) => (
              <FestItem key={fe.name} fe={fe} active={i === activeIndex} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* 항목 1개 — 활성 여부(activeIndex 기반)로 색/이미지를 제어(항목별 useScroll 제거, 일원화). */
function FestItem({
  fe,
  active,
}: {
  fe: (typeof FESTIVALS)[number];
  active: boolean;
}) {
  const nameColor = active ? "#0c0c0c" : "#c2c2bd";
  const metaColor = active ? "#3a3a38" : "#cbcbc6";
  const subColor = active ? "#6c6c68" : "#d0d0cb";
  const tr = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className={styles.fest}>
      <motion.span className={styles.fest__yr} animate={{ color: metaColor }} transition={tr}>
        {fe.yr}
      </motion.span>
      <motion.span className={styles.fest__name} animate={{ color: nameColor }} transition={tr}>
        {fe.name}
        <motion.span animate={{ color: subColor }} transition={tr}>
          {fe.section}
        </motion.span>
      </motion.span>
      <motion.span className={styles.fest__film} animate={{ color: metaColor }} transition={tr}>
        {fe.film}
      </motion.span>

      {/* 활성 항목 이미지: spring 으로 반대각에서 -15° 회전하며 scale 0→1 등장 */}
      <motion.span
        className={styles.fest__thumb}
        style={{ y: "-50%" }}
        variants={THUMB_V}
        initial="off"
        animate={active ? "on" : "off"}
        aria-hidden="true"
      >
        <Image src={fe.image} alt="" fill sizes="260px" />
      </motion.span>
    </div>
  );
}
