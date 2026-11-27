// ============================================================
// 역할: 문제 채점에 관한 함수 모음 (모의고사, 단답형 연습, 오답노트가 함께 사용)
//
//  - 객관식 : 고른 보기 번호와 정답 번호를 비교합니다.
//  - 주관식 : 공백, 마침표, 대소문자 같은 "불필요한 입력 차이"를 없앤 뒤 정답과 비교합니다.
//             정답은 "묶음(keywords)"으로 되어 있어서
//               · 묶음 안의 한글/영문 표현 중 하나만 써도 인정하고
//               · 정답이 여러 개(예: 구문, 의미, 타이밍)면 묶음마다 하나씩 모두 들어 있어야 정답입니다.
//             ("3가지 이상" 같은 문제는 minMatch 개수만큼만 맞혀도 정답)
// ============================================================

// 보기 번호 표시 (0 → ①, 1 → ②, ...)
export const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤'];

/**
 * 입력한 글자를 비교하기 좋게 다듬기
 *  - 글자 모양을 통일(normalize), 영어는 소문자로
 *  - 공백과 문장 부호(. , ! ? ~ · 따옴표 괄호 하이픈 등) 제거
 *  예) ' Smurf Attack. ' → 'smurfattack'
 */
export function normalizeAnswer(text) {
  return String(text ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s.,!?~·:;'"“”‘’()[\]{}<>\-_/\\]/g, '');
}

/** 점수를 보기 좋게 (78.75 → '78.75', 80 → '80') : 소수점 둘째 자리까지만 */
export function formatScore(value) {
  return String(Math.round(value * 100) / 100);
}

/** 답을 입력(선택)했는지 확인 */
export function isAnswered(question, value) {
  if (question.type === 'choice') return typeof value === 'number';
  return normalizeAnswer(value) !== '';
}

/** 묶음(여러 표현 중 하나) 안의 표현이 입력에 들어 있는지 */
function groupMatches(group, input) {
  return group.some((word) => {
    const w = normalizeAnswer(word);
    return w.length > 0 && input.includes(w);
  });
}

/** 한 문제 채점: 맞으면 true */
export function checkAnswer(question, value) {
  if (!isAnswered(question, value)) return false;

  // 객관식: 번호 비교
  if (question.type === 'choice') return value === question.answer;

  // 주관식 1) 정답 글자 전체가 똑같은가?
  const input = normalizeAnswer(value);
  if (question.answers.some((answer) => normalizeAnswer(answer) === input)) return true;

  // 주관식 2) 핵심 낱말 묶음이 (필요한 개수만큼) 들어 있는가?
  const groups = question.keywords || [];
  if (groups.length > 0) {
    const need = question.minMatch ?? groups.length;
    const matched = groups.filter((group) => groupMatches(group, input)).length;
    if (matched >= need) return true;

    // 정답이 하나뿐일 때는 긴 정답의 대부분(60% 이상)을 쓴 경우도 인정 (예: '스머프' → '스머프 공격')
    if (groups.length === 1) {
      return groups[0].some((word) => {
        const w = normalizeAnswer(word);
        return w.length >= 3 && input.length >= Math.max(3, Math.ceil(w.length * 0.6)) && w.includes(input);
      });
    }
  }
  return false;
}

/** 문제의 대표 정답을 글자로 (결과 화면, 오답노트에서 사용) */
export function getCorrectAnswerText(question) {
  if (question.type === 'choice') return `${CIRCLED_NUMBERS[question.answer]} ${question.options[question.answer]}`;
  return question.answerText;
}

/** 학생이 낸 답을 글자로 (결과 화면, 오답노트에서 사용) */
export function getUserAnswerText(question, value) {
  if (!isAnswered(question, value)) return '(미응답)';
  if (question.type === 'choice') return `${CIRCLED_NUMBERS[value]} ${question.options[value]}`;
  return String(value).trim();
}

/** 문제 종류 이름 (객관식 4지선다형 / 5지선다형 / 주관식) */
export function getQuestionFormat(question) {
  if (question.type === 'short') return '주관식(단답형)';
  return `객관식 ${question.options.length}지선다형`;
}

/**
 * 시험 전체 채점
 *   questions : 시험 문제 배열 (각 문제에 points 가 있어야 함)
 *   answers   : { 문제id: 고른 번호 또는 입력한 글자 }
 *   meta      : { examId, examTitle, limitMin, usedSec }
 * 돌려주는 값: 점수, 맞힌/틀린/미응답 개수, 정답률, 문제별 채점 결과(details)
 */
export function gradeExam(questions, answers, meta) {
  const details = questions.map((question) => {
    const value = answers[question.id];
    const answered = isAnswered(question, value);
    const isCorrect = answered && checkAnswer(question, value);
    return {
      questionId: question.id,
      userAnswer: answered ? value : null,
      answered,
      isCorrect,
      points: question.points,
      earned: isCorrect ? question.points : 0,
    };
  });

  const total = questions.length;
  const correctCount = details.filter((d) => d.isCorrect).length;
  const unansweredCount = details.filter((d) => !d.answered).length;
  const round2 = (n) => Math.round(n * 100) / 100;

  return {
    id: `r${Date.now()}`,
    examId: meta.examId,
    examTitle: meta.examTitle,
    takenAt: new Date().toISOString(),
    limitMin: meta.limitMin,
    usedSec: meta.usedSec,
    score: round2(details.reduce((sum, d) => sum + d.earned, 0)),
    totalPoints: round2(questions.reduce((sum, q) => sum + q.points, 0)),
    totalCount: total,
    correctCount,
    wrongCount: total - correctCount, // 미응답도 틀린 문제로 셉니다.
    unansweredCount,
    rate: total === 0 ? 0 : Math.round((correctCount / total) * 100),
    details,
  };
}
