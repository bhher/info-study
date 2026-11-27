// ============================================================
// 역할: 홈 페이지 (/)  - 학습 현황을 한눈에 보는 대시보드
//   - 오늘의 용어 / 오늘의 학습 목표(진행률)
//   - 용어·실기 기출·요약노트 학습 현황 통계
//   - 모의고사 풀이 현황, 최근 학습 기록
//   - 오늘의 추천 문제 (바로 풀어 볼 수 있음)
// ============================================================
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SHORT_QUESTIONS } from '../data/shortData';
import { CHOICE_QUESTIONS } from '../data/choiceData';
import { PRACTICAL_LIST } from '../data/practicalData';
import { NOTE_LIST } from '../data/noteData';
import { QUESTION_MAP } from '../data/examData';
import { useStudy } from '../context/StudyContext';
import { formatScore } from '../utils/examUtils';
import { calcTodayProgress, formatDateTime, getTodayString, pickByDate } from '../utils/studyUtils';
import ProgressBar from '../components/ProgressBar';
import QuizCard from '../components/QuizCard';
import TermCard from '../components/TermCard';

// 기록 종류별 아이콘
const ACTIVITY_ICONS = { term: '📖', practical: '💻', note: '📄', quiz: '✏️', exam: '📝', today: '📅' };

function Home() {
  const { memorizedTerms, favoriteTerms, donePractical, readNotes, wrongNotes, examHistory, activities, today, toggleTerm, toggleFavoriteTerm } =
    useStudy();
  const [pickedChoice, setPickedChoice] = useState(undefined); // 추천 문제에서 고른 보기

  const dateString = getTodayString();
  const todayTerm = useMemo(() => pickByDate(SHORT_QUESTIONS, 1, dateString)[0], [dateString]);
  const recommended = useMemo(() => pickByDate(CHOICE_QUESTIONS, 1, dateString)[0], [dateString]);

  const progress = calcTodayProgress(today);

  // ---------- 시험 현황 계산 ----------
  const examCount = examHistory.length;
  const bestScore = examCount ? Math.max(...examHistory.map((r) => r.score)) : null;
  const latest = examHistory[0]; // 가장 최근 결과가 맨 앞에 저장됩니다.
  const unsolvedWrong = Object.entries(wrongNotes).filter(([id, note]) => QUESTION_MAP[id] && !note.solved).length;

  return (
    <div className="page">
      {/* 환영 영역 */}
      <section className="hero">
        <div>
          <p className="hero-sub">정보처리기사 필기 · 실기 · SQLD 대비</p>
          <h1>오늘도 한 걸음씩, 합격에 가까워져요</h1>
          <p className="hero-desc">
            용어 암기, 단답형·필기 문제 풀이, 실기 기출, 모의고사와 오답노트로 합격 실력을 만들어 보세요.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-light" to="/today">
              📅 오늘의 학습 시작
            </Link>
            <Link className="btn btn-outline-light" to="/exam">
              📝 모의고사 풀기
            </Link>
          </div>
        </div>
      </section>

      <div className="home-grid">
        {/* 오늘의 용어 */}
        <section className="panel">
          <h2 className="panel-title">오늘의 용어</h2>
          {todayTerm && (
            <TermCard
              term={todayTerm}
              hideAnswer
              memorized={memorizedTerms.includes(todayTerm.id)}
              favorite={favoriteTerms.includes(todayTerm.id)}
              onToggleMemorized={() => toggleTerm(todayTerm.id, todayTerm.answerText.split(/[([]/)[0].trim())}
              onToggleFavorite={() => toggleFavoriteTerm(todayTerm.id)}
            />
          )}
        </section>

        {/* 오늘의 학습 목표 */}
        <section className="panel">
          <h2 className="panel-title">오늘의 학습 목표</h2>
          <ProgressBar
            value={progress.percent}
            label={`진행률 (${progress.done} / ${progress.total})`}
            tone={progress.percent === 100 ? 'green' : 'blue'}
          />
          <ul className="goal-list">
            {progress.parts.map((part) => (
              <li key={part.key} className={part.done >= part.total ? 'done' : ''}>
                <span>{part.done >= part.total ? '✔' : '○'}</span>
                {part.label}
                <strong>
                  {Math.min(part.done, part.total)} / {part.total}
                </strong>
              </li>
            ))}
          </ul>
          <Link className="btn btn-primary" to="/today">
            {progress.percent === 100 ? '다시 보기' : '이어서 학습하기'}
          </Link>
        </section>

        {/* 통계 카드 */}
        <section className="stat-grid">
          <Link to="/terms" className="stat-card accent">
            <span className="stat-label">암기한 용어</span>
            <strong className="stat-num">
              {memorizedTerms.length}
              <small> / {SHORT_QUESTIONS.length}</small>
            </strong>
          </Link>
          <Link to="/practical" className="stat-card">
            <span className="stat-label">이해한 실기 기출</span>
            <strong className="stat-num">
              {donePractical.length}
              <small> / {PRACTICAL_LIST.length}</small>
            </strong>
          </Link>
          <Link to="/notes" className="stat-card">
            <span className="stat-label">읽은 요약노트</span>
            <strong className="stat-num">
              {readNotes.length}
              <small> / {NOTE_LIST.length}</small>
            </strong>
          </Link>
          <Link to="/written" className="stat-card">
            <span className="stat-label">필기·SQLD 문제 은행</span>
            <strong className="stat-num">
              {CHOICE_QUESTIONS.length}
              <small> 문제</small>
            </strong>
          </Link>
        </section>

        {/* 시험 문제 풀이 현황 */}
        <section className="panel">
          <h2 className="panel-title">모의고사 현황</h2>
          <ul className="info-grid two">
            <li>
              <span>응시 횟수</span>
              <strong>{examCount}회</strong>
            </li>
            <li>
              <span>최고 점수</span>
              <strong>{bestScore === null ? '-' : `${formatScore(bestScore)}점`}</strong>
            </li>
            <li>
              <span>최근 점수</span>
              <strong>{latest ? `${formatScore(latest.score)}점` : '-'}</strong>
            </li>
            <li>
              <span>미해결 오답</span>
              <strong className={unsolvedWrong > 0 ? 'text-ng' : ''}>{unsolvedWrong}개</strong>
            </li>
          </ul>
          <div className="btn-row">
            <Link className="btn btn-primary btn-small" to="/exam">
              모의고사
            </Link>
            <Link className="btn btn-ghost btn-small" to="/wrong">
              오답노트
            </Link>
            {latest && (
              <Link className="btn btn-ghost btn-small" to={`/exam/result/${latest.id}`}>
                최근 결과
              </Link>
            )}
          </div>
        </section>

        {/* 최근 학습 기록 */}
        <section className="panel">
          <h2 className="panel-title">최근 학습 기록</h2>
          {activities.length === 0 ? (
            <p className="empty-box small-box">아직 학습 기록이 없어요. 오늘의 학습을 시작해 보세요!</p>
          ) : (
            <ul className="activity-list">
              {activities.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <span className="act-icon">{ACTIVITY_ICONS[item.type] || '•'}</span>
                  <span className="act-text">{item.text}</span>
                  <span className="muted small">{formatDateTime(item.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 오늘의 추천 문제 */}
        <section className="panel wide">
          <h2 className="panel-title">오늘의 추천 문제</h2>
          {recommended && (
            <>
              <QuizCard question={recommended} selected={pickedChoice} onSelect={setPickedChoice} />
              <p className="muted small">
                더 많은 문제는 <Link to="/written">필기·SQLD 문제 풀이</Link>에서 풀어 볼 수 있어요.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Home;
