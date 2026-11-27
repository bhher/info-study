// ============================================================
// 역할: 필기·SQLD 문제 풀이 페이지 (/written)
//   정보처리기사 필기 80문제(5과목) + SQLD 50문제(2과목)를 과목별로 연습합니다.
//   (화면 틀은 PracticePage 가 담당하고, 이 파일은 "어떤 문제를 어떤 분류로 보여 줄지"만 정합니다.)
// ============================================================
import { CHOICE_QUESTIONS, SQLD_SUBJECTS, WRITTEN_SUBJECTS } from '../data/choiceData';
import PracticePage from '../components/PracticePage';

// 사이드바 분류: 필기 전체, 필기 과목들, SQLD 전체, SQLD 과목들
const isWritten = (q) => q.id.startsWith('w');
const isSqld = (q) => q.id.startsWith('d');

const GROUPS = [
  { value: 'all', label: '전체 (필기 + SQLD)', filter: () => true },
  { value: 'written', label: '📘 정보처리기사 필기 전체', filter: isWritten },
  ...WRITTEN_SUBJECTS.map((subject) => ({
    value: `w:${subject}`,
    label: `　${subject}`,
    filter: (q) => isWritten(q) && q.category === subject,
  })),
  { value: 'sqld', label: '🗄 SQLD 전체', filter: isSqld },
  ...SQLD_SUBJECTS.map((subject) => ({
    value: `d:${subject}`,
    label: `　${subject}`,
    filter: (q) => isSqld(q) && q.category === subject,
  })),
];

function Written() {
  return (
    <PracticePage
      title="필기·SQLD 문제 풀이"
      description="과목을 골라 객관식 문제를 풀고, 바로 정답과 해설을 확인해요."
      questions={CHOICE_QUESTIONS}
      groupTitle="과목 선택"
      groups={GROUPS}
    />
  );
}

export default Written;
