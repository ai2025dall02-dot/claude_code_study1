import Image from "next/image";
import styles from "./CylinderHeroMono.module.css";

export type Poster = {
  src: string;
  alt: string;
};

type Props = {
  /** 실사 포스터 이미지 (props 또는 CMS에서 주입) */
  posters: Poster[];
  cardWidth?: number;
  cardHeight?: number;
  /** 한 바퀴 회전 시간(초) */
  duration?: number;
  eyebrow?: string;
  title?: string;
  /** 배경 워터마크 텍스트 (무채색) */
  watermark?: string;
};

export default function CylinderHeroMono({
  posters,
  cardWidth = 230,
  cardHeight = 345,
  duration = 38,
  eyebrow = "In Cinemas",
  title,
  watermark = "MOVIE",
}: Props) {
  const n = Math.max(posters.length, 3);
  const step = 360 / n;
  const radius = Math.round((cardWidth / 2 / Math.tan(Math.PI / n)) * 1.3);

  return (
    <section className={styles.scene}>
      {watermark && <span className={styles.watermark}>{watermark}</span>}

      {/* 바깥 래퍼: 고정 기울기만 */}
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
