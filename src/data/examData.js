// ============================================================
// 역할: 모의고사 구성과 "모든 문제를 번호표로 찾는 사전"
//
//  - QUESTION_MAP : { 문제id: 문제 } 오답노트와 시험 결과 화면이 문제를 찾을 때 사용
//  - EXAM_LIST    : 선택할 수 있는 모의고사 목록
//
// 모의고사 종류
//   · 필기 모의고사 (80문제, 문항당 1.25점)    : 필기 문제 은행 전체를 과목 순서대로
//   · 필기 맛보기   (20문제, 문항당 5점)       : 과목마다 4문제씩 뽑은 짧은 모의고사
//   · SQLD 모의고사 (50문제, 문항당 2점)
//   · 실기 단답형 모의고사 1~5회 (20문제, 문항당 5점) : 단답형 100제 + IT용어 문제를 섞어서 구성
//
// ※ 뽑는 방식은 "항상 같은 결과가 나오는 섞기(seed 고정)"라서 새로고침해도 시험 구성이 바뀌지 않습니다.
//   (오답노트가 문제 번호로 문제를 찾기 때문에 시험 구성이 바뀌면 안 됩니다.)
// ============================================================
import { CHOICE_QUESTIONS, SQLD_QUESTIONS, WRITTEN_QUESTIONS, WRITTEN_SUBJECTS } from './choiceData.js';
import { SHORT_QUESTIONS } from './shortData.js';

/** 모든 문제를 번호표로 찾는 사전 */
export const QUESTION_MAP = Object.fromEntries([...CHOICE_QUESTIONS, ...SHORT_QUESTIONS].map((q) => [q.id, q]));

// ---------- 항상 같은 순서로 섞기 (seed 고정) ----------
function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(list, seed) {
  const random = mulberry32(seed);
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 문제 목록에 배점을 붙여 시험지로 만들기 */
function withPoints(questions, points) {
  return questions.map((q) => ({ ...q, points }));
}

// ---------- 필기 맛보기: 과목마다 4문제 ----------
const writtenMini = WRITTEN_SUBJECTS.flatMap((subject, i) =>
  seededShuffle(
    WRITTEN_QUESTIONS.filter((q) => q.category === subject),
    100 + i
  ).slice(0, 4)
);

// ---------- 실기 단답형: 20문제씩 5회 ----------
const shortShuffled = seededShuffle(SHORT_QUESTIONS, 2024);
const shortSets = [0, 1, 2, 3, 4].map((i) => shortShuffled.slice(i * 20, i * 20 + 20));

export const EXAM_LIST = [
  {
    id: 'written-full',
    kind: '필기',
    title: '정보처리기사 필기 모의고사',
    round: '필기 전체',
    description: '필기 5과목 80문제를 실제 시험처럼 풀어 봅니다. 60점 이상이면 합격 기준을 넘어요.',
    timeOptions: [60, 120, 150],
    defaultMinutes: 150,
    passScore: 60,
    questions: withPoints(WRITTEN_QUESTIONS, 1.25),
  },
  {
    id: 'written-mini',
    kind: '필기',
    title: '필기 맛보기 모의고사',
    round: '필기 20문제',
    description: '과목마다 4문제씩 골라 만든 짧은 모의고사입니다. 시간이 없을 때 풀어 보세요.',
    timeOptions: [20, 30, 40],
    defaultMinutes: 30,
    passScore: 60,
    questions: withPoints(writtenMini, 5),
  },
  {
    id: 'sqld-full',
    kind: 'SQLD',
    title: 'SQLD 모의고사',
    round: 'SQLD 50문제',
    description: '데이터 모델링 25문제 + SQL 기본 및 활용 25문제로 구성했어요.',
    timeOptions: [60, 90],
    defaultMinutes: 90,
    passScore: 60,
    questions: withPoints(SQLD_QUESTIONS, 2),
  },
  ...shortSets.map((questions, i) => ({
    id: `short-${i + 1}`,
    kind: '실기',
    title: `실기 단답형 모의고사 ${i + 1}회`,
    round: `실기 단답형 ${i + 1}회`,
    description: '단답형 100제와 IT용어 문제를 섞어 만든 20문제입니다. 한글 또는 영문 약어 모두 정답으로 인정돼요.',
    timeOptions: [20, 30, 40],
    defaultMinutes: 30,
    passScore: 60,
    questions: withPoints(questions, 5),
  })),
];

export const EXAM_MAP = Object.fromEntries(EXAM_LIST.map((exam) => [exam.id, exam]));
