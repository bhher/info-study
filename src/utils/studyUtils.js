// ============================================================
// 역할: 날짜, 섞기, 오늘의 학습 진행률 등 "계산"만 하는 함수 모음
// (화면 코드와 분리해 두면 컴포넌트가 짧고 읽기 쉬워집니다.)
// ============================================================

// 오늘의 학습 목표 개수
export const TODAY_COUNTS = { terms: 5, quiz: 5, practical: 1, note: 1 };

/** 오늘 날짜를 'YYYY-MM-DD' 글자로 만들기 (사용자 컴퓨터 시간 기준) */
export function getTodayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** 날짜 글자('YYYY-MM-DD')를 "몇 번째 날"인 숫자로 바꾸기 (매일 1씩 늘어남) */
export function getDayNumber(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/** ISO 시간 글자를 '11/26 10:30' 처럼 짧게 보여 주기 */
export function formatDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 초를 '12:05' 처럼 분:초 글자로 바꾸기 (한 시간이 넘으면 '1:05:30') */
export function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** 배열을 무작위로 섞은 "새 배열" 만들기 (Fisher-Yates 방식) */
export function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 날짜를 기준으로 "오늘 공부할 항목" 고르기
 *  - 같은 날에는 언제 열어도 같은 항목, 다음 날에는 다음 항목들이 나옵니다.
 *  - 목록 끝에 닿으면 처음으로 돌아갑니다.
 */
export function pickByDate(list, count, dateString) {
  if (list.length === 0) return [];
  const start = (getDayNumber(dateString) * count) % list.length;
  const size = Math.min(count, list.length);
  return Array.from({ length: size }, (_, i) => list[(start + i) % list.length]);
}

/**
 * 오늘의 학습 진행률 계산
 *   today = { terms: [id...], quiz: { 문제id: 고른번호 }, practical: true/false, note: true/false }
 */
export function calcTodayProgress(today) {
  const parts = [
    { key: 'terms', label: '오늘의 용어', done: today.terms.length, total: TODAY_COUNTS.terms },
    { key: 'quiz', label: '필기 미니 퀴즈', done: Object.keys(today.quiz).length, total: TODAY_COUNTS.quiz },
    { key: 'practical', label: '오늘의 실기 문제', done: today.practical ? 1 : 0, total: TODAY_COUNTS.practical },
    { key: 'note', label: '오늘의 요약노트', done: today.note ? 1 : 0, total: TODAY_COUNTS.note },
  ];
  const done = parts.reduce((sum, part) => sum + Math.min(part.done, part.total), 0);
  const total = parts.reduce((sum, part) => sum + part.total, 0);
  return { parts, done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
