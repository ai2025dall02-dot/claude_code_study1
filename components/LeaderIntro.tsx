"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

/**
 * 시그니처 모션: 페이지 로드 시 필름 카운트다운 리더(3·2·1)가 돌고
 * 아이리스 아웃되며 본문이 드러난다. prefers-reduced-motion이면 즉시 생략.
 */
export default function LeaderIntro() {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (reduce) {
      setDone(true);
      return;
    }
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(() => setCount(2), 650);
    const t2 = setTimeout(() => setCount(1), 1300);
    const t3 = setTimeout(() => finish(), 1950);
    return () => {
      [t1, t2, t3].forEach(clearTimeout);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  function finish() {
    document.body.style.overflow = "";
    setDone(true);
  }

  if (reduce) return null;

  const sweep: Variants = {
    spin: {
      rotate: 360,
      transition: { duration: 0.65, ease: "linear", repeat: Infinity },
    },
  };

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="leader"
          initial={{ opacity: 1 }}
          exit={{
            clipPath: ["circle(150% at 50% 50%)", "circle(0% at 50% 50%)"],
            opacity: [1, 1, 0],
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
          }}
          aria-hidden="true"
        >
          <button
            className="leader__skip"
            onClick={finish}
            type="button"
          >
            건너뛰기
          </button>

          <div className="leader__stage">
            <span className="leader__ring" />
            <span className="leader__cross" />
            <motion.span
              className="leader__sweep"
              variants={sweep}
              animate="spin"
            />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={count}
                className="leader__num"
                initial={{ opacity: 0, scale: 1.25 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </div>

          <span className="leader__label">Film Nouvelle — Picture Start</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
