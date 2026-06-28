"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import styles from "./CountdownIntro.module.css";

/**
 * 영화 시작 같은 3-2-1 필름 리더 카운트다운.
 * onReveal: 카운트다운이 끝나며 히어로 등장을 시작시키는 시점(오버레이는 아직 페이드 중)
 * onFinish: 오버레이 페이드아웃 완료 → 언마운트
 */
export default function CountdownIntro({
  onReveal,
  onFinish,
}: {
  onReveal: () => void;
  onFinish: () => void;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(3);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (reduce) {
      onReveal();
      onFinish();
      return;
    }
    const STEP = 850;
    const timers = [
      setTimeout(() => setN(2), STEP),
      setTimeout(() => setN(1), STEP * 2),
      setTimeout(() => {
        setExiting(true);
        onReveal();
      }, STEP * 3),
      setTimeout(() => onFinish(), STEP * 3 + 650),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (reduce) return null;

  return (
    <div
      className={`${styles.leader} ${exiting ? styles.exit : ""}`}
      aria-hidden="true"
    >
      <div className={styles.stage}>
        <span className={styles.ring} />
        <span className={styles.cross} />
        <span className={styles.crossH} />
        <span key={`hand-${n}`} className={styles.hand} />
        <span key={`num-${n}`} className={styles.num}>
          {n}
        </span>
      </div>
      <span className={styles.label}>FILM NOUVELLE</span>
    </div>
  );
}
