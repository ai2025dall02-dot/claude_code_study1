"use client";

// ── 원통형 카드 덱 (Three.js / WebGL) ──────────────────────────────────────────
// CSS 3D(평면 카드) 방식의 "각진" 원통을 WebGL 로 대체:
//  - 각 카드를 원통 반지름에 맞춰 휜 "곡면 메시"로 만들어 각진 이음새 제거.
//  - 카드 사이에 약간의 틈(STEP 의 82%만 카드가 차지) → 하나로 이어진 실린더가 아니라
//    "살짝 휜 카드들이 원통을 이루는" 구성.
//  - 캔버스는 투명(alpha) → 뒤에 깔린 DOM FILMNOUVELLE 텍스트가 카드 틈/페이드 영역으로 비침.
// 기존 동작(자동회전·플릭 관성·호버 확대·정면 이탈 페이드·기울기·반응형·reduce)을 rAF 로 그대로 재현.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

// ── 튜닝값(기존 CSS 덱과 동일 감성) ──
const SPEED = 7; // deg/sec — 자동 회전 속도
const FULL_DEG = 42; // 정면 ±이 각도까지는 완전 불투명
const FADE_BAND = 30; // 이후 이 폭에 걸쳐 0 으로 페이드(뒤로 간 카드=투명)
const DRAG_FACTOR = 0.3; // 드래그 1px → 회전 deg
const MAX_V = 520; // 플릭 최대 각속도(deg/s)
const DECAY = 0.94; // 관성 감쇠(프레임당)
const HOVER_SCALE = 1.12; // 호버 시 카드 확대 배율(.hovered 상당)

// ── 원통 형상(월드 좌표) ──
const REPEAT = 2; // 포스터 배열을 몇 바퀴 반복할지
const CARD_H = 3.2; // 카드 높이(월드)
const CARD_AR = 230 / 324; // 카드 가로:세로 비(기존 CW:CH)
const CARD_W = CARD_H * CARD_AR; // 카드 폭(월드)
const FILL = 0.82; // 카드가 차지하는 STEP 비율(<1 → 카드 사이 틈)
const SEG_W = 24; // 카드 가로 세그먼트(클수록 곡면이 매끄러움)

// ── 기울기(기존 rotateZ -8 · rotateX -20 재현) ──
const TILT_Z = THREE.MathUtils.degToRad(-8);
const TILT_X = THREE.MathUtils.degToRad(-20);

// ── 카메라/스케일 ──
const CAM_Z = 16;
const CAM_FOV = 30;
const CENTER_Y = -0.9; // 원통을 화면 세로 중앙 쪽으로 살짝 내림(월드 Y) — 상단 쏠림 보정
// 반응형 스케일(기존 --scale 0.8 / 0.72 / 0.6 감성) — 그룹 전체에 곱함
function scaleForWidth(w: number) {
  if (w <= 767) return 0.62;
  if (w <= 1024) return 0.66;
  if (w <= 1280) return 0.78;
  return 0.86;
}

function norm(a: number) {
  const m = ((a % 360) + 360) % 360;
  return m > 180 ? m - 360 : m;
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
// 정면(0°)에서 카드 i 가 떨어진 각도로 불투명도 산출 — 기존 opacityAt 과 동일 공식.
function opacityAt(angleDeg: number) {
  const dist = Math.abs(norm(angleDeg));
  if (dist <= FULL_DEG) return 1;
  return clamp((FULL_DEG + FADE_BAND - dist) / FADE_BAND, 0, 1);
}

// 평면 지오메트리를 원통 반지름 R 로 감아 곡면화 — 모든 정점이 축에서 정확히 R 에 놓임.
// 지오메트리 중심(로컬 원점)은 카드 중앙 → mesh.scale 로 "제자리 확대"(호버) 가능.
function makeCurvedPlane(width: number, height: number, radius: number) {
  const geo = new THREE.PlaneGeometry(width, height, SEG_W, 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const a = x / radius; // 호 길이 x 를 각도로
    pos.setX(i, radius * Math.sin(a));
    pos.setZ(i, radius * Math.cos(a) - radius); // 중앙 z=0, 가장자리는 뒤로(축 쪽) → 볼록
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// 이미지 종횡비를 카드 종횡비에 맞춰 cover(잘라 채움) — 기존 object-fit:cover 재현.
function coverFit(tex: THREE.Texture, imgW: number, imgH: number) {
  const imgAR = imgW / imgH;
  if (imgAR > CARD_AR) {
    // 이미지가 더 넓음 → 좌우를 잘라 세로 맞춤
    const r = CARD_AR / imgAR;
    tex.repeat.set(r, 1);
    tex.offset.set((1 - r) / 2, 0);
  } else {
    // 이미지가 더 김 → 상하를 잘라 가로 맞춤
    const r = imgAR / CARD_AR;
    tex.repeat.set(1, r);
    tex.offset.set(0, (1 - r) / 2);
  }
}

export type CylinderDeckProps = {
  images: string[]; // 카드에 입힐 포스터 경로(예: lineup_1~6)
  active: boolean; // 타이틀 인트로 완료(titleSettled) → 덱 등장 트리거
  reduce: boolean; // prefers-reduced-motion
  onIntroDone?: () => void; // 덱 등장 애니메이션 완료(=스크롤 잠금 해제 트리거)
};

export default function CylinderDeck({ images, active, reduce, onIntroDone }: CylinderDeckProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // 프롭을 rAF/이벤트 핸들러에서 최신값으로 읽기 위한 ref 미러
  const reduceRef = useRef(reduce);
  const onIntroDoneRef = useRef(onIntroDone);
  reduceRef.current = reduce;
  onIntroDoneRef.current = onIntroDone;

  // 씬 초기화(마운트 1회). WebGL 은 브라우저 전용이라 effect(클라이언트) 안에서만 생성.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return; // WebGL 미지원 → 조용히 종료(뒤 텍스트만 노출)
    }
    renderer.setClearColor(0x000000, 0); // 투명 배경 → 뒤 DOM 텍스트 비침
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    wrap.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 100);
    camera.position.set(0, 0, CAM_Z);
    camera.lookAt(0, 0, 0);

    // 기울기 그룹 중첩: tiltZ(-8°) > tiltX(-20°) > ring(rotateY 회전) — 기존 deckTilt/deckRing 대응.
    const tiltZ = new THREE.Group();
    tiltZ.rotation.z = TILT_Z;
    tiltZ.position.y = CENTER_Y; // 상단 쏠림 보정(세로 위치)
    const tiltX = new THREE.Group();
    tiltX.rotation.x = TILT_X;
    const ring = new THREE.Group();
    tiltX.add(ring);
    tiltZ.add(tiltX);
    scene.add(tiltZ);

    // 카드 구성: 이미지 배열 × REPEAT 바퀴
    const deck: string[] = [];
    for (let r = 0; r < REPEAT; r++) deck.push(...images);
    const COUNT = deck.length;
    const STEP = 360 / COUNT; // deg
    const cardAngle = THREE.MathUtils.degToRad(STEP) * FILL; // 카드 1장이 차지하는 각(틈 제외)
    const RADIUS = CARD_W / cardAngle; // 카드 폭 = 호 길이 → 반지름
    const geometry = makeCurvedPlane(CARD_W, CARD_H, RADIUS);

    const loader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures: THREE.Texture[] = [];
    const materials: THREE.MeshBasicMaterial[] = [];
    const meshes: THREE.Mesh[] = [];
    const baseAngle: number[] = []; // 카드 i 의 기준 각도(deg)
    const curScale: number[] = []; // 호버 확대 lerp 현재값

    // 같은 이미지 경로는 텍스처 1개만 로드해 공유(메모리 절약)
    const texCache = new Map<string, THREE.Texture>();
    const loadTex = (src: string) => {
      const cached = texCache.get(src);
      if (cached) return cached;
      const tex = loader.load(src, (t) => {
        const img = t.image as HTMLImageElement;
        if (img?.width) coverFit(t, img.width, img.height);
        t.needsUpdate = true;
        if (reduceRef.current) applyAndRender(); // 정지 모드: 텍스처 로드 시마다 다시 그림(단발 렌더 보완)
      });
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.generateMipmaps = true;
      texCache.set(src, tex);
      textures.push(tex);
      return tex;
    };

    for (let i = 0; i < COUNT; i++) {
      const tex = loadTex(deck[i]);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true, // 각도 페이드(opacity) + 틈 투명
        opacity: 1,
        side: THREE.FrontSide, // 뒤로 돈 면은 페이드로 0 → backface-visibility:hidden 대응
        depthWrite: false, // 반투명 카드 간 z-파이팅/가림 아티팩트 방지
      });
      materials.push(mat);
      const slot = new THREE.Group();
      slot.rotation.y = THREE.MathUtils.degToRad(i * STEP); // 원통 둘레 배치
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.z = RADIUS; // 곡면 중심을 반지름 위로 → 카드가 원통 옆면에 안착
      mesh.renderOrder = 0;
      slot.add(mesh);
      ring.add(slot);
      meshes.push(mesh);
      baseAngle.push(i * STEP);
      curScale.push(1);
    }

    // ── 상태 ──
    let rot = 0; // 링 회전각(deg) — 기존 rotRef
    let velocity = 0; // 관성 각속도(deg/s) — 기존 velocityRef
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let hovered = -1; // 호버 카드 인덱스(-1=없음)
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    // 반응형 스케일 + 렌더러 크기
    const applySize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      tiltZ.scale.setScalar(scaleForWidth(window.innerWidth));
    };
    applySize();

    // 카드별 불투명도/호버 확대 반영 + 렌더 (함수 선언 → 텍스처 onLoad 콜백에서도 호출 가능하도록 호이스팅)
    function applyAndRender() {
      ring.rotation.y = THREE.MathUtils.degToRad(rot);
      for (let i = 0; i < COUNT; i++) {
        const o = opacityAt(baseAngle[i] + rot);
        materials[i].opacity = o;
        materials[i].visible = o > 0.001;
        const target = i === hovered ? HOVER_SCALE : 1;
        curScale[i] += (target - curScale[i]) * 0.18; // 부드러운 확대/복귀
        meshes[i].scale.setScalar(curScale[i]);
      }
      renderer.render(scene, camera);
    }

    // ── 레이캐스트: 포인터 아래의 "정면(불투명) 카드" 인덱스 ──
    const pickCard = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(meshes, false);
      for (const h of hits) {
        const idx = meshes.indexOf(h.object as THREE.Mesh);
        if (idx >= 0 && materials[idx].opacity > 0.5) return idx; // 뒤로 페이드된 카드는 무시
      }
      return -1;
    };

    // ── 포인터: 드래그(플릭) + 호버 ──
    const onPointerDown = (e: PointerEvent) => {
      if (reduceRef.current) return;
      const idx = pickCard(e.clientX, e.clientY);
      if (idx < 0) return; // 카드 밖 → 무시(페이지 스크롤 등 통과)
      dragging = true;
      velocity = 0;
      lastX = e.clientX;
      lastT = e.timeStamp;
      wrap.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragging) {
        const dx = e.clientX - lastX;
        const dts = Math.max(1, e.timeStamp - lastT) / 1000;
        const dDeg = dx * DRAG_FACTOR;
        rot += dDeg;
        velocity = clamp(dDeg / dts, -MAX_V, MAX_V);
        lastX = e.clientX;
        lastT = e.timeStamp;
        return;
      }
      if (reduceRef.current) return;
      hovered = pickCard(e.clientX, e.clientY); // 호버 → 자동회전 정지 + 확대
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try {
        wrap.releasePointerCapture(e.pointerId);
      } catch {
        /* capture 없을 수 있음 */
      }
    };
    const onPointerLeave = () => {
      if (!dragging) hovered = -1;
    };
    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", onPointerUp);
    wrap.addEventListener("pointercancel", onPointerUp);
    wrap.addEventListener("pointerleave", onPointerLeave);

    // ── 리사이즈 ──
    const ro = new ResizeObserver(() => {
      applySize();
      if (reduceRef.current) applyAndRender(); // 정지 모드도 크기 변하면 다시 그림
    });
    ro.observe(wrap);
    const onWinResize = () => applySize();
    window.addEventListener("resize", onWinResize);

    // ── 루프 ──
    let raf = 0;
    let lastFrame = 0;
    if (reduceRef.current) {
      // reduce: 회전 없이 정지 상태로 1프레임만 렌더
      rot = 0;
      applyAndRender();
    } else {
      const frame = (t: number) => {
        if (!lastFrame) lastFrame = t;
        const dt = (t - lastFrame) / 1000;
        lastFrame = t;
        if (dragging) {
          // 손 입력만 반영(자동회전/관성 정지)
        } else if (hovered >= 0 && velocity === 0) {
          // 호버 정지: 관성 남았으면 계속 굴림(플릭 우선), 다 죽으면 멈춤
        } else {
          rot += (SPEED + velocity) * dt;
          velocity *= DECAY;
          if (Math.abs(velocity) < 0.05) velocity = 0;
        }
        applyAndRender();
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    // 정리(dispose) — 리소스 누수 방지
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", onPointerUp);
      wrap.removeEventListener("pointercancel", onPointerUp);
      wrap.removeEventListener("pointerleave", onPointerLeave);
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      if (canvas.parentNode === wrap) wrap.removeChild(canvas);
    };
    // images 는 상수 배열(부모에서 고정) — 마운트 1회만 초기화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 등장 애니메이션 ── 타이틀 인트로 완료(active) 후 아래→위 + 페이드인(GSAP).
  const introPlayed = useRef(false);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (reduce) {
      gsap.set(wrap, { autoAlpha: 1, y: 0 }); // reduce: 즉시 표시(정지)
      return;
    }
    if (!active || introPlayed.current) return;
    introPlayed.current = true;
    gsap.fromTo(
      wrap,
      { autoAlpha: 0, y: 80 }, // 아래(+80px)에서 투명하게
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.0,
        ease: "power3.out",
        onComplete: () => onIntroDoneRef.current?.(),
      },
    );
  }, [active, reduce]);

  // 캔버스 래퍼 — 전체 스테이지를 덮되 z 는 텍스트 위(카드가 텍스트를 가림), 투명부는 텍스트 비침.
  // 초기 opacity 0(비-reduce): 등장 전 숨김. touch-action:pan-y → 모바일 세로 스크롤은 통과, 가로 드래그만 캡처.
  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 3,
        touchAction: "pan-y",
        opacity: reduce ? 1 : 0,
      }}
    />
  );
}
