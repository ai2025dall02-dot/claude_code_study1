"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import styles from "./Landing.module.css";

/** 뷰포트 진입 시 한 글자씩 타이핑되는 섹션 제목 (solid + outline(em) 두 부분). */
export default function TypeTitle({
  solid,
  outline,
}: {
  solid: string;
  outline: string;
}) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const full = solid.length + outline.length;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setCount(full);
      return;
    }
    let c = 0;
    const id = setInterval(() => {
      c += 1;
      setCount(c);
      if (c >= full) clearInterval(id);
    }, 90);
    return () => clearInterval(id);
  }, [inView, reduce, full]);

  const solidShown = solid.slice(0, Math.min(count, solid.length));
  const outlineShown = outline.slice(0, Math.max(0, count - solid.length));

  return (
    <h2 ref={ref} className={styles.title} aria-label={`${solid}${outline}`}>
      <span aria-hidden="true">{solidShown}</span>
      <em aria-hidden="true">{outlineShown}</em>
      <span className={styles.caret} aria-hidden="true" />
    </h2>
  );
}
