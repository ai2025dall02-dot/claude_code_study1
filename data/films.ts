export type Film = {
  id: string;
  index: string;
  title: string;
  titleEn: string;
  director: string;
  country: string;
  year: string;
  runtime: string;
  format: string;
  genre: string;
  logline: string;
  status: string;
  /** [accent, deep] — used to render the typographic poster panel */
  palette: [string, string];
};

// 가상 배급 라인업 (플레이스홀더). 실제 작품·인물과 무관합니다.
export const films: Film[] = [
  {
    id: "afterimage",
    index: "01",
    title: "여름의 잔상",
    titleEn: "Afterimage of Summer",
    director: "정하루",
    country: "한국",
    year: "2024",
    runtime: "112",
    format: "DCP",
    genre: "드라마",
    logline:
      "필름 현상소를 정리하던 자매가, 한 번도 인화된 적 없는 어머니의 마지막 롤을 발견한다. 사라진 여름의 빛이 다시 떠오른다.",
    status: "2024.09 전국 개봉",
    palette: ["#C44E3D", "#241317"],
  },
  {
    id: "north",
    index: "02",
    title: "북위 48도",
    titleEn: "48° North",
    director: "Léa Marchand",
    country: "프랑스",
    year: "2023",
    runtime: "98",
    format: "35mm",
    genre: "다큐멘터리",
    logline:
      "국경의 등대를 지키는 마지막 관리인. 얼어붙은 해안에서 그는 떠나간 모든 배의 이름을 기록한다.",
    status: "배급 중",
    palette: ["#2E5266", "#0B1418"],
  },
  {
    id: "exile",
    index: "03",
    title: "조용한 망명",
    titleEn: "Quiet Exile",
    director: "김도연",
    country: "한국",
    year: "2024",
    runtime: "127",
    format: "DCP",
    genre: "드라마",
    logline:
      "말을 잃은 번역가가 낯선 도시에 도착한다. 그녀가 옮길 수 없는 단 하나의 문장이, 도시 전체를 다시 쓰기 시작한다.",
    status: "2024 부산국제영화제 초청",
    palette: ["#3F5046", "#10130F"],
  },
  {
    id: "salt",
    index: "04",
    title: "소금사막",
    titleEn: "The Salt Flats",
    director: "Mateo Rivas",
    country: "아르헨티나",
    year: "2022",
    runtime: "105",
    format: "DCP",
    genre: "로드무비",
    logline:
      "비가 내리면 하늘을 통째로 비추는 사막. 두 이방인이 거울이 된 대지를 가로지르며 서로의 과거를 통과한다.",
    status: "배급 중",
    palette: ["#B9A07A", "#2A2419"],
  },
  {
    id: "winter",
    index: "05",
    title: "겨울 손님",
    titleEn: "Winter Guest",
    director: "박서진",
    country: "한국",
    year: "2025",
    runtime: "94",
    format: "DCP",
    genre: "미스터리",
    logline:
      "폐업을 앞둔 산장에 예약하지 않은 손님이 도착한다. 눈이 길을 지우는 사흘 동안, 아무도 떠나지 못한다.",
    status: "2025 라인업",
    palette: ["#5B6B78", "#11161A"],
  },
  {
    id: "reel",
    index: "06",
    title: "필름의 끝",
    titleEn: "End of Reel",
    director: "Yuki Tanaka",
    country: "일본",
    year: "2023",
    runtime: "88",
    format: "16mm",
    genre: "실험·에세이",
    logline:
      "한 영사기사가 마지막 상영을 준비한다. 릴이 다 돌아가기 전에, 그는 자신이 틀어 온 모든 영화를 한 번 더 본다.",
    status: "2025 라인업",
    palette: ["#8A6A3B", "#1A140C"],
  },
];
