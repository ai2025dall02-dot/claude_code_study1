"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * (x,y) 지점에 "실제로 칠해진" 배경이 어두운지 판정.
 * elementsFromPoint 로 그 지점에 쌓인 요소를 페인트 순서로 훑어 첫 불투명 배경색의 명도로 판단한다.
 * sticky 트랙 / margin-top:-100vh 겹침 / 투명 섹션(.fests/.journal) / CONTACT 오버레이를 모두
 * 정확히 처리하는 검증된 로직(원래 SiteNav 에 있던 것을 공용화). exclude 서브트리는 건너뛴다(자기 자신 제외).
 */
export function isDarkBackdropAt(x: number, y: number, exclude?: Element | null): boolean {
  const stack = document.elementsFromPoint(x, y);
  let lum = 255; // 못 찾으면 밝음(기본)
  for (const el of stack) {
    if (exclude && exclude.contains(el)) continue;
    const c = getComputedStyle(el as HTMLElement).backgroundColor;
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) continue;
    const parts = m[1].split(",").map((s) => parseFloat(s));
    const alpha = parts[3] === undefined ? 1 : parts[3];
    if (alpha === 0) continue; // 투명 → 뒤 요소로
    lum = 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
    break;
  }
  return lum < 128; // 임계 — 실측 11~26(다크)/248~255(밝음)로 뚜렷이 갈림
}

type Point = { x: number; y: number; exclude?: Element | null } | null;

/**
 * 배경 명암(dark) 판정을 rAF tail 루프로 관리하는 공용 훅.
 * SiteNav(버튼 아래 지점)와 PlayCursor(마우스 좌표) 양쪽이 함께 쓴다.
 *
 * - getPoint(): 매 프레임 샘플할 좌표. null 이면 이번 프레임 판정 스킵.
 * - onFrame(): 매 tick 부가 작업(SiteNav 의 active(35%) 계산 등).
 * - reinitDeps: 값이 바뀌면 루프 재시작(예: 인트로 revealed).
 * - watchScroll/watchResize: 해당 window 이벤트에서 재샘플(kick).
 * - initialKickMs: (재)시작 직후 tail. scrollKickMs: 이벤트/kick() 시 tail.
 * - enabled: false 면 루프 미가동.
 *
 * 반환 { dark, kick } — kick() 으로 외부(mousemove 등)에서 재샘플 유도.
 *
 * ※ 값이 바뀌는 동안 tail 을 +400ms 씩 연장 → CONTACT 오버레이처럼 스크롤이 멈춘 뒤에도
 *   스프링으로 계속 움직이는 전환의 "마지막 정착"을 놓치지 않는다(원래 SiteNav 동작과 동일).
 */
export function useDarkBackdrop(opts: {
  getPoint: () => Point;
  onFrame?: () => void;
  reinitDeps?: unknown[];
  watchScroll?: boolean;
  watchResize?: boolean;
  initialKickMs?: number;
  scrollKickMs?: number;
  enabled?: boolean;
}): { dark: boolean; kick: () => void } {
  const {
    onFrame,
    watchScroll = true,
    watchResize = true,
    initialKickMs = 800,
    scrollKickMs = 1200,
    enabled = true,
  } = opts;
  const [dark, setDark] = useState(false);

  // 최신 콜백을 ref 로 잡아 매 렌더마다 effect 재구성 없이 사용(reinitDeps 만 재시작 트리거).
  const getPointRef = useRef(opts.getPoint);
  getPointRef.current = opts.getPoint;
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let tailUntil = 0;
    let lastDark: boolean | null = null;

    const tick = () => {
      onFrameRef.current?.();
      const pt = getPointRef.current();
      if (pt) {
        const dk = isDarkBackdropAt(pt.x, pt.y, pt.exclude);
        setDark(dk);
        if (dk !== lastDark) {
          lastDark = dk;
          tailUntil = Math.max(tailUntil, performance.now() + 400); // 변할 때마다 조금 더 지켜봄
        }
      }
      if (performance.now() < tailUntil) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const start = (ms: number) => {
      tailUntil = performance.now() + ms;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    kickRef.current = () => start(scrollKickMs);
    const onScroll = () => start(scrollKickMs);

    // (재)마운트 직후 잠깐 계속 샘플링 — 인트로 오버레이가 걷히는 순간 등을 스크롤 없이도 잡음.
    start(initialKickMs);
    if (watchScroll) window.addEventListener("scroll", onScroll, { passive: true });
    if (watchResize) window.addEventListener("resize", onScroll);
    return () => {
      if (watchScroll) window.removeEventListener("scroll", onScroll);
      if (watchResize) window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, initialKickMs, scrollKickMs, watchScroll, watchResize, ...(opts.reinitDeps ?? [])]);

  const kick = useCallback(() => kickRef.current(), []); // 안정적 identity(외부 effect 의존성용)
  return { dark, kick };
}
