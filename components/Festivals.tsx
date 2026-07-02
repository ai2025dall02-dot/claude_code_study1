"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 영화제 초청·수상 (데모용 가상 정보)
   image: 중앙에 노출되는 행사 이미지 — 임시로 posters-photo/m* 매핑 */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명", image: "/posters-photo/m3.jpg" },
  { yr: "2024", name: "전주국제영화제", section: "국제경쟁", film: "여름의 잔상", image: "/posters-photo/m1.jpg" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도", image: "/posters-photo/m4.jpg" },
  { yr: "2023", name: "야마가타 다큐멘터리", section: "International Competition", film: "필름의 끝", image: "/posters-photo/m6.jpg" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막", image: "/posters-photo/m8.jpg" },
];

export default function Festivals() {
  const reduce = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement | null>(null); // 300vh pin 컨테이너
  const stageRef = useRef<HTMLDivElement | null>(null); // 고정 무대(중앙선 기준)
  const trackRef = useRef<HTMLDivElement | null>(null); // 축제명 트랙(위아래 이동)
  const N = FESTIVALS.length;

  // pin 컨테이너 진행도 0~1 (헤더는 이 밖에 있어 순수 pin 구간만 매핑)
  const { scrollYProgress } = useScroll({
    target: scrollerRef,
    offset: ["start start", "end end"],
  });
  // [3] 끝 구간(0.82~1)엔 마지막 항목이 중앙에 고정된 채 유지되다가 다음 섹션으로.
  const f = useTransform(scrollYProgress, [0.04, 0.82], [0, N - 1], { clamp: true });
  // 스크롤 선형 f 를 spring 으로 따라가게 → 멈추면 살짝 오버슈트 후 정착하는 '뿅' 느낌.
  // stiffness↑·damping↓ 로 더 탄력있게 (너무 통통 튀면 damping 을 32 로).
  const springF = useSpring(f, { stiffness: 400, damping: 28 });

  const [activeIndex, setActiveIndex] = useState(0);
  useMotionValueEvent(f, "change", (v) => {
    const i = Math.min(N - 1, Math.max(0, Math.round(v)));
    setActiveIndex((prev) => (prev === i ? prev : i));
  });

  // 트랙 translateY — 항목 f 의 중심이 중앙선(stageH/2)에 오도록
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
    springF,
    (v) => mtr.stageH / 2 - mtr.firstCenter - v * mtr.stride
  );

  // [3] 등장 — 트랙 진입 시 각 행이 아래에서 위로 순차 fade-up (개별 행 내부 wrapper 에만 적용 →
  // 트랙 전체 translateY(pin) 과 충돌 없음)
  const rowContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };
  const rowItem: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  const act = FESTIVALS[activeIndex];

  return (
    <section className={styles.fests} id="festivals">
      {/* [5] 제목 — sticky 밖 일반 흐름 + [3] 등장 fade-up (리드문은 [1] 로 제거) */}
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

          {/* 섹션 간략 설명(약 2줄) — 제목과 리스트 사이 간격 판단용. festsIntro 안(일반 흐름)에 배치 */}
          <p className={styles.festsDesc}>
            우리가 배급한 작품들이 국내외 영화제에서 받은 초청과 수상의 기록입니다.
            부산에서 로테르담까지, 작가의 첫 영화가 세계의 스크린을 먼저 통과한 순간들.
          </p>
        </div>
      </motion.div>

      {/* pin 무대 — 중앙선(50%)에 [축제명 트랙] → [이미지] → [영화명] 가로 정렬, 트랙만 이동 */}
      <div ref={scrollerRef} className={styles.festsScroller}>
        <div className={styles.festsSticky}>
          <div className={styles.inner}>
            <div ref={stageRef} className={styles.festStage}>
              {/* 좌: 축제명 트랙 (오른쪽 정렬) */}
              <motion.div
                ref={trackRef}
                className={styles.festTrack}
                style={{ y: trackY }}
                variants={rowContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-20% 0px" }}
              >
                {FESTIVALS.map((fe, i) => (
                  <NameRow
                    key={fe.name}
                    fe={fe}
                    i={i}
                    active={i === activeIndex}
                    springF={springF}
                    item={rowItem}
                    reduce={!!reduce}
                  />
                ))}
              </motion.div>

              {/* 우: 이미지 → 영화명(연도) — 중앙선에 가로 정렬, 고정 */}
              <div className={styles.festCenter}>
                <motion.div
                  key={`img-${activeIndex}`}
                  className={styles.festCenterImg}
                  initial={{ scale: 0, rotate: 10 }}
                  animate={{ scale: 1, rotate: -15 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  whileHover={{
                    rotate: 0,
                    transition: { type: "tween", duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  }}
                >
                  <Image src={act.image} alt="" fill sizes="300px" />
                </motion.div>

                <div className={styles.festCenterMeta}>
                  <span className={styles.festCenterYr}>{act.yr}</span>
                  <span className={styles.festCenterFilm}>{act.film}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 축제명 한 줄 — 색은 activeIndex 기준으로 '딱' 전환(이미지 교체와 동기화, 짧은 tween),
   위치 이동(trackY)은 부모의 springF 로 부드럽게. 안쪽(entrance)엔 최초 fade-up(1회). */
function NameRow({
  fe,
  i,
  active,
  springF,
  item,
  reduce,
}: {
  fe: (typeof FESTIVALS)[number];
  i: number;
  active: boolean;
  springF: MotionValue<number>;
  item: Variants;
  reduce: boolean;
}) {
  const tr = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };
  // 작업3: 중앙(springF)으로부터의 거리로 opacity 페이드 — 거리 0→1, 1.2 이상→0.
  // (springF 를 공유하므로 위치 이동과 같은 리듬으로 흐림)
  const dist = useTransform(springF, (v) => Math.abs(v - i));
  const distOpacity = useTransform(dist, [0, 1.2], [1, 0]);
  return (
    <div className={styles.festRow}>
      {/* 작업3: 거리 기반 opacity 는 진입 stagger(variants)와 충돌하지 않게 별도 wrapper 에.
          reduce 면 페이드 끄고 항상 1. */}
      <motion.div style={{ opacity: reduce ? 1 : distOpacity }}>
        <motion.div variants={item}>
          <motion.span
            className={styles.fest__name}
            animate={{ color: active ? "#0c0c0c" : "#c2c2bd" }}
            transition={tr}
          >
            {fe.name}
            <motion.span animate={{ color: active ? "#6c6c68" : "#d0d0cb" }} transition={tr}>
              {fe.section}
            </motion.span>
          </motion.span>
        </motion.div>
      </motion.div>
    </div>
  );
}
