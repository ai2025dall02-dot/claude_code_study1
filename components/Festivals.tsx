"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 영화제 초청·수상 (데모용 가상 정보)
   image: 활성(중앙) 시 노출되는 행사 이미지 — 행사 전용 파일이 없어 posters-photo/m* 로 임시 매핑
   (실제 사진 확보 시 이 경로만 교체하면 됨) */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명", image: "/posters-photo/m3.jpg" },
  { yr: "2024", name: "전주국제영화제", section: "국제경쟁", film: "여름의 잔상", image: "/posters-photo/m1.jpg" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도", image: "/posters-photo/m4.jpg" },
  { yr: "2023", name: "야마가타 다큐멘터리", section: "International Competition", film: "필름의 끝", image: "/posters-photo/m6.jpg" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막", image: "/posters-photo/m8.jpg" },
];

export default function Festivals() {
  const reduce = useReducedMotion();

  // 등장 애니메이션 (ABOUT 식 fade-up 스태거). 라인(scaleX) 은 제거됨.
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

        {/* 좌측정렬 리드문 (ABOUT 본문 폰트 톤) */}
        <motion.p className={styles.festsLead} variants={item}>
          우리가 고른 영화는 세계의 스크린을 먼저 통과합니다. 필름 누벨의 라인업은
          부산에서 로테르담까지, 작가의 첫 영화가 관객을 만나는 가장 먼 길을
          함께합니다.
        </motion.p>

        {/* 대형 리스트 — 각 항목이 화면 세로 중앙에 오면 활성(강조 + 이미지 등장) */}
        <motion.div className={styles.festsList} variants={innerGroup}>
          {FESTIVALS.map((fe) => (
            <FestItem key={`${fe.yr}-${fe.film}`} fe={fe} item={item} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* 항목 1개 — 자신의 스크롤 위치로 '화면 세로 중앙 근접' 여부를 판정해 활성도(0~1)를 만든다.
   활성: 텍스트 강조(옅은 그레이→진하게, 축제명 검정) + 이미지 scale 0→1 + rotate 15°. */
function FestItem({
  fe,
  item,
}: {
  fe: (typeof FESTIVALS)[number];
  item: Variants;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // offset ["start center","end center"]: 화면 중앙선이 항목 위(top)에 닿으면 0,
  // 아래(bottom)에 닿으면 1. 즉 0~1 구간 = '중앙선이 항목 안에 있음'.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  // 중앙 진입(0→0.12)에서 커지고, 이탈(0.88→1)에서 작아짐 → 중앙 항목만 또렷/이미지 등장.
  const active = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0]);

  // 텍스트 색: 비활성(옅은 그레이) → 활성(진하게 / 축제명 검정)
  const nameColor = useTransform(active, [0, 1], ["#c2c2bd", "#0c0c0c"]);
  const metaColor = useTransform(active, [0, 1], ["#cbcbc6", "#3a3a38"]);
  const subColor = useTransform(active, [0, 1], ["#d0d0cb", "#6c6c68"]);

  return (
    <motion.div ref={ref} className={styles.fest} variants={item}>
      <motion.span className={styles.fest__yr} style={{ color: metaColor }}>
        {fe.yr}
      </motion.span>
      <motion.span className={styles.fest__name} style={{ color: nameColor }}>
        {fe.name}
        <motion.span style={{ color: subColor }}>{fe.section}</motion.span>
      </motion.span>
      <motion.span className={styles.fest__film} style={{ color: metaColor }}>
        {fe.film}
      </motion.span>

      {/* 활성 시 이미지: scale 0→1 + rotate 15° (그림자·페이드 없음, transform-origin center) */}
      <motion.span
        className={styles.fest__thumb}
        style={{ y: "-50%", scale: active, rotate: 15 }}
        aria-hidden="true"
      >
        <Image src={fe.image} alt="" fill sizes="280px" />
      </motion.span>
    </motion.div>
  );
}
