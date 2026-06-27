"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

const principles = [
  {
    label: "원칙 / Curation",
    title: "변방을 중심으로",
    text: "이미 검증된 흥행이 아니라, 아직 자리를 얻지 못한 목소리를 먼저 봅니다. 배급은 발견에서 시작합니다.",
  },
  {
    label: "원칙 / Authorship",
    title: "감독의 첫 문장을 지킨다",
    text: "러닝타임도, 결말도, 침묵도 줄이지 않습니다. 만든 사람이 의도한 그대로 극장에 건넵니다.",
  },
  {
    label: "원칙 / Theatre",
    title: "극장이라는 약속",
    text: "작은 영화일수록 큰 화면이 필요합니다. 전국 예술영화관과 함께 상영의 자리를 끝까지 지킵니다.",
  },
];

export default function Manifesto() {
  const reduce = useReducedMotion();

  const reveal: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 30 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 },
    }),
  };

  return (
    <section className="section manifesto" id="about">
      <div className="shell">
        <header className="section__head">
          <div>
            <p className="eyebrow">About — 배급사 소개</p>
            <h2 className="section__title">우리가 영화를 옮기는 방식</h2>
          </div>
          <span className="section__index">Since 2014 · Seoul</span>
        </header>

        <motion.blockquote
          className="manifesto__quote"
          variants={reveal}
          custom={0}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15% 0px" }}
        >
          “좋은 영화는 사라지지 않는다. <em>다만 옮겨질 곳을 기다릴 뿐이다.</em>”
        </motion.blockquote>

        <motion.p
          className="manifesto__body"
          variants={reveal}
          custom={1}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15% 0px" }}
        >
          필름 누벨은 2014년, 극장에서 사라져 가던 독립·예술영화를 다시 스크린에
          올리기 위해 시작했습니다. 우리는 한 해에 단 몇 편만을 고릅니다. 적게
          고르는 대신, 한 편의 영화가 관객을 만나는 모든 길 — 개봉, 기획전,
          공동체 상영, 아카이브 — 을 끝까지 동행합니다.
        </motion.p>

        <div className="principles">
          {principles.map((p, i) => (
            <motion.div
              key={p.title}
              className="principle"
              variants={reveal}
              custom={i + 2}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-10% 0px" }}
            >
              <span className="principle__label">{p.label}</span>
              <h3 className="principle__title">{p.title}</h3>
              <p className="principle__text">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
