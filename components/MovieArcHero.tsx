import styles from "./MovieArcHero.module.css";

/* placeholder 포스터 8장 (가상) */
const POSTERS: { t: string; g: [string, string] }[] = [
  { t: "여름의 잔상", g: ["#C44E3D", "#241317"] },
  { t: "북위 48도", g: ["#2E5266", "#0B1418"] },
  { t: "조용한 망명", g: ["#3F5046", "#10130F"] },
  { t: "소금사막", g: ["#B9A07A", "#2A2419"] },
  { t: "겨울 손님", g: ["#5B6B78", "#11161A"] },
  { t: "필름의 끝", g: ["#8A6A3B", "#1A140C"] },
  { t: "붉은 방", g: ["#7A2E3A", "#1A0E12"] },
  { t: "바다의 문", g: ["#27506B", "#0A1016"] },
];

const N = POSTERS.length;
const SPREAD = 108; // 부채 전체 각도(deg)

export default function MovieArcHero() {
  const half = SPREAD / 2;

  return (
    <section className={styles.stage}>
      <div className={styles.brand}>
        <b>필름 누벨</b>
        <span>Film Nouvelle</span>
      </div>

      <h1 className={styles.movie} aria-label="MOVIE">
        MOVIE
      </h1>

      <div className={styles.fan}>
        {POSTERS.map((p, i) => {
          const theta = -half + (SPREAD / (N - 1)) * i; // -54 … +54
          const t = Math.abs(theta) / half; // 0(앞) … 1(뒤)
          const scale = 1 - 0.26 * t;
          const blur = (4.5 * t).toFixed(2);
          const opacity = (1 - 0.4 * t).toFixed(2);
          const z = Math.round(100 - Math.abs(theta));

          return (
            <div
              key={p.t}
              className={styles.slot}
              style={{
                transform: `translate(-50%, -50%) rotate(${theta}deg) translateY(calc(var(--radius) * -1))`,
                zIndex: z,
              }}
            >
              <div
                className={styles.card}
                style={
                  {
                    "--g": `linear-gradient(155deg, ${p.g[0]}, ${p.g[1]})`,
                    "--s": scale,
                    "--b": `${blur}px`,
                    "--o": opacity,
                  } as React.CSSProperties
                }
              >
                <div className={styles.poster}>
                  <span className={styles.poster__top}>
                    Film Nouvelle · No.{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.poster__title}>{p.t}</span>
                  <span className={styles.poster__foot}>Now Distributing</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.hint}>독립 · 예술영화 배급 — 2024–2025 라인업</p>
    </section>
  );
}
