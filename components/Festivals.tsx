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
  type Variants,
} from "framer-motion";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 영화제 초청·수상 (데모용 가상 정보)
   image: 중앙에 노출되는 행사 이미지 — 임시로 posters-photo/m* 매핑
   작업1: 5개 → 9개로 확장 (m9.jpg 는 프로젝트에 없어 타이베이 금마장은 m1 로 대체) */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명", image: "/posters-photo/m3.jpg" },
  { yr: "2024", name: "전주국제영화제", section: "국제경쟁", film: "여름의 잔상", image: "/posters-photo/m1.jpg" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도", image: "/posters-photo/m4.jpg" },
  { yr: "2023", name: "야마가타 다큐멘터리", section: "International Competition", film: "필름의 끝", image: "/posters-photo/m6.jpg" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막", image: "/posters-photo/m8.jpg" },
  { yr: "2022", name: "로카르노 영화제", section: "Concorso Cineasti del presente", film: "재의 계절", image: "/posters-photo/m2.jpg" },
  { yr: "2022", name: "낭트 3대륙 영화제", section: "Compétition", film: "붉은 방", image: "/posters-photo/m5.jpg" },
  { yr: "2021", name: "카를로비바리 영화제", section: "Proxima Competition", film: "겨울 우체국", image: "/posters-photo/m7.jpg" },
  { yr: "2021", name: "타이베이 금마장", section: "International New Talent", film: "빛의 문", image: "/posters-photo/m1.jpg" },
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
  // 작업5: 시작 구간을 0.04→0.01 로 당겨 무대 진입과 거의 동시에 리스트 진행 시작.
  // 끝 구간(0.82~1)엔 마지막 항목이 중앙에 고정된 채 유지되다가 다음 섹션으로.
  const f = useTransform(scrollYProgress, [0.01, 0.82], [0, N - 1], { clamp: true });
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
  // 활성 항목을 무대 중앙(50%)이 아니라 살짝 위(ACTIVE_FRAC=40%)에 두어, 아래로 다음 항목들이
  // 더 많이 쌓여 보이게 한다. 이미지(.festCenter)의 top 도 동일한 40% 로 맞춰 활성 항목과 나란히.
  // (이 값과 CSS .festCenter { top: 40% } 는 항상 같이 움직여야 함)
  const ACTIVE_FRAC = 0.4;
  const trackY = useTransform(
    springF,
    (v) => mtr.stageH * ACTIVE_FRAC - mtr.firstCenter - v * mtr.stride
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
      {/* [5] 제목·설명 — sticky 밖 일반 흐름. 제목 블록과 설명을 각각 개별 motion 으로 분리 */}
      <div className={styles.festsIntro}>
        <div className={styles.inner}>
          <motion.header
            className={styles.head}
            initial={{ opacity: 0, y: reduce ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div>
              <span className={styles.eyebrow}>Selections &amp; Awards</span>
              <TypeTitle solid="FESTI" outline="VALS" />
            </div>
            <span className={styles.index}>국내외 영화제 초청 · 수상</span>
          </motion.header>

          {/* 작업4: 설명 문단은 제목보다 살짝 늦게(delay 0.15) 아래→위 + opacity 로 개별 등장 */}
          <motion.p
            className={styles.festsDesc}
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            우리가 배급한 작품들이 국내외 영화제에서 받은 초청과 수상의 기록입니다.
            부산에서 로테르담까지, 작가의 첫 영화가 세계의 스크린을 먼저 통과한 순간들.
          </motion.p>
        </div>
      </div>

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
                /* 작업3: 리스트 stagger 는 제목(TypeTitle)보다 늦게 발동. 제목은 위(festsIntro)에서
                   먼저 재생되고, 리스트는 트랙이 무대에 들어와 하단 -20% 지점까지 올라왔을 때 등장. */
                viewport={{ once: true, margin: "0px 0px -20% 0px" }}
              >
                {FESTIVALS.map((fe, i) => (
                  <NameRow key={fe.name} fe={fe} active={i === activeIndex} item={rowItem} />
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

/* 축제명 한 줄 — 색은 activeIndex 기준으로 '딱' 전환(이미지 교체와 동기화, 짧은 tween).
   위치 이동(trackY)은 부모의 springF 로 부드럽게. 안쪽(entrance)엔 최초 fade-up(1회).
   작업2: 거리 기반 opacity 페이드 제거 — 비활성도 항상 opacity 1, 활성/비활성은 색상으로만 구분. */
function NameRow({
  fe,
  active,
  item,
}: {
  fe: (typeof FESTIVALS)[number];
  active: boolean;
  item: Variants;
}) {
  const tr = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };
  return (
    <div className={styles.festRow}>
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
    </div>
  );
}
