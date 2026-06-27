import Image from "next/image";
import styles from "./CylinderHero.module.css";

export type Poster = {
  src: string;
  alt: string;
};

type Props = {
  posters: Poster[];
  /** 카드 크기(px) */
  cardWidth?: number;
  cardHeight?: number;
  /** 한 바퀴 회전 시간(초) */
  duration?: number;
  /** 중앙 카피 */
  eyebrow?: string;
  title?: string;
};

export default function CylinderHero({
  posters,
  cardWidth = 230,
  cardHeight = 345,
  duration = 38,
  eyebrow = "Now Distributing",
  title,
}: Props) {
  const n = Math.max(posters.length, 3);
  const step = 360 / n;
  // 원기둥 반지름: 카드들이 옆면에 안 겹치게 + 여유(1.3)
  const radius = Math.round((cardWidth / 2 / Math.tan(Math.PI / n)) * 1.3);

  return (
    <section className={styles.scene}>
      {/* 바깥 래퍼: 고정 기울기만 (회전 X) */}
      <div className={styles.tilt}>
        {/* 안쪽 링: rotateY 무한 회전만 */}
        <div
          className={styles.ring}
          style={
            {
              "--cw": `${cardWidth}px`,
              "--ch": `${cardHeight}px`,
              "--radius": `${radius}px`,
              "--dur": `${duration}s`,
            } as React.CSSProperties
          }
        >
          {posters.map((p, i) => (
            <div
              key={p.src}
              className={styles.cell}
              style={{
                transform: `rotateY(${i * step}deg) translateZ(${radius}px)`,
              }}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes={`${cardWidth}px`}
                priority={i < 4}
                // SVG 플레이스홀더는 옵티마이저를 거치지 않고 원본 서빙.
                // 실제 raster(JPG/PNG) 포스터로 교체하면 이 줄을 제거해 최적화 적용.
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>

      {title && (
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
      )}

      <p className={styles.hint}>마우스를 올리면 회전이 멈춥니다 · {n}편 상영 중</p>
    </section>
  );
}
