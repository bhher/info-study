// ============================================================
// 역할: 단답형 문제 풀이 페이지 (/short)
//   실기 단답형 100제 + IT용어 문제를 "직접 입력"해서 풀고, 바로 채점 + 해설을 봅니다.
//   (화면 틀은 PracticePage 가 담당하고, 이 파일은 "어떤 문제를 어떤 분류로 보여 줄지"만 정합니다.)
// ============================================================
import { SHORT_CATEGORIES, SHORT_QUESTIONS } from '../data/shortData';
import PracticePage from '../components/PracticePage';

const GROUPS = [
  { value: 'all', label: '전체', filter: () => true },
  { value: 'src:단답형 100제', label: '📝 단답형 100제', filter: (q) => q.source.startsWith('단답형 100제') },
  { value: 'src:IT용어', label: '💡 IT용어 문제', filter: (q) => q.source.startsWith('IT용어') },
  { value: 'src:네트워크', label: '🌐 네트워크 예상문제', filter: (q) => q.source.startsWith('네트워크') },
  ...SHORT_CATEGORIES.map((name) => ({
    value: `cat:${name}`,
    label: `　${name}`,
    filter: (q) => q.category === name,
  })),
];

function Short() {
  return (
    <PracticePage
      title="단답형 문제 풀이"
      description="실기 단답형 문제를 직접 입력해서 풀어요. 한글 이름이나 영문 약어 모두 정답으로 인정돼요."
      questions={SHORT_QUESTIONS}
      groupTitle="문제 묶음 / 분류"
      groups={GROUPS}
    />
  );
}

export default Short;
