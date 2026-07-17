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
// [1] 카드(슬롯) 총 개수 8개. 모든 슬롯을 images 순환으로 채워 앞으로 나오는 카드는 항상 이미지.
const SLOT_COUNT = 8;
const CARD_H = 4.6; // [3] 카드 높이(월드) — dayonedream 처럼 정면 카드 시원하게 크게
const CARD_AR = 0.7; // 카드 가로:세로 비 — 세로형 포스터 비율
const CARD_W = CARD_H * CARD_AR; // 카드 폭(월드)
const FILL = 0.88; // [C] 카드가 차지하는 STEP 비율 — 더 촘촘하게(0.82→0.88, 틈 살짝만)
const SEG_W = 28; // 카드 가로 세그먼트(곡면 매끄럽게)

// ── 기울기 ──
// dayonedream: 원통을 꽤 눕혀 "안쪽 상단" 판들이 위로 길게 펼쳐지게(rotateX 양수 키움) + 살짝 대각선(rotateZ).
const TILT_Z = THREE.MathUtils.degToRad(8); // [3] 대각선 기울기 — DayOneDream 처럼 살짝만(10→8)
const TILT_X = THREE.MathUtils.degToRad(24); // [3] 뒤로 더 눕혀 위쪽 빈 판이 펼쳐지고 좌우 카드가 곡면 따라 휘게(20→24)

// ── 카메라/스케일 ──
const CAM_Z = 15; // [3] 카메라 거리 — 8개·큰 카드에 맞춰(정면 카드 크되 안 잘리게)
const CAM_FOV = 34; // 시야각
const CENTER_Y = 0.6; // [B] 세로 위치 — 원통을 화면 세로 중앙쯤으로 내림(2.3→0.6, 위쪽 빈 판 안 잘리는 선)

// ── 2겹 구조: 빈 뒷판(옅은 흰 유리판) + 이미지 앞판 ──
// [1][4] 카드 1장 = (a) 빈 뒷판(옅은 흰 회색 반투명 "유리판" — 둥근 모서리 + 얇은 밝은 테두리, 상시) +
//   (b) 이미지 앞판(반지름 +CARD_GAP, opacityAt 로 페이드). 앞쪽 반구: 이미지 불투명 → 유리판 가림 /
//   뒤쪽 반구: 이미지 페이드 → 옅은 유리판 드러남. 반투명이라 뒤 텍스트가 살짝 비침.
const PANEL_COLOR = "#ededed"; // 빈 뒷판 유리판 — 옅은 회색(거의 흰색)
const PANEL_BORDER = "rgba(255,255,255,0.95)"; // 얇고 밝은 테두리(유지)
const PANEL_OPACITY = 0.25; // [A] 더 투명하게(0.42→0.25) — 뒤 FILM NOUVELLE 텍스트가 은은히 비침(형태는 인지)
const CARD_GAP = 0.01; // 이미지 앞판을 뒷판보다 살짝 앞으로(반지름 +)
// [1][2] 모서리는 각지게(직사각형) — DayOneDream 처럼 라운딩 없음(둥근 마스크/반경 제거).
// 반응형 스케일 — 그룹 전체에 곱함. [1] 카드/카메라를 키운 만큼(정면 큰 아치) 좁은 화면에선 더
//   줄여야 아치가 안 잘리고 들어옴(모바일 0.62→0.42, 태블릿 하향). 데스크탑은 큰 카드 의도 유지.
function scaleForWidth(w: number) {
  if (w <= 767) return 0.42; // 모바일 — 아치가 좁은 폭에 다 들어오게 축소
  if (w <= 1024) return 0.55; // 태블릿
  if (w <= 1280) return 0.72; // 노트북
  return 0.86; // 데스크탑 — 큰 정면 카드 유지
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

    // 기울기 그룹 중첩: tiltZ(8°) > tiltX(+24°, 뒤로 눕혀 안쪽 상단) > ring(rotateY) — deckTilt/deckRing 대응.
    const tiltZ = new THREE.Group();
    tiltZ.rotation.z = TILT_Z;
    tiltZ.position.y = CENTER_Y; // 세로 위치 보정
    const tiltX = new THREE.Group();
    tiltX.rotation.x = TILT_X;
    const ring = new THREE.Group();
    tiltX.add(ring);
    tiltZ.add(tiltX);
    scene.add(tiltZ);

    // [2] 카드 구성: 8개 슬롯 모두 images 를 순환해 채움 → 앞으로 나오는 카드는 항상 이미지.
    const deck: string[] = [];
    for (let i = 0; i < SLOT_COUNT; i++) deck.push(images[i % images.length]);
    const COUNT = deck.length; // = SLOT_COUNT (8)
    const STEP = 360 / COUNT; // deg
    const cardAngle = THREE.MathUtils.degToRad(STEP) * FILL; // 카드 1장이 차지하는 각(틈 제외)
    const RADIUS = CARD_W / cardAngle; // 카드 폭 = 호 길이 → 반지름
    const geometry = makeCurvedPlane(CARD_W, CARD_H, RADIUS);

    const loader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures: THREE.Texture[] = [];
    const materials: THREE.MeshBasicMaterial[] = []; // 이미지 앞판 머티리얼(카드마다)
    const meshes: THREE.Mesh[] = []; // 이미지 앞판 메시(레이캐스트/호버 대상)
    const grayMeshes: THREE.Mesh[] = []; // 빈 뒷판 메시(호버 시 앞판과 함께 확대)
    const baseAngle: number[] = []; // 카드 i 의 기준 각도(deg)
    const curScale: number[] = []; // 호버 확대 lerp 현재값
    const loaded: boolean[] = []; // 카드 텍스처 로드 여부(false=이미지 앞판 숨김 → 뒷판 노출)

    const TW = 256; // 텍스처 가로 픽셀
    const TH = Math.round(TW / CARD_AR); // 세로형 카드 비율

    // [2] 빈 뒷판 "유리판" 텍스처 — 직사각형(각진 모서리) + 옅은 흰 채움 + 얇은 밝은 테두리(RGBA).
    const plateCanvas = document.createElement("canvas");
    plateCanvas.width = TW;
    plateCanvas.height = TH;
    const pg = plateCanvas.getContext("2d")!;
    pg.fillStyle = PANEL_COLOR; // 옅은 흰 회색
    pg.fillRect(0, 0, TW, TH);
    pg.lineWidth = 2;
    pg.strokeStyle = PANEL_BORDER; // 얇고 밝은 테두리(안쪽으로 1px)
    pg.strokeRect(1, 1, TW - 2, TH - 2);
    const plateTex = new THREE.CanvasTexture(plateCanvas);
    plateTex.colorSpace = THREE.SRGBColorSpace;
    plateTex.anisotropy = maxAniso;

    // [1] 빈 뒷판 공유 머티리얼 — 옅은 흰 유리판 텍스처(각진 모서리+테두리), 상시 반투명.
    // [B] side: DoubleSide → 원통 뒤쪽/위쪽 반구로 넘어간 판의 뒷면도 렌더 → 안쪽 상단 아치가 반투명 회색으로 연결돼 보임.
    //   (FrontSide 면 뒤로 돈 판이 컬링돼 사라져 아치가 안 보였음.) depthWrite:false 유지로 z-파이팅 방지.
    const grayMaterial = new THREE.MeshBasicMaterial({
      map: plateTex,
      color: 0xffffff, // 텍스처 원색 유지(틴트 없음)
      transparent: true,
      opacity: PANEL_OPACITY,
      side: THREE.DoubleSide, // [B] 앞·뒷면 모두 렌더 → 뒤쪽 반구(안쪽 상단 아치)도 보이게
      depthWrite: false,
    });

    // 이미지 앞판에 텍스처 적용 — 텍스처 1장은 같은 경로의 여러 카드가 공유.
    const applyTex = (mat: THREE.MeshBasicMaterial, tex: THREE.Texture, idx: number) => {
      mat.map = tex;
      mat.needsUpdate = true;
      loaded[idx] = true;
      if (reduceRef.current) applyAndRender(); // 정지 모드: 로드 시 다시 그림
    };
    const texState = new Map<string, { tex: THREE.Texture; ready: boolean; waiters: { mat: THREE.MeshBasicMaterial; idx: number }[] }>();
    const requestTex = (src: string, mat: THREE.MeshBasicMaterial, idx: number) => {
      let st = texState.get(src);
      if (!st) {
        const tex = loader.load(src, (t) => {
          const img = t.image as HTMLImageElement;
          if (img?.width) coverFit(t, img.width, img.height);
          t.needsUpdate = true;
          st!.ready = true;
          st!.waiters.forEach((w) => applyTex(w.mat, t, w.idx));
          st!.waiters.length = 0;
        });
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        tex.generateMipmaps = true;
        textures.push(tex);
        st = { tex, ready: false, waiters: [] };
        texState.set(src, st);
      }
      if (st.ready) applyTex(mat, st.tex, idx);
      else st.waiters.push({ mat, idx });
    };

    for (let i = 0; i < COUNT; i++) {
      const slot = new THREE.Group();
      slot.rotation.y = THREE.MathUtils.degToRad(i * STEP); // 원통 둘레 배치

      // (a) 회색 뒷판 — 원통 안쪽 벽. 상시 반투명 회색. 앞판보다 뒤(렌더 먼저).
      const grayMesh = new THREE.Mesh(geometry, grayMaterial);
      grayMesh.position.z = RADIUS;
      grayMesh.renderOrder = -1; // [5] 뒷판 < 앞판
      slot.add(grayMesh);
      grayMeshes.push(grayMesh);

      // (b) 이미지 앞판 — 뒷판보다 살짝 앞(반지름 +CARD_GAP). 로드 전 opacity 0(숨김) → 뒷판 노출.
      //   [1] 각진 모서리(둥근 alphaMap 제거) — 이미지가 곡면 카드 전체를 직각으로 꽉 채움. 텍스처(map)는 로드 시 주입.
      const imgMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0, // 로드/각도에 따라 매 프레임 갱신
        side: THREE.FrontSide,
        depthWrite: false,
      });
      const imgMesh = new THREE.Mesh(geometry, imgMat);
      imgMesh.position.z = RADIUS + CARD_GAP;
      imgMesh.renderOrder = 0; // 뒷판 위
      slot.add(imgMesh);
      ring.add(slot);

      materials.push(imgMat);
      meshes.push(imgMesh);
      baseAngle.push(i * STEP);
      curScale.push(1);
      loaded.push(false);
      requestTex(deck[i], imgMat, i); // 8칸 모두 이미지
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
        const o = opacityAt(baseAngle[i] + rot); // 1(정면)→0(뒤)
        // [4] 이미지 앞판만 각도 페이드(로드 전엔 0=숨김). 앞쪽 반구 불투명 → 회색 뒷판 가림 /
        //   뒤쪽 반구 페이드 0 → 아래 깔린 회색 뒷판이 드러남. 회색 뒷판(grayMaterial)은 상시 0.5(갱신 불필요).
        const im = materials[i];
        im.opacity = loaded[i] ? o : 0;
        im.visible = loaded[i] && o > 0.001;
        // 호버 확대는 앞·뒤판 함께
        const target = i === hovered ? HOVER_SCALE : 1;
        curScale[i] += (target - curScale[i]) * 0.18; // 부드러운 확대/복귀
        meshes[i].scale.setScalar(curScale[i]);
        grayMeshes[i].scale.setScalar(curScale[i]);
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
      grayMaterial.dispose();
      plateTex.dispose();
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
