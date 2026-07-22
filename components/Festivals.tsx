"use client";

// FESTIVALS — incredibles.dev "Incredible devs you can count on." 풍.
//  B. 큰 타이틀(FILMMAKERS 급) 중앙 배치(뒤 레이어).  C. 세로 카드(이미지 위 / 텍스트 아래, 흰 배경+검정 라인).
//  D. 카드가 같은 중앙 위치에서 아래→위로 올라와 이전 카드 위에 "스택"으로 쌓임(뒤 카드는 상단만 삐져나와 회색).
//  E. 항목 4개.  (A: FILMMAKERS 가 걷히며 리빌되는 전환은 Landing.module.css 의 z-index/overlap 으로 처리)
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

// [D] 스택 타이밍 — 카드 i 는 진행도 START + i*GAP 에서 올라오기 시작해 +RISE 에 중앙 안착.
const START = 0.12;
const GAP = 0.2;
const RISE = 0.14;
const ENTER = 680; // 진입 시 카드 시작 위치(중앙 아래 px)
const PEEK = 22; // 뒤로 밀릴 때 카드 한 장당 위로 삐져나오는 양(px)

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
          {/* B. 큰 타이틀(뒤 레이어) — FILMMAKERS 가 걷히면 아래에서 드러남 */}
          <div className={styles.festHead}>
            <span className={styles.eyebrow}>Selections &amp; Awards</span>
            <RiseTitle solid="FESTI" outline="VALS" inViewMargin="-10% 0px" />
          </div>

          {/* C·D. 세로 카드 스택(앞 레이어) — 제자리에서 아래→위로 쌓임 */}
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
  const inStart = START + i * GAP;
  const inEnd = inStart + RISE;
  const backTotal = (N - 1 - i) * PEEK; // 이 카드보다 뒤에 올라올 카드 수만큼 위로 밀림

  // y: 아래(ENTER) → 중앙(0) → 뒤로 밀리며 위로(-backTotal). reduce 면 0 고정(정적).
  const y = useTransform(p, [inStart, inEnd, 1], reduce ? [0, 0, 0] : [ENTER, 0, -backTotal], { clamp: true });
  // opacity: 올라오며 페이드 인.
  const opacity = useTransform(p, [inStart - 0.04, inStart + RISE * 0.5], reduce ? [1, 1] : [0, 1], { clamp: true });
  // 뒤로 밀리면 살짝 축소(딥스감) + 회색 스크림 등장 → 삐져나온 상단이 회색으로.
  const scale = useTransform(p, [inEnd, 1], reduce ? [1, 1] : [1, 1 - 0.05 * (N - 1 - i)], { clamp: true });
  const scrim = useTransform(p, [inEnd, inEnd + GAP], reduce ? [0, 0] : [0, 0.42], { clamp: true });

  return (
    <motion.article className={styles.festCard} style={{ y, opacity, scale, zIndex: i }}>
      <div className={styles.festCard__img}>
        <Image src={fe.image} alt="" fill sizes="(max-width:767px) 86vw, 360px" />
      </div>
      <div className={styles.festCard__body}>
        <span className={styles.festCard__yr}>{fe.yr}</span>
        <h3 className={styles.festCard__name}>{fe.name}</h3>
        <p className={styles.festCard__desc}>
          {fe.section} · 배급작 «{fe.film}»
        </p>
      </div>
      {/* 뒤로 밀린 카드의 삐져나온 상단을 회색으로(딥스) */}
      <motion.span className={styles.festCard__scrim} style={{ opacity: scrim }} aria-hidden="true" />
    </motion.article>
  );
}
