"use client";

import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { films, type Film } from "@/data/films";

export default function Programme() {
  const [open, setOpen] = useState<string | null>(films[0]?.id ?? null);

  return (
    <section className="section programme" id="programme">
      <div className="shell">
        <header className="section__head">
          <div>
            <p className="eyebrow">The Programme</p>
            <h2 className="section__title">라인업</h2>
          </div>
          <span className="section__index">현재 배급 · 2024–2025 / 전 {films.length}편</span>
        </header>

        <div className="slate">
          {films.map((film, i) => (
            <FilmRow
              key={film.id}
              film={film}
              index={i}
              isOpen={open === film.id}
              onToggle={() =>
                setOpen((cur) => (cur === film.id ? null : film.id))
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FilmRow({
  film,
  index,
  isOpen,
  onToggle,
}: {
  film: Film;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const reduce = useReducedMotion();

  const row: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 28 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 },
    },
  };

  const panelId = `film-panel-${film.id}`;

  return (
    <motion.article
      className="film"
      data-open={isOpen}
      variants={row}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px" }}
    >
      <button
        className="film__row"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="film__num">{film.index}</span>
        <span>
          <span className="film__title">{film.title}</span>
          <span className="film__title-en">{film.titleEn}</span>
        </span>
        <span className="film__aside">
          <span className="film__tags">
            <span className="film__tag film__tag--amber">{film.status}</span>
            <span className="film__tag">
              {film.country} · {film.year} · {film.format}
            </span>
          </span>
          <span className="film__sign" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1v12M1 7h12"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="film__panel"
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="film__panel-inner">
              <div
                className="poster"
                style={{
                  background: `linear-gradient(150deg, ${film.palette[0]}, ${film.palette[1]})`,
                }}
              >
                <span className="poster__top">
                  Film Nouvelle · No.{film.index}
                </span>
                <span className="poster__title">{film.title}</span>
                <span className="poster__foot">
                  {film.titleEn} — {film.format}
                </span>
              </div>

              <div className="film__detail">
                <p className="film__logline">{film.logline}</p>
                <div className="film__credits">
                  <span className="film__credit">
                    <b>감독</b>
                    {film.director}
                  </span>
                  <span className="film__credit">
                    <b>제작</b>
                    {film.country} · {film.year}
                  </span>
                  <span className="film__credit">
                    <b>장르</b>
                    {film.genre}
                  </span>
                  <span className="film__credit">
                    <b>러닝타임</b>
                    {film.runtime}분
                  </span>
                  <span className="film__credit">
                    <b>상영포맷</b>
                    {film.format}
                  </span>
                </div>
                <div className="film__actions">
                  <a className="btn btn--amber" href="#contact">
                    상영 문의
                  </a>
                  <button className="btn" type="button">
                    예고편 보기
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M3 2l6 4-6 4V2z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
