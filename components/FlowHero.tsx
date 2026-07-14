"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { useIntroRevealed } from "./Intro";
import styles from "./FlowHero.module.css";

// 세로로 길쭉한 디스플레이 폰트 Anton(단일 weight 400) — jasminegunarto.com/첨부 HTML 무드.
// 빌드 시 Google Fonts 다운로드가 불안정한 환경이라 woff2 를 self-host(app/fonts) 후 next/font/local 로 로드.
const anton = localFont({
  src: "../app/fonts/anton-latin.woff2",
  weight: "400",
  display: "swap",
});

export type FlowCard = { label: string; caption: string; img: string };

const CARDS: FlowCard[] = [
  { label: "NOW SHOWING", caption: "여름의 잔상 · 2024", img: "/posters-photo/lineup_1.jpg" },
  { label: "DIRECTOR", caption: "북위 48도 · Léa Marchand", img: "/posters-photo/lineup_2.jpg" },
  { label: "FESTIVAL", caption: "조용한 망명 · BUSAN 2024", img: "/posters-photo/lineup_3.jpg" },
  { label: "SOUNDTRACK", caption: "소금사막 · O.S.T", img: "/posters-photo/lineup_4.jpg" },
  { label: "NOW SHOWING", caption: "겨울 손님 · 2025", img: "/posters-photo/lineup_5.jpg" },
  { label: "ARCHIVE", caption: "필름의 끝 · 16mm", img: "/posters-photo/lineup_6.jpg" },
];

// ── 원통형 카드 덱(형태·각도·회전·드래그 유지) ─────────────────────────────
// 5장 × 2바퀴 = 10장 → STEP 36° (간격 시원하게)
const DECK_CARDS = CARDS.slice(0, 5);
const DECK = [...DECK_CARDS, ...DECK_CARDS];
const CW = 230; // 카드 폭
const CH = 324; // 카드 높이
const COUNT = DECK.length;
const STEP = 360 / COUNT;
const RADIUS = Math.round((CW / 2 / Math.tan(Math.PI / COUNT)) * 1.075) + 20; // CW 비례 반경
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
const TITLE = "FILMNOUVELLE";
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
    let boxes: { l: number; r: number }[] = []; // 각 글자 바깥 box 의 화면 x 범위(고정 창이라 안정적)
    const measureBoxes = () => {
      boxes = letters.map((el) => {
        const b = el.getBoundingClientRect();
        return { l: b.left, r: b.right };
      });
    };
    // 커서 x → 재생 대상 인덱스 배열 + 영역 키(같은 영역 판정용).
    // 글자 box 중앙 코어(HIT_CORE) 안 → 그 글자 하나 / 코어 바깥 가장자리 → 그쪽 이웃과의 '여백' → 양옆 두 글자.
    const regionAt = (x: number): { idxs: number[]; key: string } | null => {
      if (boxes.length === 0) return null;
      // x 를 포함하는 box 찾기(box 는 맞닿아 있어 좌→우 첫 매칭)
      let i = -1;
      for (let k = 0; k < boxes.length; k++) {
        if (x >= boxes[k].l && x <= boxes[k].r) { i = k; break; }
      }
      if (i === -1) {
        // 모든 글자 바깥 → 첫 글자보다 왼쪽 / 마지막보다 오른쪽
        if (x < boxes[0].l) return { idxs: [0], key: "Lhead" };
        return { idxs: [boxes.length - 1], key: "Ltail" };
      }
      const b = boxes[i];
      const margin = ((b.r - b.l) * (1 - HIT_CORE)) / 2; // 좌우 가장자리 폭
      if (x >= b.l + margin && x <= b.r - margin) return { idxs: [i], key: `L${i}` }; // 중앙 코어 → 글자 하나
      if (x < b.l + margin && i > 0) return { idxs: [i - 1, i], key: `G${i - 1}` }; // 왼쪽 가장자리 → 왼 이웃과 여백
      if (x > b.r - margin && i < boxes.length - 1) return { idxs: [i, i + 1], key: `G${i}` }; // 오른쪽 가장자리 → 오른 이웃과 여백
      return { idxs: [i], key: `L${i}` }; // 양 끝 글자의 바깥 가장자리 → 그 글자 하나
    };

    let lastKey = "";
    const onPointerMove = (e: PointerEvent) => {
      if (!introDone) return;
      const region = regionAt(e.clientX);
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
        {TITLE.split("").map((ch, i) => (
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
        ))}
      </h1>
    </div>
  );
}

export default function FlowHero() {
  const revealed = useIntroRevealed();
  const reduce = useReducedMotion();
  const ringRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
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

  // 덱 등장 — 텍스트 상단 안착 후 아래에서 위로 올라오며 페이드인(GSAP). 각도·형태·크기·회전·드래그는 불변.
  // top(위치)만 애니메이션 → .deck 의 transform(모바일 scale 등)을 건드리지 않음. reduce 는 CSS 로 즉시 표시.
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || reduce || !titleSettled) return;
    const restTop = parseFloat(getComputedStyle(deck).top) || 0;
    gsap.fromTo(
      deck,
      { autoAlpha: 0, top: restTop + 80 }, // 아래(+80px)에서 투명하게 시작
      {
        autoAlpha: 1,
        top: restTop,
        duration: 1.0,
        ease: "power3.out",
        onComplete: () => gsap.set(deck, { clearProps: "top" }), // 반응형 top:50% 복귀
      },
    );
  }, [titleSettled, reduce]);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;

    const applyOpacity = () => {
      for (let i = 0; i < COUNT; i++) {
        const card = cardRefs.current[i];
        if (card) card.style.opacity = String(opacityAt(i, rotRef.current));
      }
    };

    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceRef.current = r;
    if (r) {
      ring.style.transform = "rotateY(0deg)";
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
        ring.style.transform = `rotateY(${rotRef.current}deg)`;
        applyOpacity();
        pausedWritten = false;
        raf = requestAnimationFrame(frame);
        return;
      }

      // 호버 정지: 관성이 남아있으면 무시하고 계속 굴림(플릭 우선)
      if (pausedRef.current && velocityRef.current === 0) {
        if (!pausedWritten) {
          ring.style.transform = `rotateY(${rotRef.current}deg)`;
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
      ring.style.transform = `rotateY(${rotRef.current}deg)`;
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
      {/* 중앙 워드마크 FILMNOUVELLE — GSAP 가로 커튼 웨이브 (덱보다 뒤 z축) */}
      <FilmWordmark revealed={revealed} reduce={!!reduce} onIntroComplete={handleIntroComplete} />

      {/* 원통형 3D 카드 덱(중앙 겹침) — 바깥=고정 기울기, 안쪽=rAF rotateY. 등장은 GSAP(텍스트 인트로 완료 후) */}
      <div
        className={styles.deck}
        ref={deckRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className={styles.deckTilt}>
          <div
            className={styles.deckRing}
            ref={ringRef}
            style={{ "--cw": `${CW}px`, "--ch": `${CH}px` } as React.CSSProperties}
          >
            {DECK.map((c, i) => (
              <div
                key={i}
                className={styles.cell}
                style={{ transform: `rotateY(${i * STEP}deg) translateZ(${RADIUS}px)` }}
              >
                <div className={styles.panel} aria-hidden="true" />
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
                    <Image src={c.img} alt={c.caption} fill sizes="212px" priority={i < 6} />
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
