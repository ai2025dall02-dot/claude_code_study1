"use client";

import { Fragment, ReactNode, useRef } from "react";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import styles from "./TextReveal.module.css";

/**
 * Scroll-driven word-by-word reveal.
 * `text` accepts a string ("\n" = 줄바꿈) or an array of lines.
 * 각 줄은 flex 줄바꿈으로 분리되고 가운데 정렬되며, 단어 reveal 진행도는
 * 줄을 넘어 연속(0→1)으로 이어진다. (원본의 ref 이중 할당 버그도 수정)
 */
export function TextReveal({
  text,
  className,
}: {
  text: string | string[];
  className?: string;
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
                  <Word key={i} progress={scrollYProgress} range={[start, end]}>
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
}: {
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className={styles.word}>
      <span className={styles.ghost}>{children}</span>
      <motion.span style={{ opacity }} className={styles.fill}>
        {children}
      </motion.span>
    </span>
  );
}
