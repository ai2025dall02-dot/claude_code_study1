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
      "어느 여름은 끝났지만, 그 계절을 함께한 마음은 쉽게 사라지지 않는다. 〈여름의 잔상〉은 흘러간 시간 속에 남겨진 기억과 후회, 그리고 앞으로 나아가기 위해 마주해야 하는 감정을 섬세하게 그려낸 드라마다. 잊고 있었다고 믿었던 풍경 앞에서 우리는 가장 소중했던 순간들을 다시 마주하게 된다.",
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
      "국경은 지도 위에 선으로 그어지지만, 풍경은 그 어떤 경계에도 머물지 않는다. 〈북위 48도〉는 북위 48도를 따라 이어지는 공간을 천천히 응시하며, 역사와 정치, 환경, 그리고 그곳을 살아가는 사람들의 삶이 하나의 풍경 속에서 어떻게 교차하는지를 섬세하게 포착한다. 담담한 시선으로 경계를 바라보며, 우리가 나누고 있는 세계의 의미를 조용히 되묻는다.",
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
      "세상에서 가장 하얀 풍경은 가장 깊은 기억을 숨기고 있다. 〈소금 사막〉은 끝없이 펼쳐진 길을 따라 흘러가는 여정 속에서, 스쳐 지나간 인연과 오래된 상처를 차분히 되짚는다. 멈추지 않는 여행의 끝에서 우리는 잃어버린 서로를 다시 만나고, 오래도록 외면해왔던 자신의 마음과 마주하게 된다.",
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
      "눈은 모든 흔적을 덮지만, 감춰진 진실은 끝내 모습을 드러낸다. 〈겨울 손님〉은 모든 것이 멈춘 듯한 겨울, 홀로 남겨진 한 인물이 정체를 알 수 없는 존재와 마주하는 시간을 섬세한 긴장감으로 그려낸 미스터리다. 침묵이 길어질수록 불안은 더욱 선명해지고, 고요한 설원 위에 숨겨진 진실이 서서히 모습을 드러낸다.",
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
      "필름은 타오르지만, 그 안에 담긴 시간은 끝내 사라지지 않는다. 〈필름의 끝〉은 기록과 기억, 이미지와 부재 사이를 오가며 영화라는 매체가 남기는 흔적을 탐구하는 실험 에세이다. 사라져가는 프레임 속에서 새로운 감각을 길어 올리며, '본다는 것'과 '기억한다는 것'의 의미를 다시 사유하게 한다.",
    status: "2025 라인업",
    palette: ["#8A6A3B", "#1A140C"],
  },
  {
    id: "tide",
    index: "07",
    title: "만조의 방",
    titleEn: "Room at High Tide",
    director: "정하루",
    country: "한국",
    year: "2024",
    runtime: "108",
    format: "DCP",
    genre: "드라마",
    logline:
      "밀려오는 것은 바다가 아니라, 오래 미뤄두었던 마음이었다. 〈만조의 방〉은 고요한 방 안으로 스며드는 물결처럼 잊고 있던 기억과 감정이 천천히 되살아나는 과정을 따라간다. 가장 깊은 상처를 마주한 끝에서 우리는 비로소 잊고 있던 자신을 다시 만나게 된다.",
    status: "2025 라인업",
    palette: ["#3A6B74", "#0C1618"],
  },
  {
    id: "orchard",
    index: "08",
    title: "빛의 과수원",
    titleEn: "Orchard of Light",
    director: "Léa Marchand",
    country: "프랑스",
    year: "2022",
    runtime: "101",
    format: "35mm",
    genre: "다큐멘터리",
    logline:
      "첫 햇살이 과수원을 비추는 순간, 긴 계절을 견뎌낸 시간은 마침내 열매를 맺는다. 〈빛의 과수원〉은 계절과 함께 살아가는 사람들과 자연의 시간을 따라가며, 묵묵한 노동과 기다림이 빚어내는 생명의 풍경을 담아낸 다큐멘터리다. 햇살과 바람, 그리고 사람의 손길이 만들어낸 풍경 속에서 자연이 건네는 가장 따뜻한 위로를 전한다.",
    status: "배급 중",
    palette: ["#7C6A2E", "#16130A"],
  },
  {
    id: "static",
    index: "09",
    title: "잡음의 도시",
    titleEn: "City of Static",
    director: "김도연",
    country: "한국",
    year: "2025",
    runtime: "97",
    format: "DCP",
    genre: "미스터리",
    logline:
      "끊임없이 쏟아지는 정보와 소음은 진실의 목소리를 조금씩 지워간다. 〈잡음의 도시〉는 현실과 허구, 기억과 기록이 뒤엉킨 도시를 배경으로, 무엇을 믿어야 하는지조차 흔들리는 한 사람의 시선을 따라가는 미스터리다. 불안으로 가득한 도시의 풍경을 통해 현대 사회를 뒤덮은 '잡음'의 본질을 날카롭게 비춰낸다.",
    status: "2025 라인업",
    palette: ["#4A4A5A", "#0F0F14"],
  },
  {
    id: "dust",
    index: "10",
    title: "먼지의 무게",
    titleEn: "The Weight of Dust",
    director: "Yuki Tanaka",
    country: "일본",
    year: "2023",
    runtime: "119",
    format: "16mm",
    genre: "드라마",
    logline:
      "먼지는 모든 것을 덮지만, 기억까지 지우지는 못한다. 〈먼지의 무게〉는 오래도록 닫혀 있던 상자 속에 남겨진 흔적을 따라 한 사람의 삶과 기억을 천천히 되짚는다. 사진 한 장, 편지 한 통, 손때 묻은 물건들은 지나간 계절과 사랑, 그리고 끝내 전하지 못했던 마음을 조용히 되살려낸다.",
    status: "배급 중",
    palette: ["#8A5A3C", "#170F0A"],
  },
  {
    id: "meridian",
    index: "11",
    title: "자오선의 밤",
    titleEn: "Meridian Night",
    director: "박서진",
    country: "한국",
    year: "2024",
    runtime: "92",
    format: "16mm",
    genre: "실험·에세이",
    logline:
      "밤하늘에는 선이 없지만, 우리는 보이지 않는 경계를 따라 살아간다. 〈자오선의 밤〉은 빛과 어둠이 교차하는 풍경 속에서 우주와 인간, 시간과 기억이 하나의 감각으로 이어지는 순간을 응시한다. 끝없는 밤을 헤매는 여정 끝에서 마주하는 것은 목적지가 아닌, 오래도록 잊고 있던 자신의 내면이다.",
    status: "2024 부산국제영화제 초청",
    palette: ["#2C4A55", "#0A1316"],
  },
  {
    id: "ember",
    index: "12",
    title: "재의 계절",
    titleEn: "Season of Embers",
    director: "Mateo Rivas",
    country: "아르헨티나",
    year: "2023",
    runtime: "104",
    format: "DCP",
    genre: "로드무비",
    logline:
      "모든 것이 재가 된 계절에도 길은 끝내 이어진다. 〈재의 계절〉은 거대한 상실 이후, 잿빛 풍경을 가로지르는 한 사람의 여정을 따라가며 잃어버린 기억과 남겨진 삶의 의미를 찾아가는 로드무비다. 길 위에서 마주한 낯선 풍경과 우연한 만남은 다시 앞으로 나아갈 용기를 조용히 비춰낸다.",
    status: "배급 중",
    palette: ["#9B4A32", "#1A0E0A"],
  },
];
