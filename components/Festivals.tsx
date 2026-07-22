"use client";

// FESTIVALS — incredibles.dev "Incredible devs you can count on." 풍.
//  B. 큰 타이틀(FILMMAKERS 급) + 하단 작은 설명.  C. 세로 카드(이미지 위 / 텍스트 아래, 흰 배경+검정 라인).
//  D. 카드가 같은 중앙 위치에서 살짝 눕은(rotateX) 상태로 아래→위로 올라와 정면으로 펴지며 "스택"으로 쌓임.
//  E. 뒤에 깔린 카드는 상단만 삐져나오되 깊이별로 회색 단계(엘리베이션).  F. 다음 섹션 전환 구간에서 위로 순차 exit.
//  (A: 카드 등장은 타이틀/본문이 다 드러난 뒤로 미룸. FILMMAKERS 걷힘 리빌은 Landing.module.css z-index/overlap)
import Image from "next/image";
import { useReducedMotion, useScroll, useSpring, useTransform, motion, type MotionValue } from "framer-motion";
import { useRef } from "react";
import RiseTitle from "./RiseTitle";
import styles from "./Landing.module.css";

/* 영화제 초청·수상 (데모 · 4개). image: 카드 상단 이미지(/festival_*.png). */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명", image: "/festival_1.png" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도", image: "/festival_3.png" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막", image: "/festival_5.png" },
  { yr: "2021", name: "타이베이 금마장", section: "International New Talent", film: "빛의 문", image: "/festival_9.png" },
];

// [A·D·F] 스택 타이밍 — 진행도 기준. 타이틀/본문(리빌 ~0.23)이 다 드러난 뒤(START=0.30)부터 카드가 순차 등장.
const START = 0.3; // A: 카드 등장 시작(뒤로 미룸)
const GAP = 0.1; // 카드 간 등장 간격
const RISE = 0.09; // 한 장이 올라와 정면으로 안착하는 구간
const ENTER = 620; // 진입 시작 y(중앙 아래 px)
const PEEK = 20; // 뒤로 밀릴 때 한 장당 위로 삐져나오는 양(px)
const TILT = 20; // B: 진입 시 rotateX(deg) — 눕혀진 상태에서 0 으로 펴짐
const ENTER_SCALE = 1.16; // B: 진입 시 확대 배율(→ 1 로 축소되며 안착)
// D: exit — 최하단(가장 뒤, i=0) 카드부터 먼저 위로 빠지고 위 카드가 순차로 따라 올라감.
const EXIT_BASE = 0.74; // exit 시작 진행도
const EXIT_STAGGER = 0.04; // 카드별 exit 시차
const EXIT_SPAN = 0.09; // 한 장 exit 지속
const EXIT_Y = -820; // exit 시 위로 빠지는 y

export default function Festivals() {
  const reduce = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: scrollerRef, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.6 });
  const N = FESTIVALS.length;

  return (
    <section className={styles.fests} id="festivals">
      <div ref={scrollerRef} className={styles.festsScroller}>
        <div className={styles.festsSticky}>
          {/* B. 큰 타이틀(뒤 레이어) + 하단 작은 설명 — FILMMAKERS 가 걷히면 아래에서 드러남 */}
          <div className={styles.festHead}>
            <span className={styles.eyebrow}>Selections &amp; Awards</span>
            <RiseTitle solid="FESTI" outline="VALS" inViewMargin="-10% 0px" />
            <motion.p
              className={styles.festHeadSub}
              initial={{ opacity: 0, y: reduce ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              세계 유수 영화제가 먼저 알아본 이름들 — 초청과 수상으로 이어진 배급작의 궤적.
            </motion.p>
          </div>

          {/* C·D·E·F. 세로 카드 스택(앞 레이어) — 제자리에서 눕힘→정면으로 펴지며 쌓이고, 끝에서 위로 순차 exit */}
          <div className={styles.festStack}>
            {FESTIVALS.map((fe, i) => (
              <StackCard key={fe.name} fe={fe} i={i} N={N} p={p} reduce={!!reduce} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StackCard({
  fe,
  i,
  N,
  p,
  reduce,
}: {
  fe: (typeof FESTIVALS)[number];
  i: number;
  N: number;
  p: MotionValue<number>;
  reduce: boolean;
}) {
  const depth = N - 1 - i; // 0 = 맨 앞(front), N-1 = 맨 뒤(back)
  const inStart = START + i * GAP;
  const inEnd = inStart + RISE;
  const backTotal = depth * PEEK; // 이 카드 위에 쌓일 카드 수만큼 위로 밀림
  const settleScale = 1 - 0.05 * depth; // 뒤로 밀릴수록 살짝 축소(딥스)
  const scrimMax = Math.min(0.62, depth * 0.2); // C: 깊이별 회색 DIM — 최하단(뒤) 진하게 → 앞으로 갈수록 연하게
  // D: 최하단(i=0)부터 먼저 exit → 위 카드(i 큰)가 순차로 따라 올라감(최하단→최상단 stagger)
  const exitStart = EXIT_BASE + i * EXIT_STAGGER;
  const exitEnd = exitStart + EXIT_SPAN;

  // y: 아래(ENTER) → 중앙(0) → 뒤로 밀리며 위로(-backTotal) → exit 로 위로 빠짐(EXIT_Y). reduce 면 0 고정.
  const y = useTransform(
    p,
    [inStart, inEnd, exitStart, exitEnd],
    reduce ? [0, 0, 0, 0] : [ENTER, 0, -backTotal, EXIT_Y],
    { clamp: true }
  );
  // B: 진입 시 rotateX(TILT)로 눕혀졌다가 안착(0)하며 정면으로 펴짐.
  const rotateX = useTransform(p, [inStart, inEnd], reduce ? [0, 0] : [TILT, 0], { clamp: true });
  // opacity: 올라오며 페이드 인 → exit 에서 페이드 아웃.
  const opacity = useTransform(
    p,
    [inStart - 0.03, inStart + RISE * 0.5, exitStart, exitEnd],
    reduce ? [1, 1, 1, 1] : [0, 1, 1, 0],
    { clamp: true }
  );
  // B: scale — 진입 시 확대(ENTER_SCALE)된 상태 → 1 로 안착, 뒤로 밀리며 settleScale.
  const scale = useTransform(p, [inStart, inEnd, exitStart], reduce ? [1, 1, 1] : [ENTER_SCALE, 1, settleScale], {
    clamp: true,
  });
  // C: 회색 DIM — 뒤로 밀리면 등장(깊이별 강도), 자기 exit 시 페이드 아웃.
  const scrim = useTransform(
    p,
    [inEnd, inEnd + GAP, exitStart, exitEnd],
    reduce ? [0, 0, 0, 0] : [0, scrimMax, scrimMax, 0],
    { clamp: true }
  );

  return (
    <motion.article className={styles.festCard} style={{ y, rotateX, opacity, scale, zIndex: i }}>
      <div className={styles.festCard__img}>
        <div className={styles.festCard__imgFrame}>
          <Image src={fe.image} alt="" fill sizes="(max-width:767px) 78vw, 340px" />
        </div>
      </div>
      <div className={styles.festCard__body}>
        <span className={styles.festCard__yr}>{fe.yr}</span>
        <h3 className={styles.festCard__name}>{fe.name}</h3>
        <p className={styles.festCard__desc}>
          {fe.section} · 배급작 «{fe.film}»
        </p>
      </div>
      {/* E. 뒤로 밀린 카드의 삐져나온 상단을 깊이별 회색으로(엘리베이션) */}
      <motion.span className={styles.festCard__scrim} style={{ opacity: scrim }} aria-hidden="true" />
    </motion.article>
  );
}
