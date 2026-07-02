"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 영화제 초청·수상 (데모용 가상 정보)
   image: 중앙 패널에 노출되는 행사 이미지 — 임시로 posters-photo/m* 매핑 */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명", image: "/posters-photo/m3.jpg" },
  { yr: "2024", name: "전주국제영화제", section: "국제경쟁", film: "여름의 잔상", image: "/posters-photo/m1.jpg" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도", image: "/posters-photo/m4.jpg" },
  { yr: "2023", name: "야마가타 다큐멘터리", section: "International Competition", film: "필름의 끝", image: "/posters-photo/m6.jpg" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막", image: "/posters-photo/m8.jpg" },
];

export default function Festivals() {
  const scrollerRef = useRef<HTMLDivElement | null>(null); // 300vh pin 컨테이너
  const stageRef = useRef<HTMLDivElement | null>(null); // 고정 무대(중앙선 기준)
  const trackRef = useRef<HTMLDivElement | null>(null); // 축제명 트랙(위아래 이동)
  const N = FESTIVALS.length;

  // pin 컨테이너 진행도 0~1 (헤더는 이 밖에 있어 순수 pin 구간만 매핑)
  const { scrollYProgress } = useScroll({
    target: scrollerRef,
    offset: ["start start", "end end"],
  });
  // f: 0 → N-1 (연속 활성 위치). 앞뒤 약간 여유를 둬 첫/마지막 항목이 중앙에 머물게.
  const f = useTransform(scrollYProgress, [0.04, 0.96], [0, N - 1], { clamp: true });

  // 중앙에 가장 가까운 정수 인덱스 → 연도·영화명·이미지 교체 기준
  const [activeIndex, setActiveIndex] = useState(0);
  useMotionValueEvent(f, "change", (v) => {
    const i = Math.min(N - 1, Math.max(0, Math.round(v)));
    setActiveIndex((prev) => (prev === i ? prev : i));
  });

  // 트랙 translateY — 중앙선(stageH/2)에 항목 f 의 중심이 오도록
  const [mtr, setMtr] = useState({ stride: 116, firstCenter: 58, stageH: 560 });
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage || track.children.length < 2) return;
      const r0 = track.children[0] as HTMLElement;
      const r1 = track.children[1] as HTMLElement;
      setMtr({
        stride: r1.offsetTop - r0.offsetTop,
        firstCenter: r0.offsetTop + r0.offsetHeight / 2,
        stageH: stage.clientHeight,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const trackY = useTransform(
    f,
    (v) => mtr.stageH / 2 - mtr.firstCenter - v * mtr.stride
  );

  const act = FESTIVALS[activeIndex];

  return (
    <section className={styles.fests} id="festivals">
      {/* [5] 제목·리드문 — sticky 밖 일반 흐름 (스크롤하면 위로 흘러감) */}
      <motion.div
        className={styles.festsIntro}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.inner}>
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
        </div>
      </motion.div>

      {/* [3] pin 무대 — 중앙선(연도·영화명·이미지)은 고정, 축제명 트랙만 위아래로 흐름 */}
      <div ref={scrollerRef} className={styles.festsScroller}>
        <div className={styles.festsSticky}>
          <div className={styles.inner}>
            <div ref={stageRef} className={styles.festStage}>
              {/* 중앙 고정: 연도(좌) · 영화명(우) · 이미지(중앙 위) */}
              <span className={styles.festCenterYr}>{act.yr}</span>
              <span className={styles.festCenterFilm}>{act.film}</span>
              <motion.div
                key={`img-${activeIndex}`}
                className={styles.festCenterImg}
                style={{ x: "-50%", y: "-118%" }}
                initial={{ scale: 0, rotate: 10 }}
                animate={{ scale: 1, rotate: -15 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                whileHover={{
                  rotate: 0,
                  transition: { type: "tween", duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                }}
              >
                <Image src={act.image} alt="" fill sizes="340px" />
              </motion.div>

              {/* 축제명 트랙 — translateY 로 이동, 중앙선을 통과 */}
              <motion.div ref={trackRef} className={styles.festTrack} style={{ y: trackY }}>
                {FESTIVALS.map((fe, i) => (
                  <NameRow key={fe.name} fe={fe} i={i} f={f} />
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 축제명 한 줄 — 중앙선으로부터의 거리(|f-i|)로 색/투명도 (중앙=검정·또렷, 멀수록 옅은 그레이) */
function NameRow({
  fe,
  i,
  f,
}: {
  fe: (typeof FESTIVALS)[number];
  i: number;
  f: MotionValue<number>;
}) {
  const dist = useTransform(f, (v) => Math.abs(v - i));
  const opacity = useTransform(dist, [0, 1, 2], [1, 0.2, 0]);
  const nameColor = useTransform(dist, [0, 0.6], ["#0c0c0c", "#c2c2bd"]);
  const subColor = useTransform(dist, [0, 0.6], ["#6c6c68", "#d0d0cb"]);

  return (
    <motion.div className={styles.festRow} style={{ opacity }}>
      <motion.span className={styles.fest__name} style={{ color: nameColor }}>
        {fe.name}
        <motion.span style={{ color: subColor }}>{fe.section}</motion.span>
      </motion.span>
    </motion.div>
  );
}
