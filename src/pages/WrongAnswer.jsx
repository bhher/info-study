// ============================================================
// 역할: 오답노트 페이지 (/wrong)
//   - 모의고사, 필기·단답형 문제 풀이, 오늘의 미니 퀴즈에서 틀린 문제가 자동으로 모입니다.
//     (localStorage 에 저장되어 새로고침해도 유지)
//   - 문제마다 정답 확인 / 해설 확인 / 다시 풀기 / 해결 체크 / 누적 오답 횟수
//   - 필터: 전체 / 미해결 / 해결, 문제 종류(객관식·단답형)
// ============================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QUESTION_MAP } from '../data/examData';
import { useStudy } from '../context/StudyContext';
import WrongAnswerCard from '../components/WrongAnswerCard';
import ProgressBar from '../components/ProgressBar';

const PAGE_SIZE = 10;

function WrongAnswer() {
  const { wrongNotes, setWrongSolved } = useStudy();
  const [filter, setFilter] = useState('unsolved'); // 'all' | 'unsolved' | 'solved'
  const [type, setType] = useState('all'); // 'all' | 'choice' | 'short'
  const [limit, setLimit] = useState(PAGE_SIZE);

  // { 문제id: note } → [{ question, note }] 로 바꾸고 최근에 틀린 순으로 정렬
  const entries = Object.entries(wrongNotes)
    .map(([questionId, note]) => ({ question: QUESTION_MAP[questionId], note }))
    .filter((entry) => entry.question) // 문제 데이터가 사라진 기록은 제외
    .sort((a, b) => new Date(b.note.lastWrongAt) - new Date(a.note.lastWrongAt));

  const total = entries.length;
  const solvedCount = entries.filter((entry) => entry.note.solved).length;
  const unsolvedCount = total - solvedCount;

  const visible = entries.filter((entry) => {
    if (type !== 'all' && entry.question.type !== type) return false;
    if (filter === 'unsolved') return !entry.note.solved;
    if (filter === 'solved') return entry.note.solved;
    return true;
  });

  // 필터를 바꾸면 "더 보기" 개수를 처음으로
  function changeFilter(value) {
    setFilter(value);
    setLimit(PAGE_SIZE);
  }
  function changeType(value) {
    setType(value);
    setLimit(PAGE_SIZE);
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>오답노트</h1>
        <p className="muted">틀린 문제를 다시 풀고, 해결하면 체크해 보세요.</p>
      </div>

      {total === 0 ? (
        <div className="empty-box">
          <p>아직 오답이 없어요. 문제를 풀다가 틀리면 여기에 자동으로 저장돼요.</p>
          <div className="btn-row">
            <Link className="btn btn-primary" to="/exam">
              모의고사 풀러 가기
            </Link>
            <Link className="btn btn-ghost" to="/written">
              필기 문제 풀기
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="panel">
            <ul className="info-grid">
              <li>
                <span>전체 오답</span>
                <strong>{total}개</strong>
              </li>
              <li>
                <span>미해결</span>
                <strong className="text-ng">{unsolvedCount}개</strong>
              </li>
              <li>
                <span>해결</span>
                <strong className="text-ok">{solvedCount}개</strong>
              </li>
            </ul>
            <ProgressBar value={(solvedCount / total) * 100} label="오답 해결 진행률" tone="green" />
          </section>

          <div className="toolbar">
            <div className="seg">
              <button className={filter === 'unsolved' ? 'seg-btn active' : 'seg-btn'} onClick={() => changeFilter('unsolved')}>
                미해결 {unsolvedCount}
              </button>
              <button className={filter === 'solved' ? 'seg-btn active' : 'seg-btn'} onClick={() => changeFilter('solved')}>
                해결 {solvedCount}
              </button>
              <button className={filter === 'all' ? 'seg-btn active' : 'seg-btn'} onClick={() => changeFilter('all')}>
                전체 {total}
              </button>
            </div>
            <div className="seg">
              <button className={type === 'all' ? 'seg-btn active' : 'seg-btn'} onClick={() => changeType('all')}>
                모든 유형
              </button>
              <button className={type === 'choice' ? 'seg-btn active' : 'seg-btn'} onClick={() => changeType('choice')}>
                객관식
              </button>
              <button className={type === 'short' ? 'seg-btn active' : 'seg-btn'} onClick={() => changeType('short')}>
                단답형
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="empty-box">
              {filter === 'unsolved' ? '🎉 미해결 오답이 없어요. 모두 해결했어요!' : '해당하는 오답이 없어요.'}
            </p>
          ) : (
            <>
              <div className="wrong-list">
                {visible.slice(0, limit).map(({ question, note }) => (
                  <WrongAnswerCard
                    key={question.id}
                    question={question}
                    note={note}
                    onSolvedChange={(solved) => setWrongSolved(question.id, solved)}
                  />
                ))}
              </div>
              {limit < visible.length && (
                <p className="center-text">
                  <button className="btn btn-ghost" onClick={() => setLimit(limit + PAGE_SIZE)}>
                    더 보기 ({Math.min(limit, visible.length)} / {visible.length})
                  </button>
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default WrongAnswer;
