// ============================================================
// 역할: 실기 기출 페이지 (/practical)
//   - 2020~2025년 실기 복원문제, Java·Python 문제 모음, 코딩 연습 과제를 한곳에 모았습니다.
//   - 분류(Java, C언어, SQL, 보안 ...) / 회차 / 검색 / 즐겨찾기 / 이해 못한 것만 보기
//   - 문제를 펼쳐서 스스로 풀어 본 뒤 [정답 확인] → [이해 완료]
// ============================================================
import { useMemo, useState } from 'react';
import { PRACTICAL_CATEGORIES, PRACTICAL_EXAMS, PRACTICAL_LIST } from '../data/practicalData';
import { useStudy } from '../context/StudyContext';
import PracticalCard from '../components/PracticalCard';
import Sidebar from '../components/Sidebar';
import ProgressBar from '../components/ProgressBar';

const FAVORITE_KEY = '__favorite__';
const PAGE_SIZE = 12;

/** 문제 목록 - 필터가 바뀌면 key 가 바뀌어 "더 보기" 개수가 처음으로 돌아갑니다. */
function PracticalList({ items, donePractical, favoritePractical, onToggleDone, onToggleFavorite }) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const visible = items.slice(0, limit);

  return (
    <>
      <div className="practical-list">
        {visible.map((item) => (
          <PracticalCard
            key={item.id}
            item={item}
            done={donePractical.includes(item.id)}
            favorite={favoritePractical.includes(item.id)}
            onToggleDone={() => onToggleDone(item)}
            onToggleFavorite={() => onToggleFavorite(item.id)}
          />
        ))}
      </div>
      {limit < items.length && (
        <p className="center-text">
          <button className="btn btn-ghost" onClick={() => setLimit(limit + PAGE_SIZE)}>
            더 보기 ({visible.length} / {items.length})
          </button>
        </p>
      )}
    </>
  );
}

function Practical() {
  const { donePractical, favoritePractical, togglePractical, toggleFavoritePractical } = useStudy();

  const [category, setCategory] = useState('전체');
  const [exam, setExam] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [onlyTodo, setOnlyTodo] = useState(false);

  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return PRACTICAL_LIST.filter((item) => {
      if (category === FAVORITE_KEY && !favoritePractical.includes(item.id)) return false;
      if (category !== '전체' && category !== FAVORITE_KEY && item.category !== category) return false;
      if (exam !== '전체' && item.exam !== exam) return false;
      if (onlyTodo && donePractical.includes(item.id)) return false;
      if (!text) return true;
      return (
        item.title.toLowerCase().includes(text) ||
        item.question.toLowerCase().includes(text) ||
        item.answer.toLowerCase().includes(text)
      );
    });
  }, [category, exam, keyword, onlyTodo, donePractical, favoritePractical]);

  const categoryItems = [
    { value: '전체', label: '전체', count: PRACTICAL_LIST.length },
    ...PRACTICAL_CATEGORIES.map((name) => ({
      value: name,
      label: name,
      count: PRACTICAL_LIST.filter((item) => item.category === name).length,
    })),
    { value: FAVORITE_KEY, label: '★ 다시 볼 문제', count: favoritePractical.length },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <h1>실기 기출</h1>
        <p className="muted">
          전체 {PRACTICAL_LIST.length}문제 · 이해 완료 {donePractical.length}개 · 다시 볼 문제 {favoritePractical.length}개
        </p>
      </div>
      <ProgressBar value={(donePractical.length / PRACTICAL_LIST.length) * 100} label="실기 기출 이해 진행률" tone="green" />

      <div className="study-layout">
        <Sidebar title="분류" items={categoryItems} selected={category} onSelect={setCategory}>
          <label className="check-label side-check">
            <input type="checkbox" checked={onlyTodo} onChange={(e) => setOnlyTodo(e.target.checked)} />
            이해 못 한 것만 보기
          </label>
        </Sidebar>

        <section className="study-main">
          <div className="toolbar">
            <input
              type="search"
              className="search-input"
              placeholder="제목, 문제 내용으로 검색 (예: 상속, SELECT, 해시)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="실기 문제 검색"
            />
            <select className="select" value={exam} onChange={(e) => setExam(e.target.value)} aria-label="회차 선택">
              <option value="전체">회차: 전체</option>
              {PRACTICAL_EXAMS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <p className="muted small result-count">검색 결과 {filtered.length}문제</p>

          {filtered.length === 0 ? (
            <p className="empty-box">
              {category === FAVORITE_KEY
                ? '다시 볼 문제가 없어요. 문제 제목 옆의 ☆ 를 눌러 표시해 보세요.'
                : '조건에 맞는 문제가 없어요. 검색어나 필터를 바꿔 보세요.'}
            </p>
          ) : (
            <PracticalList
              key={`${category}|${exam}|${keyword}|${onlyTodo}`}
              items={filtered}
              donePractical={donePractical}
              favoritePractical={favoritePractical}
              onToggleDone={(item) => togglePractical(item.id, item.title)}
              onToggleFavorite={toggleFavoritePractical}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default Practical;
