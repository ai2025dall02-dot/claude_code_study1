"use client";

import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { films } from "@/data/films";

export default function Contact() {
  const reduce = useReducedMotion();
  const [sent, setSent] = useState(false);

  const reveal: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  };

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // 데모: 백엔드 없이 클라이언트에서 접수 상태만 표시
    setSent(true);
  }

  return (
    <section className="section contact" id="contact">
      <div className="shell">
        <header className="section__head">
          <div>
            <p className="eyebrow">Booking & Inquiry</p>
            <h2 className="section__title">상영 · 배급 문의</h2>
          </div>
          <span className="section__index">극장 / 기관 / 공동체 상영</span>
        </header>

        <div className="contact__grid">
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-15% 0px" }}
          >
            <p className="contact__lead">
              한 편의 영화를 당신의 스크린으로. 상영 일정과 조건을 함께
              설계합니다.
            </p>
            <div className="contact__info">
              <div>
                <p className="contact__item-label">배급 · 상영 문의</p>
                <p className="contact__item-value">
                  <a href="mailto:booking@film-nouvelle.example">
                    booking@film-nouvelle.example
                  </a>
                </p>
              </div>
              <div>
                <p className="contact__item-label">전화</p>
                <p className="contact__item-value">02-1234-5678 (평일 10–18시)</p>
              </div>
              <div>
                <p className="contact__item-label">스튜디오</p>
                <p className="contact__item-value">
                  서울특별시 마포구 와우산로 00, 3층
                </p>
              </div>
              <div>
                <p className="contact__item-label">예고편 아카이브</p>
                <p className="contact__item-value">
                  <a href="#programme">전 작품 예고편 모아보기 →</a>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-15% 0px" }}
          >
            {sent ? (
              <div className="form__success" role="status" aria-live="polite">
                <p className="form__success-title">문의가 접수되었습니다.</p>
                <p className="form__success-text">
                  영업일 기준 2–3일 내에 담당자가 회신드립니다. 급한 상영 일정은
                  전화로 연락 주세요.
                </p>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setSent(false)}
                  style={{ marginTop: "0.6rem", justifySelf: "start" }}
                >
                  새 문의 작성
                </button>
              </div>
            ) : (
              <form className="form" onSubmit={onSubmit} noValidate>
                <div className="field__row">
                  <div className="field">
                    <label htmlFor="org">
                      극장 / 기관명<span className="req">*</span>
                    </label>
                    <input
                      id="org"
                      name="org"
                      type="text"
                      required
                      autoComplete="organization"
                      placeholder="예) 시네마 누벨"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="name">
                      담당자<span className="req">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="성함"
                    />
                  </div>
                </div>

                <div className="field__row">
                  <div className="field">
                    <label htmlFor="email">
                      이메일<span className="req">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="film">관심 작품</label>
                    <select id="film" name="film" defaultValue="">
                      <option value="" disabled>
                        작품을 선택하세요
                      </option>
                      {films.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.index}. {f.title}
                        </option>
                      ))}
                      <option value="etc">기타 / 미정</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="message">상영 계획 / 문의 내용</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="희망 상영 시기, 회차, 관객 규모 등을 적어 주세요."
                  />
                </div>

                <button className="btn btn--amber form__submit" type="submit">
                  문의 보내기
                </button>
                <p className="form__note">
                  * 표시는 필수 항목입니다. 제출 시 개인정보 처리방침에 동의하는
                  것으로 간주됩니다.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
