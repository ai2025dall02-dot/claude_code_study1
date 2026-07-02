"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 영화제 초청·수상 (데모용 가상 정보)
   image: 우측 패널에 노출되는 행사 이미지 — 임시로 posters-photo/m* 매핑 */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명", image: "/posters-photo/m3.jpg" },
  { yr: "2024", name: "전주국제영화제", section: "국제경쟁", film: "여름의 잔상", image: "/posters-photo/m1.jpg" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도", image: "/posters-photo/m4.jpg" },
  { yr: "2023", name: "야마가타 다큐멘터리", section: "International Competition", film: "필름의 끝", image: "/posters-photo/m6.jpg" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막", image: "/posters-photo/m8.jpg" },
];

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

  const act = FESTIVALS[activeIndex];

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

          <div className={styles.festsBody}>
            {/* 좌: 축제명 리스트 (활성=검정, 비활성=회색) */}
            <div className={styles.festsNames}>
              {FESTIVALS.map((fe, i) => {
                const on = i === activeIndex;
                return (
                  <div key={fe.name} className={styles.fest}>
                    <motion.span
                      className={styles.fest__name}
                      animate={{ color: on ? "#0c0c0c" : "#c2c2bd" }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {fe.name}
                      <motion.span
                        animate={{ color: on ? "#6c6c68" : "#d0d0cb" }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {fe.section}
                      </motion.span>
                    </motion.span>
                  </div>
                );
              })}
            </div>

            {/* 우: 활성 항목의 연도·영화명·이미지만 표시하는 단일 패널 */}
            <div className={styles.festsPanel}>
              <motion.div
                key={`meta-${activeIndex}`}
                className={styles.festsPanel__meta}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className={styles.festsPanel__yr}>{act.yr}</span>
                <span className={styles.festsPanel__film}>{act.film}</span>
              </motion.div>

              {/* 이미지 — activeIndex 를 key 로 줘 바뀔 때마다 remount → spring 재등장
                  (반대각 +10° 에서 scale 0 → -15° / scale 1 로 '뿅') */}
              <motion.div
                key={`img-${activeIndex}`}
                className={styles.festsPanel__img}
                initial={{ scale: 0, rotate: 10 }}
                animate={{ scale: 1, rotate: -15 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                /* [3] 평소 -15° → hover 시 반대쪽 +15° 로 부드럽게 회전 */
                whileHover={{
                  rotate: 15,
                  transition: { type: "tween", duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                }}
              >
                <Image src={act.image} alt="" fill sizes="340px" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
