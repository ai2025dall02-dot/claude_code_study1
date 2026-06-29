"use client";

import { CSSProperties, Fragment, useRef } from "react";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import styles from "./TextReveal.module.css";

type ColorProp = string | MotionValue<string>;

/**
 * Scroll-driven word-by-word reveal.
 * `text` accepts a string ("\n" = 줄바꿈) or an array of lines.
 * fillColor/ghostColor 로 글자 색을(모션값 포함) 외부에서 제어 — 배경이 밝다가
 * 어두워질 때 대비를 유지하기 위해 사용.
 * 각 글자는 .char 로 분리되어, 컨테이너 hover 시 인덱스 기반 staggered 웨이브
 * (꿈틀거리는) 애니메이션이 가능하다.
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
  const { scrollYProgress } = useScroll({ target: targetRef });

  const lines = (Array.isArray(text) ? text : text.split("\n"))
    .map((l) => l.trim())
    .filter(Boolean);
  const total = lines.reduce((n, l) => n + l.split(/\s+/).length, 0);

  let wordIdx = 0;
  let charIdx = 0;
  return (
    <div ref={targetRef} className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.sticky}>
        <p className={styles.text}>
          {lines.map((line, li) => (
            <Fragment key={li}>
              {li > 0 && <span className={styles.break} aria-hidden="true" />}
              {line.split(/\s+/).map((word) => {
                const i = wordIdx++;
                const start = i / total;
                const end = start + 1 / total;
                const charStart = charIdx;
                charIdx += Array.from(word).length;
                return (
                  <Word
                    key={i}
                    word={word}
                    charStart={charStart}
                    progress={scrollYProgress}
                    range={[start, end]}
                    fillColor={fillColor}
                    ghostColor={ghostColor}
                  />
                );
              })}
            </Fragment>
          ))}
        </p>
      </div>
    </div>
  );
}

function Chars({ word, charStart }: { word: string; charStart: number }) {
  return (
    <>
      {Array.from(word).map((ch, k) => (
        <span
          key={k}
          className={styles.char}
          style={{ "--ci": charStart + k } as CSSProperties}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

function Word({
  word,
  charStart,
  progress,
  range,
  fillColor,
  ghostColor,
}: {
  word: string;
  charStart: number;
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
        <Chars word={word} charStart={charStart} />
      </motion.span>
      <motion.span
        className={styles.fill}
        style={fillColor ? { opacity, color: fillColor } : { opacity }}
      >
        <Chars word={word} charStart={charStart} />
      </motion.span>
    </span>
  );
}
