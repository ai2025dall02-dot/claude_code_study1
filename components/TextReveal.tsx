"use client";

import { Fragment, useEffect, useRef } from "react";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import styles from "./TextReveal.module.css";

type ColorProp = string | MotionValue<string>;

/**
 * Scroll-driven word-by-word reveal + 커서 주변만 유리렌즈처럼 굴절되는 효과.
 * - base 텍스트와 동일한 굴절 오버레이(복제)를 겹쳐, 커서 원형 영역에서만
 *   오버레이(SVG feDisplacementMap 굴절본)를 보이고 base 는 비워 이중상 방지.
 * - 커서 좌표는 --mx/--my CSS 변수로 추적(rAF throttle), 텍스트 위에서만 활성화.
 */
export function TextReveal({
  text,
  className,
  fillColor,
  ghostColor,
}: {
  text: string | string[];
  className?: string;
  fillColor?: ColorProp;
  ghostColor?: ColorProp;
}) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });

  // 마우스 렌즈 추적 (rAF throttle)
  useEffect(() => {
    const area = stickyRef.current;
    if (!area) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let nx = 0;
    let ny = 0;
    const apply = () => {
      raf = 0;
      area.style.setProperty("--mx", `${nx}px`);
      area.style.setProperty("--my", `${ny}px`);
    };
    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      nx = e.clientX - r.left;
      ny = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onEnter = () => area.classList.add(styles.lensOn);
    const onLeave = () => area.classList.remove(styles.lensOn);

    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerenter", onEnter);
    area.addEventListener("pointerleave", onLeave);
    return () => {
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerenter", onEnter);
      area.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const lines = (Array.isArray(text) ? text : text.split("\n"))
    .map((l) => l.trim())
    .filter(Boolean);
  const total = lines.reduce((n, l) => n + l.split(/\s+/).length, 0);

  // 단어 메타 (base/overlay 두 번 동일하게 렌더)
  const items: {
    key: number;
    word: string;
    start: number;
    end: number;
    brk: boolean;
  }[] = [];
  let wi = 0;
  lines.forEach((line, li) => {
    line.split(/\s+/).forEach((word, k) => {
      const i = wi++;
      const start = i / total;
      items.push({ key: i, word, start, end: start + 1 / total, brk: li > 0 && k === 0 });
    });
  });

  const renderWords = () =>
    items.map((w) => (
      <Fragment key={w.key}>
        {w.brk && <span className={styles.break} aria-hidden="true" />}
        <Word
          word={w.word}
          progress={scrollYProgress}
          range={[w.start, w.end]}
          fillColor={fillColor}
          ghostColor={ghostColor}
        />
      </Fragment>
    ));

  return (
    <div ref={targetRef} className={`${styles.wrap} ${className ?? ""}`}>
      <svg className={styles.defs} aria-hidden="true">
        <filter
          id="filmRefract"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.024"
            numOctaves="2"
            seed="11"
            result="n"
          >
            {/* 노이즈를 천천히 왕복시켜 물결처럼 계속 일렁이게 */}
            <animate
              attributeName="baseFrequency"
              dur="9s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
              values="0.018 0.024;0.026 0.018;0.018 0.024"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="9"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <div ref={stickyRef} className={styles.sticky}>
        <p className={`${styles.text} ${styles.textBase}`}>{renderWords()}</p>
        <p className={`${styles.text} ${styles.textRefract}`} aria-hidden="true">
          {renderWords()}
        </p>
      </div>
    </div>
  );
}

function Word({
  word,
  progress,
  range,
  fillColor,
  ghostColor,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  fillColor?: ColorProp;
  ghostColor?: ColorProp;
}) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className={styles.word}>
      <motion.span
        className={styles.ghost}
        style={ghostColor ? { color: ghostColor } : undefined}
      >
        {word}
      </motion.span>
      <motion.span
        className={styles.fill}
        style={fillColor ? { opacity, color: fillColor } : { opacity }}
      >
        {word}
      </motion.span>
    </span>
  );
}
