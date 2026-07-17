"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { anton } from "@/app/fonts"; // 공용 Anton — 섹션 제목(TypeTitle)과 동일 폰트 공유
import { useIntroRevealed } from "./Intro";
import styles from "./FlowHero.module.css";

// 원통형 카드 덱은 WebGL(three.js). SSR 비활성 → 브라우저 마운트 후에만 초기화(WebGL 은 브라우저 전용).
const CylinderDeck = dynamic(() => import("./CylinderDeck"), { ssr: false });

export type FlowCard = { label: string; caption: string; img: string };

const CARDS: FlowCard[] = [
  { label: "NOW SHOWING", caption: "여름의 잔상 · 2024", img: "/posters-photo/lineup_1.jpg" },
  { label: "DIRECTOR", caption: "북위 48도 · Léa Marchand", img: "/posters-photo/lineup_2.jpg" },
  { label: "FESTIVAL", caption: "조용한 망명 · BUSAN 2024", img: "/posters-photo/lineup_3.jpg" },
  { label: "SOUNDTRACK", caption: "소금사막 · O.S.T", img: "/posters-photo/lineup_4.jpg" },
  { label: "NOW SHOWING", caption: "겨울 손님 · 2025", img: "/posters-photo/lineup_5.jpg" },
  { label: "ARCHIVE", caption: "필름의 끝 · 16mm", img: "/posters-photo/lineup_6.jpg" },
];

// 원통형 카드 덱의 형상·회전·드래그·페이드 로직은 WebGL 컴포넌트(CylinderDeck)로 이동.
// 여기서는 카드에 입힐 포스터 경로(DECK_IMAGES)만 넘김.
const DECK_IMAGES = CARDS.map((c) => c.img); // lineup_1~6

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ── GSAP 글자 워드마크 "FILMNOUVELLE" (jasminegunarto.com 무드) ──────────────
// 커튼 웨이브 방식:
//  1) 인트로 — 카운트다운 종료 후, 화면 중앙에서 글자들이 좌→우로 "샥" 훑고 왜곡됐다 원위치 복귀(왕복)한 뒤
//     타이틀이 중앙 상단으로 이동.
//  2) 호버 — 글자에 커서를 올리면 그 인접 영역 글자만 동일한 커튼 웨이브를 1회 재생(상시 추적 아님).
// prefers-reduced-motion 이면 웨이브·호버 모두 비활성(중앙 상단 고정).
// [D] 두 단어를 별도 그룹으로 분리 → 각자 코너로 이동(FILM 좌상단 / NOUVELLE 우하단).
const FILM = "FILM";
const NOUVELLE = "NOUVELLE";
const FILM_LEN = FILM.length; // 글자 인덱스: 0~3=FILM, 4~11=NOUVELLE
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
  onIntroComplete?: () => void; // 두 단어가 코너로 이동 완료된 시점(=덱 등장 트리거)
}) {
  const filmRef = useRef<HTMLHeadingElement>(null); // FILM 그룹
  const nouvRef = useRef<HTMLHeadingElement>(null); // NOUVELLE 그룹
  const letterRefs = useRef<HTMLSpanElement[]>([]); // 바깥 span(고정 마스크 창) 0~11
  const innerRefs = useRef<HTMLSpanElement[]>([]); // 안쪽 span(이동 애니메이션 대상) 0~11

  useEffect(() => {
    const film = filmRef.current;
    const nouv = nouvRef.current;
    const letters = letterRefs.current.filter(Boolean);
    const inners = innerRefs.current.filter(Boolean);
    if (!film || !nouv || letters.length === 0) return;

    // ── 반응형 여백/좌표 계산 ──
    const pad = () => Math.round(clamp(window.innerWidth * 0.028, 14, 56)); // 좌우 여백
    const topPad = () => Math.round(clamp(window.innerHeight * 0.11, 76, 140)); // 상단(네비 아래)
    const botPad = () => Math.round(clamp(window.innerHeight * 0.06, 24, 90)); // 하단
    // [D] 코너 배치 — FILM 좌상단, NOUVELLE 우하단(우측·하단 정렬은 그룹 크기 반영)
    const cornerPos = () => ({
      film: { x: pad(), y: topPad() },
      nouv: {
        x: Math.max(pad(), window.innerWidth - pad() - nouv.offsetWidth),
        y: window.innerHeight - botPad() - nouv.offsetHeight,
      },
    });
    // 인트로 중앙 배치 — 두 단어를 한 줄로 화면 가운데(웨이브를 함께 재생)
    const centerPos = () => {
      const fw = film.offsetWidth;
      const fh = film.offsetHeight;
      const nw = nouv.offsetWidth;
      const gap = Math.round(fh * 0.3); // 단어 사이 여백
      const total = fw + gap + nw;
      const sx = Math.round(window.innerWidth / 2 - total / 2);
      const cy = Math.round(window.innerHeight / 2 - fh / 2);
      return { film: { x: sx, y: cy }, nouv: { x: sx + fw + gap, y: cy } };
    };

    // reduce: 애니메이션 없이 FILM=좌상단 / NOUVELLE=우하단 즉시 고정(아웃라인은 CSS 유지)
    if (reduce) {
      const c = cornerPos();
      gsap.set(film, { x: c.film.x, y: c.film.y, autoAlpha: 1 });
      gsap.set(nouv, { x: c.nouv.x, y: c.nouv.y, autoAlpha: 1 });
      gsap.set(inners, { clearProps: "xPercent,yPercent" });
      return;
    }
    if (!revealed) return; // 인트로 시작 타이밍(카운트다운 종료)

    let introDone = false;

    // 공유 슬라이드 마스크 웨이브(퇴장 좌→우 → 등장 좌→우, 제자리 복귀)
    const playWave = (els: HTMLSpanElement[]) =>
      gsap.to(els, {
        keyframes: [
          { xPercent: WAVE.slide, duration: WAVE.exitDur, ease: WAVE.exitEase },
          { xPercent: -WAVE.slide, duration: 0 },
          { xPercent: 0, duration: WAVE.enterDur, ease: WAVE.enterEase },
        ],
        stagger: { each: WAVE.each, from: "start" },
      });

    // 1) 인트로 — 중앙 배치 → 아래→위 등장 → 좌→우 웨이브 → 두 그룹 개별 코너 이동
    const cen = centerPos();
    gsap.set(film, { x: cen.film.x, y: cen.film.y });
    gsap.set(nouv, { x: cen.nouv.x, y: cen.nouv.y });
    gsap.from([film, nouv], { autoAlpha: 0, duration: 0.3, ease: "power1.out" });
    gsap.set(letters, { clipPath: CLIP_REVEAL });
    gsap.set(inners, { xPercent: 0, yPercent: REVEAL.fromY });

    const reveal = gsap.to(inners, {
      yPercent: 0,
      duration: REVEAL.dur,
      ease: REVEAL.ease,
      stagger: { each: REVEAL.each, from: "start" },
      onComplete: () => {
        gsap.set(letters, { clipPath: CLIP_OPEN });
        const wave = playWave(inners);
        wave.eventCallback("onComplete", () => {
          // [D] wrap 하나를 topY 로 올리던 단계를 → 두 그룹을 각자 코너로 이동
          const c = cornerPos();
          gsap.to(film, { x: c.film.x, y: c.film.y, duration: 1.0, ease: "power3.inOut" });
          gsap.to(nouv, {
            x: c.nouv.x,
            y: c.nouv.y,
            duration: 1.0,
            ease: "power3.inOut",
            onComplete: () => {
              introDone = true;
              measureBoxes(); // 코너 안착 후 글자 box 캐시(호버 판정 기준)
              onIntroComplete?.(); // 덱 등장 트리거
            },
          });
        });
      },
    });

    // 2) 호버 — 각 단어 그룹 내부에서만 좌→우 판정(두 단어가 코너로 떨어져도 그룹 단위로 처리).
    const playing = new Set<number>();
    // g: 0=FILM(글자 0~3) / 1=NOUVELLE(글자 4~11)
    let boxes: { l: number; r: number; t: number; b: number; i: number; g: number }[] = [];
    const measureBoxes = () => {
      boxes = letters.map((el, k) => {
        const r = el.getBoundingClientRect();
        return { l: r.left, r: r.right, t: r.top, b: r.bottom, i: k, g: k < FILM_LEN ? 0 : 1 };
      });
    };
    // 커서가 어느 그룹 위인지 → 그 그룹 글자만으로 x 판정.
    const regionAt = (x: number, y: number): { idxs: number[]; key: string } | null => {
      if (boxes.length === 0) return null;
      for (const g of [0, 1]) {
        const gb = boxes.filter((b) => b.g === g);
        if (gb.length === 0) continue;
        const gl = Math.min(...gb.map((b) => b.l));
        const gr = Math.max(...gb.map((b) => b.r));
        const gt = Math.min(...gb.map((b) => b.t));
        const gbot = Math.max(...gb.map((b) => b.b));
        const m = 26; // 그룹 히트 여유
        if (x < gl - m || x > gr + m || y < gt - m || y > gbot + m) continue;
        // 이 그룹 안에서 좌→우 판정(기존 로직)
        const line = gb.slice().sort((a, b) => a.l - b.l);
        const pre = `g${g}`;
        if (x < line[0].l) return { idxs: [line[0].i], key: `${pre}H${line[0].i}` };
        if (x > line[line.length - 1].r)
          return { idxs: [line[line.length - 1].i], key: `${pre}T${line[line.length - 1].i}` };
        for (let k = 0; k < line.length; k++) {
          const b = line[k];
          if (x >= b.l && x <= b.r) {
            const margin = ((b.r - b.l) * (1 - HIT_CORE)) / 2;
            if (x >= b.l + margin && x <= b.r - margin) return { idxs: [b.i], key: `${pre}L${b.i}` };
            if (x < b.l + margin && k > 0) return { idxs: [line[k - 1].i, b.i], key: `${pre}G${line[k - 1].i}` };
            if (x > b.r - margin && k < line.length - 1) return { idxs: [b.i, line[k + 1].i], key: `${pre}G${b.i}` };
            return { idxs: [b.i], key: `${pre}L${b.i}` };
          }
          if (x < b.l) {
            if (k > 0) return { idxs: [line[k - 1].i, b.i], key: `${pre}G${line[k - 1].i}` };
            return { idxs: [b.i], key: `${pre}H${b.i}` };
          }
        }
      }
      return null;
    };

    let lastKey = "";
    // 덱 캔버스(z:3)가 위를 덮으므로 window 에서 pointermove 를 받아 호버 판정(요소 이벤트로는 안 옴).
    const onPointerMove = (e: PointerEvent) => {
      if (!introDone) return;
      const region = regionAt(e.clientX, e.clientY);
      if (!region) {
        lastKey = "";
        return;
      }
      if (region.key === lastKey) return;
      lastKey = region.key;
      if (region.idxs.some((k) => playing.has(k))) return;
      region.idxs.forEach((k) => playing.add(k));
      const t = playWave(region.idxs.map((k) => inners[k]));
      t.eventCallback("onComplete", () => region.idxs.forEach((k) => playing.delete(k)));
    };
    window.addEventListener("pointermove", onPointerMove);

    const onResize = () => {
      if (introDone) {
        const c = cornerPos();
        gsap.set(film, { x: c.film.x, y: c.film.y });
        gsap.set(nouv, { x: c.nouv.x, y: c.nouv.y });
        measureBoxes();
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      reveal.kill();
      gsap.killTweensOf(inners);
      gsap.killTweensOf([film, nouv]);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      gsap.set(inners, { clearProps: "all" });
      gsap.set(letters, { clearProps: "clipPath" });
    };
  }, [revealed, reduce, onIntroComplete]);

  // 글자 span 생성 — i 는 전역 글자 인덱스(0~11)
  const letterSpan = (ch: string, i: number) => (
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
  );

  return (
    <div className={styles.titleWrap} aria-hidden="true">
      {/* FILM — 좌상단, 솔리드 검정 */}
      <h1 className={`${styles.word} ${styles.wordFilm} ${anton.className}`} ref={filmRef} aria-label="FILM">
        {FILM.split("").map((ch, i) => letterSpan(ch, i))}
      </h1>
      {/* NOUVELLE — 우하단, 아웃라인(라인) 스타일 */}
      <h1 className={`${styles.word} ${styles.wordNouvelle} ${anton.className}`} ref={nouvRef} aria-label="NOUVELLE">
        {NOUVELLE.split("").map((ch, j) => letterSpan(ch, FILM_LEN + j))}
      </h1>
    </div>
  );
}

export default function FlowHero() {
  const revealed = useIntroRevealed();
  const reduce = useReducedMotion();

  // 덱 등장 트리거 — 타이틀 인트로 웨이브가 끝나고 상단 이동이 완료된 시점(FilmWordmark 콜백)
  const [titleSettled, setTitleSettled] = useState(false);
  const handleIntroComplete = useCallback(() => setTitleSettled(true), []);
  // 인트로(글자 등장 → 웨이브 → 상단 이동 → 덱 등장) 전체 완료 여부 — sticky(스크롤 잠금) 해제 트리거
  const [introComplete, setIntroComplete] = useState(false);
  // WebGL 덱 등장 애니메이션 완료 → 스크롤 잠금 해제
  const handleDeckIntroDone = useCallback(() => setIntroComplete(true), []);

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

  return (
    <section className={styles.stage} id="home" data-revealed={revealed}>
      {/* 중앙 워드마크 FILMNOUVELLE — GSAP 가로 커튼 웨이브. z:1 → WebGL 덱(z:3)보다 뒤 = 카드 틈으로 비침 */}
      <FilmWordmark revealed={revealed} reduce={!!reduce} onIntroComplete={handleIntroComplete} />

      {/* 원통형 카드 덱 — WebGL(three.js) 곡면 메시. 투명 캔버스가 텍스트 위에 겹쳐,
          이미지 카드는 텍스트를 가리고 카드 사이 틈/뒤로 페이드된 영역은 텍스트가 비침.
          자동회전·플릭 관성·호버 확대·정면 이탈 페이드·기울기·반응형·reduce 모두 컴포넌트 내부에서 재현. */}
      <CylinderDeck
        images={DECK_IMAGES}
        active={titleSettled}
        reduce={!!reduce}
        onIntroDone={handleDeckIntroDone}
      />
    </section>
  );
}
