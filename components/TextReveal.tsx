"use client";

import { Fragment, ReactNode, useRef } from "react";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import styles from "./TextReveal.module.css";

type ColorProp = string | MotionValue<string>;

/**
 * Scroll-driven word-by-word reveal.
 * `text` accepts a string ("\n" = 줄바꿈) or an array of lines.
 * fillColor/ghostColor 로 글자 색을 (모션값 포함) 외부에서 제어할 수 있다 —
 * 배경이 밝다가 어두워질 때 대비를 유지하기 위해 사용.
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

  let idx = 0;
  return (
    <div ref={targetRef} className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.sticky}>
        <p className={styles.text}>
          {lines.map((line, li) => (
            <Fragment key={li}>
              {li > 0 && <span className={styles.break} aria-hidden="true" />}
              {line.split(/\s+/).map((word) => {
                const i = idx++;
                const start = i / total;
                const end = start + 1 / total;
                return (
                  <Word
                    key={i}
                    progress={scrollYProgress}
                    range={[start, end]}
                    fillColor={fillColor}
                    ghostColor={ghostColor}
                  >
                    {word}
                  </Word>
                );
              })}
            </Fragment>
          ))}
        </p>
      </div>
    </div>
  );
}

function Word({
  children,
  progress,
  range,
  fillColor,
  ghostColor,
}: {
  children: ReactNode;
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
        {children}
      </motion.span>
      <motion.span
        className={styles.fill}
        style={fillColor ? { opacity, color: fillColor } : { opacity }}
      >
        {children}
      </motion.span>
    </span>
  );
}
