// ============================================================
// 역할: 여러 화면이 함께 쓰는 "학습 기록"을 한곳에서 관리합니다. (전역 상태)
//
//  저장하는 기록 (모두 localStorage 에 저장 → 새로고침해도 유지)
//   - memorizedTerms / favoriteTerms : 암기 완료 / 즐겨찾기한 용어 id 목록
//   - donePractical / favoritePractical : 이해 완료 / 다시 볼 실기 기출 문제 id 목록
//   - readNotes     : 읽은 요약노트 id 목록
//   - wrongNotes    : 오답노트 { 문제id: { count, solved, lastWrongAt } }
//   - examHistory   : 모의고사 결과 목록 (최근 20회)
//   - activities    : 최근 학습 기록 (최근 30개)
//   - today         : 오늘의 학습 진행 상황 (날짜가 바뀌면 자동으로 새로 시작)
//
//  사용법: 어느 컴포넌트에서든
//     const { memorizedTerms, toggleTerm } = useStudy();
// ============================================================
import { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { getTodayString } from '../utils/studyUtils';

const StudyContext = createContext(null);

const isArray = (value) => Array.isArray(value);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// 오늘의 학습 처음 상태
function createToday() {
  return { date: getTodayString(), terms: [], quiz: {}, practical: false, note: false };
}
const isTodayShape = (value) => isObject(value) && isArray(value.terms) && isObject(value.quiz);

// 목록에 id 가 있으면 빼고, 없으면 더한 "새 배열"
function toggleInList(list, id) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

/**
 * 문제별 채점 결과(details)를 오답노트에 반영한 "새 오답노트" 만들기
 *  details = [{ questionId, isCorrect }]
 *   - 틀린 문제  : 누적 오답 횟수 +1, "미해결"로 표시
 *   - 맞힌 문제  : 예전에 틀렸던 문제라면 "해결"로 표시
 */
function applyToWrongNotes(prev, details, takenAt) {
  const next = { ...prev };
  details.forEach((detail) => {
    const old = next[detail.questionId];
    if (detail.isCorrect) {
      if (old) next[detail.questionId] = { ...old, solved: true };
    } else {
      next[detail.questionId] = {
        count: (old ? old.count : 0) + 1,
        solved: false,
        lastWrongAt: takenAt,
      };
    }
  });
  return next;
}

export function StudyProvider({ children }) {
  const [memorizedTerms, setMemorizedTerms] = useLocalStorage('info_memorized_terms', [], isArray);
  const [favoriteTerms, setFavoriteTerms] = useLocalStorage('info_favorite_terms', [], isArray);
  const [donePractical, setDonePractical] = useLocalStorage('info_done_practical', [], isArray);
  const [favoritePractical, setFavoritePractical] = useLocalStorage('info_favorite_practical', [], isArray);
  const [readNotes, setReadNotes] = useLocalStorage('info_read_notes', [], isArray);
  const [wrongNotes, setWrongNotes] = useLocalStorage('info_wrong_notes', {}, isObject);
  const [examHistory, setExamHistory] = useLocalStorage('info_exam_history', [], isArray);
  const [activities, setActivities] = useLocalStorage('info_activities', [], isArray);
  const [todayRaw, setTodayRaw] = useLocalStorage('info_today', createToday(), isTodayShape);

  // 저장된 오늘의 학습이 어제 것이면 새로 시작
  const today = todayRaw.date === getTodayString() ? todayRaw : createToday();

  // ---------- 최근 학습 기록 ----------
  function addActivity(type, text) {
    const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, text, at: new Date().toISOString() };
    setActivities((prev) => [item, ...prev].slice(0, 30));
  }

  // ---------- 암기 완료 / 즐겨찾기 ----------
  // label : 기록에 남길 이름 (예: 'DoS')
  function toggleTerm(id, label) {
    if (!memorizedTerms.includes(id)) addActivity('term', `용어 ${label} 암기 완료`);
    setMemorizedTerms(toggleInList(memorizedTerms, id));
  }

  function toggleFavoriteTerm(id) {
    setFavoriteTerms(toggleInList(favoriteTerms, id));
  }

  function togglePractical(id, label) {
    if (!donePractical.includes(id)) addActivity('practical', `실기 문제 '${label}' 이해 완료`);
    setDonePractical(toggleInList(donePractical, id));
  }

  function toggleFavoritePractical(id) {
    setFavoritePractical(toggleInList(favoritePractical, id));
  }

  function toggleNoteRead(id, label) {
    if (!readNotes.includes(id)) addActivity('note', `요약노트 '${label}' 읽기 완료`);
    setReadNotes(toggleInList(readNotes, id));
  }

  // ---------- 모의고사 결과 저장 + 오답노트 자동 저장 ----------
  function submitExamResult(result) {
    setExamHistory((prev) => [result, ...prev].slice(0, 20));
    setWrongNotes((prev) => applyToWrongNotes(prev, result.details, result.takenAt));
    addActivity('exam', `${result.examTitle} 응시: ${result.score}점 (${result.correctCount}/${result.totalCount}문제 정답)`);
  }

  // ---------- 문제 풀이(필기/단답형 연습) 결과 저장 ----------
  function recordPractice(label, details) {
    const correct = details.filter((d) => d.isCorrect).length;
    setWrongNotes((prev) => applyToWrongNotes(prev, details, new Date().toISOString()));
    addActivity('quiz', `${label}: ${correct}/${details.length}문제 정답`);
  }

  // ---------- 오답노트 ----------
  function setWrongSolved(questionId, solved) {
    setWrongNotes((prev) => (prev[questionId] ? { ...prev, [questionId]: { ...prev[questionId], solved } } : prev));
  }

  // ---------- 오늘의 학습 ----------
  function toggleTodayTerm(id, label) {
    if (!today.terms.includes(id)) addActivity('today', `오늘의 용어 ${label} 학습 완료`);
    setTodayRaw({ ...today, terms: toggleInList(today.terms, id) });
  }

  function toggleTodayPractical(label) {
    if (!today.practical) addActivity('today', `오늘의 실기 문제 '${label}' 학습 완료`);
    setTodayRaw({ ...today, practical: !today.practical });
  }

  function toggleTodayNote(label) {
    if (!today.note) addActivity('today', `오늘의 요약노트 '${label}' 학습 완료`);
    setTodayRaw({ ...today, note: !today.note });
  }

  // 미니 퀴즈 답 선택: 한 번 고른 답은 바꾸지 않습니다. (틀리면 오답노트에도 저장)
  function answerTodayQuiz(question, choiceIndex) {
    if (today.quiz[question.id] !== undefined) return;
    setTodayRaw({ ...today, quiz: { ...today.quiz, [question.id]: choiceIndex } });
    setWrongNotes((prev) =>
      applyToWrongNotes(prev, [{ questionId: question.id, isCorrect: choiceIndex === question.answer }], new Date().toISOString())
    );
  }

  const value = {
    memorizedTerms,
    favoriteTerms,
    donePractical,
    favoritePractical,
    readNotes,
    wrongNotes,
    examHistory,
    activities,
    today,
    addActivity,
    toggleTerm,
    toggleFavoriteTerm,
    togglePractical,
    toggleFavoritePractical,
    toggleNoteRead,
    submitExamResult,
    recordPractice,
    setWrongSolved,
    toggleTodayTerm,
    toggleTodayPractical,
    toggleTodayNote,
    answerTodayQuiz,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

/** 학습 기록과 기록 함수를 꺼내 쓰는 훅 */
export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error('useStudy 는 StudyProvider 안에서만 사용할 수 있습니다.');
  return context;
}
