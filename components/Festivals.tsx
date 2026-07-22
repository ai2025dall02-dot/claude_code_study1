"use client";

// FESTIVALS — incredibles.dev "Incredible devs you can count on." 풍.
//  타이틀은 정적(애니메이션 없음). 세로 카드(이미지 위 / 텍스트 아래, 흰 배경, 테두리/그림자 없음).
//  카드는 같은 중앙 위치에서 확대+눕은(rotateX) 상태로 아래→위로 올라와 정면으로 펴지며 "스택"으로 쌓임(살짝 스냅).
//  뒤에 깔린 카드는 상단만 삐져나오되 깊이별 회색 DIM(엘리베이션).
//  다음 섹션(JOURNAL) 전환: 카드는 완전히 빠지지 않고 "살짝만" 위로 + 페이드, 그 사이 JOURNAL 이 아래에서
//  올라와 덮으며 FESTIVALS 전체가 위로 밀려남(레이어/overlap 은 Landing.module.css 의 .journalScroller z/margin).
import Image from "next/image";
import {
  cubicBezier,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import styles from "./Landing.module.css";

/* 영화제 초청·수상 (데모 · 4개). image: 카드 상단 이미지(/festival_*.png). */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명", image: "/festival_1.png" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도", image: "/festival_3.png" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막", image: "/festival_5.png" },
  { yr: "2021", name: "타이베이 금마장", section: "International New Talent", film: "빛의 문", image: "/festival_9.png" },
];

// 스택 타이밍 — 진행도 기준. 타이틀/본문이 다 드러난 뒤(START=0.30)부터 카드가 순차 등장.
const START = 0.3; // 카드 등장 시작(뒤로 미룸)
const GAP = 0.1; // 카드 간 등장 간격
const RISE = 0.075; // C: 한 장이 올라와 안착하는 구간(짧게 → 빠른 등장)
const ENTER = 620; // 진입 시작 y(중앙 아래 px)
const PEEK = 20; // 뒤로 밀릴 때 한 장당 위로 삐져나오는 양(px)
const TILT = 20; // 진입 시 rotateX(deg) — 눕혀진 상태에서 0 으로 펴짐
const ENTER_SCALE = 1.16; // 진입 시 확대 배율(→ 1 로 축소되며 안착)
// D: 다음 섹션 전환 — 카드는 완전히 빠지지 않고 살짝만 상승 + 페이드(그 사이 JOURNAL 이 덮으며 올라옴).
const LIFT_START = 0.82; // 살짝 상승/페이드 시작 진행도
const LIFT_END = 0.99; // 끝 진행도
const LIFT = 64; // 살짝 위로(px) — 완전히 빠지지 않음
const FADE_TO = 0.28; // 옅어지는 정도(0 아님 — 완전 사라지지 않음)
// C: 등장 스냅 — 후반 급감속 이징(끝에서 톡 붙는 느낌).
const snap = cubicBezier(0.16, 1, 0.3, 1);
const lin = (t: number) => t;

export default function Festivals() {
  const reduce = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: scrollerRef, offset: ["start start", "end end"] });
  // C: 스냅감 — stiffness↑ + damping↓ 로 더 빠르고 톡 붙게(과하지 않게).
  const p = useSpring(scrollYProgress, { stiffness: 210, damping: 24, mass: 0.5 });
  const N = FESTIVALS.length;

  return (
    <section className={styles.fests} id="festivals">
      <div ref={scrollerRef} className={styles.festsScroller}>
        <div className={styles.festsSticky}>
          {/* A. 타이틀(정적 — 애니메이션 없음) + 하단 작은 설명. FILMMAKERS 가 걷히면 아래에서 드러남 */}
          <div className={styles.festHead}>
            <span className={styles.eyebrow}>Selections &amp; Awards</span>
            <h2 className={styles.title} aria-label="FESTIVALS">
              <span aria-hidden="true">FESTI</span>
              <em aria-hidden="true">VALS</em>
            </h2>
            <p className={styles.festHeadSub}>
              세계 유수 영화제가 먼저 알아본 이름들 — 초청과 수상으로 이어진 배급작의 궤적.
            </p>
          </div>

          {/* 세로 카드 스택(앞 레이어) — 제자리에서 확대+눕힘→정면으로 펴지며 쌓이고, 전환 때 살짝 상승+페이드 */}
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
  const scrimMax = Math.min(0.62, depth * 0.2); // 깊이별 회색 DIM — 최하단(뒤) 진하게 → 앞으로 갈수록 연하게

  // y: 아래(ENTER) → 중앙(0, 스냅) → 뒤로 밀리며 위로(-backTotal) → 전환 때 살짝만 더 위로(-backTotal-LIFT).
  const y = useTransform(
    p,
    [inStart, inEnd, LIFT_START, LIFT_END],
    reduce ? [0, 0, 0, 0] : [ENTER, 0, -backTotal, -backTotal - LIFT],
    { clamp: true, ease: [snap, lin, lin] }
  );
  // 진입 시 rotateX(TILT)로 눕혀졌다가 안착(0)하며 정면으로 펴짐(스냅).
  const rotateX = useTransform(p, [inStart, inEnd], reduce ? [0, 0] : [TILT, 0], { clamp: true, ease: [snap] });
  // opacity: 올라오며 페이드 인 → 전환 때 옅어짐(FADE_TO, 완전 사라지지 않음).
  const opacity = useTransform(
    p,
    [inStart - 0.03, inStart + RISE * 0.5, LIFT_START, LIFT_END],
    reduce ? [1, 1, 1, 1] : [0, 1, 1, FADE_TO],
    { clamp: true }
  );
  // scale — 진입 시 확대(ENTER_SCALE) → 1 로 안착(스냅), 뒤로 밀리며 settleScale.
  const scale = useTransform(p, [inStart, inEnd, LIFT_START], reduce ? [1, 1, 1] : [ENTER_SCALE, 1, settleScale], {
    clamp: true,
    ease: [snap, lin],
  });
  // 회색 DIM — 뒤로 밀리면 등장(깊이별 강도), 전환 때 살짝 옅어짐.
  const scrim = useTransform(
    p,
    [inEnd, inEnd + GAP, LIFT_START, LIFT_END],
    reduce ? [0, 0, 0, 0] : [0, scrimMax, scrimMax, scrimMax * 0.5],
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
      {/* 뒤로 밀린 카드의 삐져나온 상단을 깊이별 회색으로(엘리베이션) */}
      <motion.span className={styles.festCard__scrim} style={{ opacity: scrim }} aria-hidden="true" />
    </motion.article>
  );
}
