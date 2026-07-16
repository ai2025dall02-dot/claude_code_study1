"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { anton } from "@/app/fonts"; // 공용 Anton — 섹션 제목(TypeTitle)과 동일 폰트 공유
import { useIntroRevealed } from "./Intro";
import styles from "./FlowHero.module.css";

export type FlowCard = { label: string; caption: string; img: string };

const CARDS: FlowCard[] = [
  { label: "NOW SHOWING", caption: "여름의 잔상 · 2024", img: "/posters-photo/lineup_1.jpg" },
  { label: "DIRECTOR", caption: "북위 48도 · Léa Marchand", img: "/posters-photo/lineup_2.jpg" },
  { label: "FESTIVAL", caption: "조용한 망명 · BUSAN 2024", img: "/posters-photo/lineup_3.jpg" },
  { label: "SOUNDTRACK", caption: "소금사막 · O.S.T", img: "/posters-photo/lineup_4.jpg" },
  { label: "NOW SHOWING", caption: "겨울 손님 · 2025", img: "/posters-photo/lineup_5.jpg" },
  { label: "ARCHIVE", caption: "필름의 끝 · 16mm", img: "/posters-photo/lineup_6.jpg" },
];

// ── 원통형 카드 덱 ─────────────────────────────
// [1] 곡률 완화: 카드 수를 늘려(6장 × 3바퀴 = 18면) STEP 을 작게(20°) → 원통이 더 매끄러움.
//     (평면 카드라 완전한 곡면은 불가 → 면을 잘게 쪼개 다각형을 원에 가깝게)
const DECK_CARDS = CARDS; // 6 포스터 전부
const DECK_REPEAT = 3; // 바퀴 수 — 늘리면 면이 잘게 쪼개져 곡률이 부드러워짐(성능과 트레이드오프)
const DECK = Array.from({ length: DECK_REPEAT }).flatMap(() => DECK_CARDS); // 18 셀
const CW = 172; // 카드 폭 — 면이 많아진 만큼 좁혀 반경(원통 크기)이 과하게 커지지 않게
const CH = 300; // 카드 높이
const COUNT = DECK.length; // 18
const STEP = 360 / COUNT; // 20° (면 간격 — 작을수록 매끄러움)
const RADIUS = Math.round((CW / 2 / Math.tan(Math.PI / COUNT)) * 1.02) + 12; // 카드가 옆면에 촘촘히(살짝 겹쳐 이음새 완화)
const SPEED = 7; // deg/sec
const FULL_DEG = 42;
const FADE_BAND = 30;
// 드래그 플릭 관성 튜닝값
const DRAG_FACTOR = 0.3;
const MAX_V = 520;
const DECAY = 0.94;

function norm(a: number) {
  const m = ((a % 360) + 360) % 360;
  return m > 180 ? m - 360 : m;
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
function opacityAt(i: number, rot: number) {
  const dist = Math.abs(norm(i * STEP + rot));
  if (dist <= FULL_DEG) return 1;
  return clamp((FULL_DEG + FADE_BAND - dist) / FADE_BAND, 0, 1);
}

// ── GSAP 글자 워드마크 "FILMNOUVELLE" (jasminegunarto.com 무드) ──────────────
// 커튼 웨이브 방식:
//  1) 인트로 — 카운트다운 종료 후, 화면 중앙에서 글자들이 좌→우로 "샥" 훑고 왜곡됐다 원위치 복귀(왕복)한 뒤
//     타이틀이 중앙 상단으로 이동.
//  2) 호버 — 글자에 커서를 올리면 그 인접 영역 글자만 동일한 커튼 웨이브를 1회 재생(상시 추적 아님).
// prefers-reduced-motion 이면 웨이브·호버 모두 비활성(중앙 상단 고정).
const TITLE = "FILM NOUVELLE"; // 공백은 애니메이션 대상 아님(별도 .gap span). 웨이브/호버는 공백 제외한 글자만.
// 인트로·호버가 공유하는 "슬라이드 마스크 웨이브" 파라미터.
// 각 글자는 형태 왜곡 없이 똑바로 선 채, 고정된 clip-path 창(=글자 원래 영역)을 "통과"하며 좌→우로 슬라이드함:
//   퇴장 — 글자가 좌→우로 밀려나 창 오른쪽 밖으로 빠져 사라짐
//   등장 — 곧바로 왼쪽 밖에서 좌→우로 들어오며 다시 나타남(밀려나며 교체되는 느낌)
// 마스크 창은 바깥 span(고정), 이동은 안쪽 span(transform x)에만 적용 → 창은 제자리, 글자만 통과.
// 이동은 transform 이라 레이아웃(글자 간격/전체 폭) 불변.
const WAVE = {
  slide: 115, // [이동 거리] 안쪽 글자를 밀어내는 가로 거리(xPercent, 글자 폭 대비 %). 100%↑ 면 창 밖으로 완전히 빠짐
  exitDur: 0.34, // [퇴장 속도] 좌→우로 밀려나 사라지는 시간(s). 길수록 느긋하게 빠짐
  enterDur: 0.22, // [등장 속도] 좌→우로 들어오는 시간(s). 짧을수록 "탁" 밀고 들어오는 느낌
  exitEase: "power2.in", // [퇴장 가속] in=서서히 빨라지며 창 밖으로 빠짐
  enterEase: "power3.out", // [등장 감속] out=빠르게 들어와 제자리서 탁 멈춤
  each: 0.075, // [전파 속도] 글자 간 stagger 간격(s). 키울수록 파도가 좌→우로 또렷하게 훑음
};
// 인트로 "아래→위 마스크 등장" 파라미터 — 각 글자를 창 아래(세로 마스크 닫힘)에서 시작해 위로 올려 드러냄.
const REVEAL = {
  fromY: 115, // [시작 위치] 글자 시작 세로 위치(yPercent, +아래). 100%↑ = 글자 한 칸 아래(창 밖)에서 시작
  dur: 0.62, // [등장 속도] 한 글자가 아래→위로 올라와 드러나는 시간(s)
  each: 0.055, // [전파 속도] 글자 간 stagger 간격(s) — 순차적으로 올라옴
  ease: "power3.out", // [가감속] out=빠르게 올라와 부드럽게 멈춤
};
// clip-path 창 상태: 등장 중엔 하단을 닫아(글자가 아래에서 가려진 채 올라옴), 등장 후엔 상하를 열어 가로 웨이브가 정상 작동.
const CLIP_REVEAL = "inset(-45% 0% 0% 0%)"; // 하단 0%(닫힘) → 창 아래 글자는 안 보임 / 상단 열림
const CLIP_OPEN = "inset(-45% 0% -45% 0%)"; // 상·하 모두 열림(= .letter CSS 기본값). 가로 슬라이드만 좌우에서 잘림
// [호버 판정] 글자 box 중앙 이 비율(가로)만 "그 글자 단독" 히트존. 바깥 가장자리는 이웃과의 "여백"으로 간주해 양옆 재생.
// (letter-spacing 이 촘촘해 box 가 맞닿아 있어도 가장자리를 여백으로 잡아 '글자 사이 호버'가 동작하게 함)
const HIT_CORE = 0.6;

function FilmWordmark({
  revealed,
  reduce,
  onIntroComplete,
}: {
  revealed: boolean;
  reduce: boolean;
  onIntroComplete?: () => void; // 타이틀이 중앙 상단으로 이동 완료된 시점(=덱 등장 트리거)
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null); // pointermove 로 커서 x 판정
  const letterRefs = useRef<HTMLSpanElement[]>([]); // 바깥 span = 고정 마스크 창(box 판정용)
  const innerRefs = useRef<HTMLSpanElement[]>([]); // 안쪽 span = 실제 글자(이동 애니메이션 대상)

  useEffect(() => {
    const wrap = wrapRef.current;
    const title = titleRef.current;
    const letters = letterRefs.current.filter(Boolean);
    const inners = innerRefs.current.filter(Boolean);
    if (!wrap || !title || letters.length === 0) return;

    // 최종 배치: 화면 중앙 상단(네비 아래 충분한 여백). 인트로: 화면 세로 중앙.
    const topY = () => Math.round(clamp(window.innerHeight * 0.11, 88, 150)); // 네비를 안 가리는 top 여백
    const centerY = () => Math.round(window.innerHeight / 2 - wrap.offsetHeight / 2);

    // reduce: 애니메이션·인터랙션 모두 없이 중앙 상단 고정 (가로 중앙은 CSS text-align). 글자 제자리 노출.
    if (reduce) {
      gsap.set(wrap, { y: topY() });
      gsap.set(inners, { clearProps: "all" });
      return;
    }
    // 인트로 시작 타이밍 — 카운트다운 종료(revealed) 흐름과 연결
    if (!revealed) return;

    let introDone = false;

    // 공유 슬라이드 마스크 웨이브 — 안쪽 글자를 좌→우 stagger 로 "창 오른쪽 밖으로 밀어내(퇴장)" 곧바로
    // "왼쪽 밖에서 들어오게(등장)" 하는 키프레임. 마스크 창(바깥 span)은 고정이라 글자가 창을 통과하며 교체되듯 보임.
    // 항상 xPercent 0(제자리)로 복귀. 반환 tween 으로 onComplete 훅 가능.
    const playWave = (els: HTMLSpanElement[]) =>
      gsap.to(els, {
        keyframes: [
          { xPercent: WAVE.slide, duration: WAVE.exitDur, ease: WAVE.exitEase }, // 퇴장: 좌→우로 밀려나 창 밖으로
          { xPercent: -WAVE.slide, duration: 0 }, // 즉시 왼쪽 밖으로 순간 이동(창 밖=안 보임 → 점프 안 보임)
          { xPercent: 0, duration: WAVE.enterDur, ease: WAVE.enterEase }, // 등장: 왼쪽에서 좌→우로 들어와 제자리
        ],
        stagger: { each: WAVE.each, from: "start" }, // 좌→우 순차 전파(슬라이드 파도)
      });

    // 1) 인트로 — [신규] 아래→위 마스크 등장 → 좌→우 슬라이드 웨이브 → 중앙 상단 이동 → 덱 등장
    gsap.from(wrap, { autoAlpha: 0, duration: 0.3, ease: "power1.out" }); // 화면 중앙에서 부드럽게 등장
    gsap.set(wrap, { y: centerY() }); // 인트로는 화면 세로 중앙에서 시작
    gsap.set(letters, { clipPath: CLIP_REVEAL }); // 창 하단 닫음 → 창 아래 글자는 가려짐
    gsap.set(inners, { xPercent: 0, yPercent: REVEAL.fromY }); // 글자를 창 아래에서 시작

    // (신규) 아래→위 마스크 등장 — 글자가 닫힌 창을 뚫고 위로 올라오며 드러남(좌→우 stagger)
    const reveal = gsap.to(inners, {
      yPercent: 0,
      duration: REVEAL.dur,
      ease: REVEAL.ease,
      stagger: { each: REVEAL.each, from: "start" },
      onComplete: () => {
        gsap.set(letters, { clipPath: CLIP_OPEN }); // 상·하 열어 가로 웨이브가 정상 작동하도록 전환
        // 이어서 좌→우 슬라이드 웨이브 → 완료 후 중앙 상단 이동
        const wave = playWave(inners);
        wave.eventCallback("onComplete", () => {
          gsap.to(wrap, {
            y: topY(),
            duration: 1.0,
            ease: "power3.inOut",
            onComplete: () => {
              introDone = true;
              measureBoxes(); // 상단 안착 후 글자 box 위치 캐시(호버 판정 기준)
              onIntroComplete?.(); // 덱 등장 트리거
            },
          });
        });
      },
    });

    // 2) 호버 — .title 에서 pointermove 로 커서 x 판정: 글자 위=그 글자 하나 / 글자 사이 여백=양옆 두 글자.
    // 영역이 "바뀌는 순간"에만 1회 재생(같은 영역 머무는 동안 반복 없음). playing Set 으로 진행중 중복 방지.
    const playing = new Set<number>();
    // 각 글자 바깥 box 의 화면 좌표(고정 창이라 안정적). 모바일 2줄에서도 y 로 줄을 구분하려 t/b 도 저장.
    let boxes: { l: number; r: number; t: number; b: number; i: number }[] = [];
    const measureBoxes = () => {
      boxes = letters.map((el, i) => {
        const r = el.getBoundingClientRect();
        return { l: r.left, r: r.right, t: r.top, b: r.bottom, i };
      });
    };
    // 커서 (x,y) → 재생 대상 인덱스 배열 + 영역 키(같은 영역 판정용).
    // 먼저 커서가 있는 "줄"(y 로 필터)만 추림 → 그 줄 안에서 x 로 판정.
    // 글자 box 중앙 코어(HIT_CORE) 안 → 그 글자 하나 / 코어 바깥 가장자리·글자 사이(공백 포함) → 양옆 두 글자.
    const regionAt = (x: number, y: number): { idxs: number[]; key: string } | null => {
      if (boxes.length === 0) return null;
      let line = boxes.filter((b) => y >= b.t - 4 && y <= b.b + 4); // 커서가 걸친 줄
      if (line.length === 0) line = boxes.slice(); // 위/아래 여백이면 전체에서 판정
      line.sort((a, b) => a.l - b.l); // 좌→우 정렬
      if (x < line[0].l) return { idxs: [line[0].i], key: `H${line[0].i}` }; // 줄 맨 왼쪽 밖 → 첫 글자
      if (x > line[line.length - 1].r) return { idxs: [line[line.length - 1].i], key: `T${line[line.length - 1].i}` }; // 맨 오른쪽 밖 → 끝 글자
      for (let k = 0; k < line.length; k++) {
        const b = line[k];
        if (x >= b.l && x <= b.r) {
          const margin = ((b.r - b.l) * (1 - HIT_CORE)) / 2; // 좌우 가장자리 폭
          if (x >= b.l + margin && x <= b.r - margin) return { idxs: [b.i], key: `L${b.i}` }; // 중앙 코어 → 글자 하나
          if (x < b.l + margin && k > 0) return { idxs: [line[k - 1].i, b.i], key: `G${line[k - 1].i}` }; // 왼쪽 가장자리 → 왼 이웃과
          if (x > b.r - margin && k < line.length - 1) return { idxs: [b.i, line[k + 1].i], key: `G${b.i}` }; // 오른쪽 가장자리 → 오른 이웃과
          return { idxs: [b.i], key: `L${b.i}` }; // 줄 양 끝 바깥 가장자리 → 그 글자 하나
        }
        if (x < b.l) {
          // box 사이 여백(공백 포함) → 양옆 두 글자
          if (k > 0) return { idxs: [line[k - 1].i, b.i], key: `G${line[k - 1].i}` };
          return { idxs: [b.i], key: `H${b.i}` };
        }
      }
      return null;
    };

    let lastKey = "";
    const onPointerMove = (e: PointerEvent) => {
      if (!introDone) return;
      const region = regionAt(e.clientX, e.clientY);
      if (!region) return;
      if (region.key === lastKey) return; // 같은 영역 머무는 동안 반복 재생 안 함
      lastKey = region.key;
      if (region.idxs.some((k) => playing.has(k))) return; // 진행 중이면 무시(중복 방지)
      region.idxs.forEach((k) => playing.add(k));
      const t = playWave(region.idxs.map((k) => inners[k])); // 대상 글자만 좌→우 웨이브
      t.eventCallback("onComplete", () => region.idxs.forEach((k) => playing.delete(k)));
    };
    const onPointerLeave = () => {
      lastKey = ""; // 벗어났다 다시 들어오면 같은 영역도 재생되도록 리셋
    };
    title.addEventListener("pointermove", onPointerMove);
    title.addEventListener("pointerleave", onPointerLeave);

    const onResize = () => {
      if (introDone) {
        gsap.set(wrap, { y: topY() }); // 상단 위치 유지
        measureBoxes(); // box 위치 갱신
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      reveal.kill();
      gsap.killTweensOf(inners);
      gsap.killTweensOf(wrap);
      title.removeEventListener("pointermove", onPointerMove);
      title.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      gsap.set(inners, { clearProps: "all" });
      gsap.set(letters, { clearProps: "clipPath" });
    };
  }, [revealed, reduce, onIntroComplete]);

  return (
    <div className={styles.titleWrap} ref={wrapRef}>
      <h1 className={`${styles.title} ${anton.className}`} aria-label={TITLE} ref={titleRef}>
        {TITLE.split("").map((ch, i) =>
          ch === " " ? (
            // 공백: 애니메이션/측정 대상 아님. 데스크톱=단어 사이 여백, 모바일=블록 전환으로 줄바꿈(FILM / NOUVELLE).
            <span key={i} className={styles.gap} aria-hidden="true">
              {" "}
            </span>
          ) : (
            <span
              key={i}
              ref={(el) => {
                if (el) letterRefs.current[i] = el;
              }}
              className={styles.letter}
              aria-hidden="true"
            >
              <span
                ref={(el) => {
                  if (el) innerRefs.current[i] = el;
                }}
                className={styles.letterInner}
              >
                {ch}
              </span>
            </span>
          ),
        )}
      </h1>
    </div>
  );
}

export default function FlowHero() {
  const revealed = useIntroRevealed();
  const reduce = useReducedMotion();
  // [2] 덱을 두 레이어로 분리 → 텍스트를 그 사이에 끼움(빈 패널 < 텍스트 < 이미지 카드).
  const backRingRef = useRef<HTMLDivElement>(null); // 뒤: 빈 패널 링(회전)
  const frontRingRef = useRef<HTMLDivElement>(null); // 앞: 이미지 카드 링(회전)
  const backDeckRef = useRef<HTMLDivElement>(null); // 뒤 덱(등장 애니메이션 대상)
  const frontDeckRef = useRef<HTMLDivElement>(null); // 앞 덱(등장 애니메이션 + 드래그 입력)
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]); // 앞 이미지 카드(각도 페이드)
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]); // 뒤 빈 패널(각도 페이드)
  const pausedRef = useRef(false);
  const rotRef = useRef(0);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const reduceRef = useRef(false);

  // 덱 등장 트리거 — 타이틀 인트로 웨이브가 끝나고 상단 이동이 완료된 시점(FilmWordmark 콜백)
  const [titleSettled, setTitleSettled] = useState(false);
  const handleIntroComplete = useCallback(() => setTitleSettled(true), []);
  // 인트로(글자 등장 → 웨이브 → 상단 이동 → 덱 등장) 전체 완료 여부 — sticky(스크롤 잠금) 해제 트리거
  const [introComplete, setIntroComplete] = useState(false);

  // ── sticky 히어로 ──
  // 인트로가 모두 끝나기 전까지 페이지 스크롤을 잠가 히어로를 화면에 고정. 완료되면 해제 → 그때부터 ABOUT 으로 넘어감.
  // CSS position:sticky 트랙 대신 스크롤 잠금 방식: (a) 시간 기반 GSAP 인트로가 스크롤 속도와 무관하게 반드시
  // 끝난 뒤 넘어가도록 보장하고, (b) 히어로에 새 sticky 컨텍스트를 만들지 않아 아래 JOURNAL 의 sticky 블라인드와
  // 스크롤상 충돌이 원천적으로 없음. reduce 모션이면 잠그지 않음(접근성). 안전장치로 최대 대기 후 강제 해제.
  useEffect(() => {
    if (reduce || introComplete) return;
    const html = document.documentElement;
    const body = document.body;
    const prevH = html.style.overflow;
    const prevB = body.style.overflow;
    window.scrollTo(0, 0); // 히어로가 최상단에 보이도록
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const failsafe = window.setTimeout(() => setIntroComplete(true), 12000); // 콜백 누락 등 대비
    return () => {
      html.style.overflow = prevH;
      body.style.overflow = prevB;
      clearTimeout(failsafe);
    };
  }, [reduce, introComplete]);

  // 덱 등장 — 텍스트 상단 안착 후 아래에서 위로 올라오며 페이드인(GSAP). 각도·형태·크기·회전·드래그는 불변.
  // top(위치)만 애니메이션 → .deck 의 transform(모바일 scale 등)을 건드리지 않음. reduce 는 CSS 로 즉시 표시.
  useEffect(() => {
    const back = backDeckRef.current;
    const front = frontDeckRef.current;
    if (!back || !front || reduce || !titleSettled) return;
    const restTop = parseFloat(getComputedStyle(front).top) || 0;
    gsap.fromTo(
      [back, front], // 앞·뒤 덱을 함께 등장(같은 top·opacity)
      { autoAlpha: 0, top: restTop + 80 }, // 아래(+80px)에서 투명하게 시작
      {
        autoAlpha: 1,
        top: restTop,
        duration: 1.0,
        ease: "power3.out",
        onComplete: () => {
          gsap.set([back, front], { clearProps: "top" }); // 반응형 top:50% 복귀
          setIntroComplete(true); // 인트로 전체 완료 → 스크롤 잠금 해제(sticky 종료)
        },
      },
    );
  }, [titleSettled, reduce]);

  useEffect(() => {
    const backRing = backRingRef.current;
    const frontRing = frontRingRef.current;
    if (!backRing || !frontRing) return;

    // 두 링(앞/뒤)에 동일 회전 적용 → 하나의 원통처럼 보임
    const applyRot = () => {
      const tf = `rotateY(${rotRef.current}deg)`;
      backRing.style.transform = tf;
      frontRing.style.transform = tf;
    };
    // 카드(이미지)·패널(빈 백킹) 모두 각도 기준 opacity 페이드
    const applyOpacity = () => {
      for (let i = 0; i < COUNT; i++) {
        const o = String(opacityAt(i, rotRef.current));
        const card = cardRefs.current[i];
        if (card) card.style.opacity = o;
        const panel = panelRefs.current[i];
        if (panel) panel.style.opacity = o;
      }
    };

    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceRef.current = r;
    if (r) {
      applyRot();
      applyOpacity();
      return;
    }

    let raf = 0;
    let last = 0;
    let pausedWritten = false;
    const frame = (t: number) => {
      if (!last) last = t;
      const dt = (t - last) / 1000;
      last = t;

      // 드래그 중 — 자동 회전/관성 없이 rotRef(손 입력)만 즉시 반영
      if (draggingRef.current) {
        applyRot();
        applyOpacity();
        pausedWritten = false;
        raf = requestAnimationFrame(frame);
        return;
      }

      // 호버 정지: 관성이 남아있으면 무시하고 계속 굴림(플릭 우선)
      if (pausedRef.current && velocityRef.current === 0) {
        if (!pausedWritten) {
          applyRot();
          applyOpacity();
          pausedWritten = true;
        }
        raf = requestAnimationFrame(frame);
        return;
      }
      pausedWritten = false;

      // 자동 회전 + 관성(감쇠) → velocity→0 이면 기존 자동 회전만 남아 자연 복귀
      rotRef.current += (SPEED + velocityRef.current) * dt;
      velocityRef.current *= DECAY;
      if (Math.abs(velocityRef.current) < 0.05) velocityRef.current = 0;
      applyRot();
      applyOpacity();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    pausedRef.current = true;
    e.currentTarget.classList.add(styles.hovered);
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    pausedRef.current = false;
    e.currentTarget.classList.remove(styles.hovered);
  };

  // 드래그(플릭)로 원통 굴리기 — 마우스/터치 공통 pointer 이벤트
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceRef.current) return;
    draggingRef.current = true;
    velocityRef.current = 0;
    lastXRef.current = e.clientX;
    lastTRef.current = e.timeStamp;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    const dts = Math.max(1, e.timeStamp - lastTRef.current) / 1000;
    const dDeg = dx * DRAG_FACTOR;
    rotRef.current += dDeg;
    velocityRef.current = clamp(dDeg / dts, -MAX_V, MAX_V);
    lastXRef.current = e.clientX;
    lastTRef.current = e.timeStamp;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <section className={styles.stage} id="home" data-revealed={revealed}>
      {/* ── z 레이어 순서(뒤→앞): [1] 빈 패널 덱(deckBack) < [2] 텍스트(titleWrap) < [3] 이미지 카드 덱(deckFront) ──
          3D 서브트리(preserve-3d)와 2D 텍스트는 단순 z-index 로 사이에 끼울 수 없어, 원통을 "빈 패널"과
          "이미지 카드" 두 덱으로 분리하고 그 사이에 텍스트를 배치(각 덱은 독립 stacking context). 두 링은 동일
          회전(applyRot)을 받아 하나의 원통처럼 보임. */}

      {/* [뒤] 빈 패널 덱 — 이미지 없는 반투명 백킹만. 텍스트 뒤에 깔림(z:1). 입력 대상 아님(pointer-events:none) */}
      <div className={`${styles.deck} ${styles.deckBack}`} ref={backDeckRef} aria-hidden="true">
        <div className={styles.deckTilt}>
          <div
            className={styles.deckRing}
            ref={backRingRef}
            style={{ "--cw": `${CW}px`, "--ch": `${CH}px` } as React.CSSProperties}
          >
            {DECK.map((_, i) => (
              <div
                key={i}
                className={styles.cell}
                style={{ transform: `rotateY(${i * STEP}deg) translateZ(${RADIUS}px)` }}
              >
                <div
                  className={styles.panel}
                  ref={(el) => {
                    panelRefs.current[i] = el;
                  }}
                  style={{ opacity: opacityAt(i, 0) }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* [중간] 중앙 워드마크 FILMNOUVELLE — 빈 패널은 가리고(앞), 이미지 카드에는 가려짐(뒤). z:2 */}
      <FilmWordmark revealed={revealed} reduce={!!reduce} onIntroComplete={handleIntroComplete} />

      {/* [앞] 이미지 카드 덱 — 포스터가 채워진 카드. 텍스트 위에 뜸(z:3). 드래그 입력은 이 덱에서 받음 */}
      <div
        className={`${styles.deck} ${styles.deckFront}`}
        ref={frontDeckRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className={styles.deckTilt}>
          <div
            className={styles.deckRing}
            ref={frontRingRef}
            style={{ "--cw": `${CW}px`, "--ch": `${CH}px` } as React.CSSProperties}
          >
            {DECK.map((c, i) => (
              <div
                key={i}
                className={styles.cell}
                style={{ transform: `rotateY(${i * STEP}deg) translateZ(${RADIUS}px)` }}
              >
                <div
                  className={styles.card}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  style={{ opacity: opacityAt(i, 0) }}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                >
                  <div className={styles.card__media}>
                    <Image src={c.img} alt={c.caption} fill sizes="180px" priority={i < 6} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
