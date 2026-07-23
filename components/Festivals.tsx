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
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type Ref } from "react";
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
const RISE = 0.11; // 한 장이 올라와 안착하는 구간(확대 폭 커진 만큼 소폭 연장 · 마지막 inEnd 0.71<SETTLE 0.72)
// ENTER(진입 시작 y)는 뷰포트·카드 높이에 맞춰 동적 계산(아래 useEffect). 고정 px 폐지.
const ENTER_MARGIN = 48; // 대기 시 화면 밖으로 완전히 숨도록 하는 여유(px)
const CARD_H_FALLBACK = 456; // 측정 전 기본 카드 높이(데스크탑 clamp 상한)
const PEEK = 48; // B: 스택 시 한 장당 위로 삐져나오는 세로 간격(20→48 — 카드 사이 거리 확대)
const TILT = 28; // 진입 시 rotateX(deg) — 눕혀진 상태에서 0 으로 펴짐(페이드 제거 → 눕힘 더 강조)
const ENTER_SCALE = 1.9; // 진입 시 확대 배율(→ 1 로 축소되며 안착. 레퍼런스처럼 크게: 1.4→1.9)
const SETTLE = 0.72; // 이 진행도까지 카드가 -backTotal(벌어진 스택)로 안착 → 이후 FADE 전까지 그 간격 유지
// B: JOURNAL 이 올라오기 "전에" FESTIVALS 내용(카드+텍스트)이 먼저 상승+페이드아웃 되도록 순서 조정.
//    FADE 구간을 앞당겨(0.78~0.88) 완료 → 그 뒤 CSS 의 짧아진 overlap(-45vh)에서 JOURNAL 이 올라옴(겹침 최소화).
const FADE_START = 0.78; // 섹션 페이드/상승 시작
const FADE_END = 0.88; // 이 시점까지 FESTIVALS 내용 완전히 사라짐(그 뒤 JOURNAL 등장)
const SEC_RISE = 210; // 섹션이 위로 상승하는 양(px) — 확실히 화면 밖으로 빠지게
// 등장 스냅 — 후반 급감속 이징(끝에서 톡 붙는 느낌).
const snap = cubicBezier(0.16, 1, 0.3, 1);
const lin = (t: number) => t;

export default function Festivals() {
  const reduce = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null); // 첫 카드 높이 측정용(모든 카드 동일 크기)
  const { scrollYProgress } = useScroll({ target: scrollerRef, offset: ["start start", "end end"] });
  // 스냅감 — stiffness↑ + damping↓ 로 더 빠르고 톡 붙게(과하지 않게).
  const p = useSpring(scrollYProgress, { stiffness: 210, damping: 24, mass: 0.5 });
  const N = FESTIVALS.length;

  // ■2. ENTER 를 뷰포트·카드 높이 기반으로 동적 계산 — 대기 중 카드가 확대(ENTER_SCALE)된 채
  //   화면 아래로 "완전히" 숨도록. 카드는 화면 정중앙(inset:0+margin:auto)이라
  //   숨는 데 필요한 이동량 = 뷰포트높이/2 + (카드높이×ENTER_SCALE)/2 + 여유.
  //   카드 높이는 실제 offsetHeight 로 측정(모바일 min(56vh,348)·태블릿 clamp 도 자동 정확).
  const [enter, setEnter] = useState(820);
  useEffect(() => {
    const measure = () => {
      const cardH = cardRef.current?.offsetHeight || CARD_H_FALLBACK;
      setEnter(window.innerHeight / 2 + (cardH * ENTER_SCALE) / 2 + ENTER_MARGIN);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // C: 섹션 전체 페이드아웃 + 상승 — JOURNAL 이 어느 정도 올라온 뒤(FADE_START) 천천히 진행.
  const secOpacity = useTransform(p, [FADE_START, FADE_END], reduce ? [1, 1] : [1, 0], { clamp: true });
  const secY = useTransform(p, [FADE_START, FADE_END], reduce ? [0, 0] : [0, -SEC_RISE], { clamp: true });

  return (
    <section className={styles.fests} id="festivals">
      <div ref={scrollerRef} className={styles.festsScroller}>
        <div className={styles.festsSticky}>
          <motion.div className={styles.festInner} style={{ opacity: secOpacity, y: secY }}>
            {/* D. FESTIVALS 타이틀 제거 → 2줄 텍스트. 1줄: 살짝 굵게 큰 글씨 / 2줄: 본문 크기. (애니메이션 없음) */}
            <div className={styles.festHead}>
              <span className={styles.eyebrow}>Selections &amp; Awards</span>
              <h2 className={styles.festLead}>
                세계 유수 영화제가
                <br />
                먼저 알아본 이름들
              </h2>
              <p className={styles.festHeadSub}>초청과 수상으로 이어진 배급작의 궤적</p>
            </div>

            {/* 세로 카드 스택(앞 레이어) — 제자리에서 확대+눕힘→정면으로 펴지며 쌓임 */}
            <div className={styles.festStack}>
              {FESTIVALS.map((fe, i) => (
                <StackCard
                  key={fe.name}
                  fe={fe}
                  i={i}
                  N={N}
                  p={p}
                  reduce={!!reduce}
                  enter={enter}
                  measureRef={i === 0 ? cardRef : undefined}
                />
              ))}
            </div>
          </motion.div>
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
  enter,
  measureRef,
}: {
  fe: (typeof FESTIVALS)[number];
  i: number;
  N: number;
  p: MotionValue<number>;
  reduce: boolean;
  enter: number; // ■2. 동적 진입 시작 y(뷰포트·카드 높이 기반)
  measureRef?: Ref<HTMLElement>; // 첫 카드에만 연결 — 높이 측정용
}) {
  const depth = N - 1 - i; // 0 = 맨 앞(front), N-1 = 맨 뒤(back)
  const inStart = START + i * GAP;
  const inEnd = inStart + RISE;
  const backTotal = depth * PEEK; // 이 카드 위에 쌓일 카드 수만큼 위로 밀림
  const settleScale = 1 - 0.05 * depth; // 뒤로 밀릴수록 살짝 축소(딥스)
  // B: 깊이별 회색 DIM 단계 — 최하단(뒤) 진하게 → 앞으로 갈수록 옅게(단계 확대).
  const scrimMax = Math.min(0.72, depth * 0.24);
  // C: DIM 카드의 검은 라인도 깊이별로 옅게 — 앞(활성) 진한 검정 → 뒤로 갈수록 투명도↑.
  const borderMin = Math.max(0.16, 1 - depth * 0.3);

  // y: 아래(enter) → 중앙(0, 스냅) → 뒤로 밀리며 위로(-backTotal), SETTLE 까지 안착 후 유지. (exit 은 섹션 레벨)
  const y = useTransform(
    p,
    [inStart, inEnd, SETTLE, 1],
    reduce ? [0, 0, 0, 0] : [enter, 0, -backTotal, -backTotal],
    { clamp: true, ease: [snap, lin, lin] }
  );
  // 진입 시 rotateX(TILT)로 눕혀졌다가 안착(0)하며 정면으로 펴짐(스냅).
  const rotateX = useTransform(p, [inStart, inEnd], reduce ? [0, 0] : [TILT, 0], { clamp: true, ease: [snap] });
  // ■1. 등장 opacity 페이드인 제거 — 카드는 항상 opacity 1. 안 보이는 건 .festsSticky{overflow:hidden} 클리핑으로 처리.
  // scale — 진입 시 확대(ENTER_SCALE) → 1 로 안착(스냅), 뒤로 밀리며 settleScale.
  const scale = useTransform(p, [inStart, inEnd, SETTLE], reduce ? [1, 1, 1] : [ENTER_SCALE, 1, settleScale], {
    clamp: true,
    ease: [snap, lin],
  });
  // 회색 DIM — 뒤로 밀리면 등장(깊이별 강도) 후 유지.
  const scrim = useTransform(p, [inEnd, inEnd + GAP], reduce ? [0, 0] : [0, scrimMax], { clamp: true });
  // C: 검은 라인 투명도 — 뒤로 밀리면 borderMin 까지 옅어짐(앞 카드는 1=진한 검정 유지).
  const borderAlpha = useTransform(p, [inEnd, inEnd + GAP], reduce ? [1, 1] : [1, borderMin], { clamp: true });
  const borderColor = useMotionTemplate`rgba(11, 11, 12, ${borderAlpha})`;

  return (
    <motion.article
      ref={measureRef}
      className={styles.festCard}
      style={{ y, rotateX, scale, borderColor, zIndex: i }}
    >
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
