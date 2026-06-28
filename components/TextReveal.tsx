"use client";

import { ReactNode, useRef } from "react";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import styles from "./TextReveal.module.css";

/**
 * Scroll-driven word-by-word reveal.
 * Adapted from the Magic UI "text reveal" pattern to this project's
 * CSS-module setup (no Tailwind). The original assigned the scroll ref to
 * both the wrapper and the <p>; here the ref lives only on the tall wrapper
 * so scroll progress tracks the section as intended.
 */
export function TextReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const words = text.split(" ");

  return (
    <div ref={targetRef} className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.sticky}>
        <p className={styles.text}>
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            return (
              <Word key={i} progress={scrollYProgress} range={[start, end]}>
                {word}
              </Word>
            );
          })}
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
