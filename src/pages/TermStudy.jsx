// ============================================================
// 역할: 용어 암기 페이지 (/terms)
//   - 단답형 100제 + IT용어 문제를 "설명 → 용어" 카드로 외웁니다. (총 300여 개)
//   - 분류 필터(사이드바) + 즐겨찾기 모아 보기 + 검색 + 출처 선택
//   - "정답 가리기" 스위치: 정답을 가리고 [정답 확인]으로 스스로 점검
//   - 카드에서 암기 완료 / 즐겨찾기 / 해설 보기(팝업)
// ============================================================
import { useCallback, useMemo, useState } from 'react';
import { SHORT_QUESTIONS, SHORT_CATEGORIES } from '../data/shortData';
import { useStudy } from '../context/StudyContext';
import TermCard from '../components/TermCard';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';
import Markdown from '../components/Markdown';

const FAVORITE_KEY = '__favorite__'; // 사이드바의 "즐겨찾기" 항목을 구분하는 값
const PAGE_SIZE = 24; // 한 번에 보여 줄 카드 수

// 출처 목록 (선택 상자용)
const SOURCES = ['전체', ...new Set(SHORT_QUESTIONS.map((q) => q.source.split(' · ')[0]))];

/** 카드 목록 - 필터가 바뀌면 key 가 바뀌어 "더 보기" 개수가 처음으로 돌아갑니다. */
function TermList({ items, hideAnswer, hideVersion, memorizedTerms, favoriteTerms, onToggleMemorized, onToggleFavorite, onDetail }) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const visible = items.slice(0, limit);

  return (
    <>
      <div className="term-grid">
        {visible.map((item) => (
          <TermCard
            key={`${item.id}-${hideVersion}`}
            term={item}
            hideAnswer={hideAnswer}
            memorized={memorizedTerms.includes(item.id)}
            favorite={favoriteTerms.includes(item.id)}
            onToggleMemorized={() => onToggleMemorized(item)}
            onToggleFavorite={() => onToggleFavorite(item.id)}
            onDetail={() => onDetail(item.id)}
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

function TermStudy() {
  const { memorizedTerms, favoriteTerms, toggleTerm, toggleFavoriteTerm } = useStudy();

  const [category, setCategory] = useState('전체');
  const [source, setSource] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [hideAnswer, setHideAnswer] = useState(true);
  const [hideVersion, setHideVersion] = useState(0); // 가리기를 켜고 끌 때마다 카드를 새로 만들어 "정답 확인" 상태를 초기화
  const [onlyTodo, setOnlyTodo] = useState(false);
  const [detailId, setDetailId] = useState(null); // 해설 팝업으로 보고 있는 용어 id

  // ---------- 필터링 ----------
  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return SHORT_QUESTIONS.filter((item) => {
      if (category === FAVORITE_KEY && !favoriteTerms.includes(item.id)) return false;
      if (category !== '전체' && category !== FAVORITE_KEY && item.category !== category) return false;
      if (source !== '전체' && !item.source.startsWith(source)) return false;
      if (onlyTodo && memorizedTerms.includes(item.id)) return false;
      if (!text) return true;
      return (
        item.question.toLowerCase().includes(text) ||
        (item.passage || '').toLowerCase().includes(text) ||
        item.answerText.toLowerCase().includes(text) ||
        item.explanation.toLowerCase().includes(text)
      );
    });
  }, [category, source, keyword, onlyTodo, favoriteTerms, memorizedTerms]);

  // 사이드바 항목
  const categoryItems = [
    { value: '전체', label: '전체', count: SHORT_QUESTIONS.length },
    ...SHORT_CATEGORIES.map((name) => ({
      value: name,
      label: name,
      count: SHORT_QUESTIONS.filter((item) => item.category === name).length,
    })),
    { value: FAVORITE_KEY, label: '★ 즐겨찾기', count: favoriteTerms.length },
  ];

  function toggleHide() {
    setHideAnswer(!hideAnswer);
    setHideVersion(hideVersion + 1);
  }

  const closeDetail = useCallback(() => setDetailId(null), []);
  const detail = detailId ? SHORT_QUESTIONS.find((item) => item.id === detailId) : null;
  const filterSignature = `${category}|${source}|${keyword}|${onlyTodo}`;

  return (
    <div className="page">
      <div className="page-head">
        <h1>용어 암기</h1>
        <p className="muted">
          전체 용어 {SHORT_QUESTIONS.length}개 · 암기 완료 {memorizedTerms.length}개 · 즐겨찾기 {favoriteTerms.length}개
        </p>
      </div>
      <ProgressBar value={(memorizedTerms.length / SHORT_QUESTIONS.length) * 100} label="용어 암기 진행률" tone="green" />

      <div className="study-layout">
        <Sidebar title="분류" items={categoryItems} selected={category} onSelect={setCategory}>
          <label className="check-label side-check">
            <input type="checkbox" checked={onlyTodo} onChange={(e) => setOnlyTodo(e.target.checked)} />
            암기 못 한 것만 보기
          </label>
        </Sidebar>

        <section className="study-main">
          <div className="toolbar">
            <input
              type="search"
              className="search-input"
              placeholder="용어, 설명으로 검색 (예: DoS, 정규화, 프로토콜)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="용어 검색"
            />
            <select className="select" value={source} onChange={(e) => setSource(e.target.value)} aria-label="출처 선택">
              {SOURCES.map((name) => (
                <option key={name} value={name}>
                  {name === '전체' ? '출처: 전체' : name}
                </option>
              ))}
            </select>
            <label className={hideAnswer ? 'switch on' : 'switch'}>
              <input type="checkbox" checked={hideAnswer} onChange={toggleHide} />
              <span className="switch-track">
                <span className="switch-knob" />
              </span>
              정답 가리기
            </label>
          </div>

          <p className="muted small result-count">검색 결과 {filtered.length}개</p>

          {filtered.length === 0 ? (
            <p className="empty-box">
              {category === FAVORITE_KEY
                ? '즐겨찾기한 용어가 없어요. 카드의 ☆ 를 눌러 추가해 보세요.'
                : '조건에 맞는 용어가 없어요. 검색어나 필터를 바꿔 보세요.'}
            </p>
          ) : (
            <TermList
              key={`${filterSignature}|${hideVersion}`}
              items={filtered}
              hideAnswer={hideAnswer}
              hideVersion={hideVersion}
              memorizedTerms={memorizedTerms}
              favoriteTerms={favoriteTerms}
              onToggleMemorized={(item) => toggleTerm(item.id, item.answerText.split(/[([]/)[0].trim())}
              onToggleFavorite={toggleFavoriteTerm}
              onDetail={setDetailId}
            />
          )}
        </section>
      </div>

      {/* 해설 보기 팝업 */}
      {detail && (
        <Modal
          title="용어 해설"
          onClose={closeDetail}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => toggleFavoriteTerm(detail.id)}>
                {favoriteTerms.includes(detail.id) ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기'}
              </button>
              <button
                className={memorizedTerms.includes(detail.id) ? 'btn btn-done' : 'btn btn-primary'}
                onClick={() => toggleTerm(detail.id, detail.answerText.split(/[([]/)[0].trim())}
              >
                {memorizedTerms.includes(detail.id) ? '✔ 암기 완료' : '암기 완료'}
              </button>
            </>
          }
        >
          <div className="detail-top">
            <div className="chip-row center">
              <span className="chip">{detail.category}</span>
              <span className="chip">{detail.source}</span>
            </div>
            <p className="detail-q">
              <Markdown inline text={detail.passage ?? detail.question} />
            </p>
            <div className="detail-term">
              <Markdown inline text={detail.answerText} />
            </div>
          </div>
          <div className="detail-explain">
            <h3 className="sub-title">해설</h3>
            <Markdown text={detail.explanation} />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default TermStudy;
