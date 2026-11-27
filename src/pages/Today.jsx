// ============================================================
// 역할: 오늘의 학습 페이지 (/today)
//   오늘의 용어 5개 + 필기 미니 퀴즈 5문제 + 오늘의 실기 문제 1개 + 오늘의 요약노트 1편
//   - 날짜를 기준으로 항목이 정해져서, 같은 날에는 언제 열어도 같은 학습 내용이 나옵니다.
//   - 항목을 끝낼 때마다 진행률이 올라가고, 기록은 localStorage 에 저장됩니다.
//   - 날짜가 바뀌면 진행 상황이 새로 시작됩니다.
// ============================================================
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SHORT_QUESTIONS } from '../data/shortData';
import { CHOICE_QUESTIONS } from '../data/choiceData';
import { PRACTICAL_LIST } from '../data/practicalData';
import { NOTE_LIST } from '../data/noteData';
import { useStudy } from '../context/StudyContext';
import { TODAY_COUNTS, calcTodayProgress, getTodayString, pickByDate } from '../utils/studyUtils';
import TermCard from '../components/TermCard';
import PracticalCard from '../components/PracticalCard';
import QuizCard from '../components/QuizCard';
import ProgressBar from '../components/ProgressBar';

// 하루 학습용 실기 문제는 너무 긴 문제를 빼고 고릅니다.
const DAILY_PRACTICAL = PRACTICAL_LIST.filter((item) => item.question.length <= 900 && !item.exam.startsWith('코딩 연습'));

function Today() {
  const {
    today,
    favoriteTerms,
    toggleFavoriteTerm,
    toggleTodayTerm,
    toggleTodayPractical,
    toggleTodayNote,
    answerTodayQuiz,
    readNotes,
    toggleNoteRead,
  } = useStudy();

  // 오늘 날짜로 항목 고르기 (날짜가 같으면 결과도 같음)
  const dateString = getTodayString();
  const termList = useMemo(() => pickByDate(SHORT_QUESTIONS, TODAY_COUNTS.terms, dateString), [dateString]);
  const quizList = useMemo(() => pickByDate(CHOICE_QUESTIONS, TODAY_COUNTS.quiz, dateString), [dateString]);
  const practical = useMemo(() => pickByDate(DAILY_PRACTICAL, 1, dateString)[0], [dateString]);
  const note = useMemo(() => pickByDate(NOTE_LIST, 1, dateString)[0], [dateString]);

  const progress = calcTodayProgress(today);
  const quizCorrect = quizList.filter((q) => today.quiz[q.id] === q.answer).length;
  const quizDone = quizList.filter((q) => today.quiz[q.id] !== undefined).length;

  return (
    <div className="page">
      <div className="page-head">
        <h1>오늘의 학습</h1>
        <p className="muted">{dateString} · 용어 5개, 필기 퀴즈 5문제, 실기 문제 1개, 요약노트 1편</p>
      </div>

      {/* 전체 진행률 */}
      <section className="panel">
        <ProgressBar
          value={progress.percent}
          label={`오늘의 학습 진행률 (${progress.done} / ${progress.total})`}
          tone={progress.percent === 100 ? 'green' : 'blue'}
        />
        <ul className="today-steps">
          {progress.parts.map((part) => (
            <li key={part.key} className={part.done >= part.total ? 'done' : ''}>
              <span>{part.done >= part.total ? '✔' : '○'}</span> {part.label}{' '}
              <strong>
                {Math.min(part.done, part.total)}/{part.total}
              </strong>
            </li>
          ))}
        </ul>
        {progress.percent === 100 && <p className="success-banner">🎉 오늘의 학습을 모두 마쳤어요! 정말 잘했어요.</p>}
      </section>

      {/* 1. 오늘의 용어 */}
      <section className="today-section">
        <h2>
          ① 오늘의 용어 ({today.terms.length}/{TODAY_COUNTS.terms})
        </h2>
        <p className="muted small">설명을 읽고 용어를 떠올려 본 뒤 [정답 확인]으로 맞춰 보고 [학습 완료]를 눌러 주세요.</p>
        <div className="term-grid">
          {termList.map((item) => (
            <TermCard
              key={item.id}
              term={item}
              hideAnswer
              memorized={today.terms.includes(item.id)}
              favorite={favoriteTerms.includes(item.id)}
              actionLabel="학습 완료"
              onToggleMemorized={() => toggleTodayTerm(item.id, item.answerText.split(/[([]/)[0].trim())}
              onToggleFavorite={() => toggleFavoriteTerm(item.id)}
            />
          ))}
        </div>
      </section>

      {/* 2. 필기 미니 퀴즈 */}
      <section className="today-section">
        <h2>
          ② 필기 미니 퀴즈 ({quizDone}/{TODAY_COUNTS.quiz})
        </h2>
        <p className="muted small">
          {quizDone === quizList.length
            ? `퀴즈 완료! ${quizList.length}문제 중 ${quizCorrect}문제를 맞혔어요. 틀린 문제는 오답노트에 저장돼요.`
            : '보기를 눌러 정답을 맞혀 보세요. 한 번 고른 답은 바꿀 수 없어요.'}
        </p>
        <div className="quiz-list">
          {quizList.map((q, i) => (
            <QuizCard
              key={q.id}
              question={q}
              number={i + 1}
              total={quizList.length}
              selected={today.quiz[q.id]}
              onSelect={(choice) => answerTodayQuiz(q, choice)}
            />
          ))}
        </div>
      </section>

      {/* 3. 오늘의 실기 문제 */}
      <section className="today-section">
        <h2>③ 오늘의 실기 문제 ({today.practical ? 1 : 0}/{TODAY_COUNTS.practical})</h2>
        <p className="muted small">종이에 직접 풀어 본 뒤 [정답 확인]으로 비교하고 [학습 완료]를 눌러 주세요.</p>
        {practical && (
          <PracticalCard
            item={practical}
            defaultOpen
            done={today.practical}
            favorite={false}
            actionLabel="학습 완료"
            onToggleDone={() => toggleTodayPractical(practical.title)}
            onToggleFavorite={() => {}}
          />
        )}
      </section>

      {/* 4. 오늘의 요약노트 */}
      <section className="today-section">
        <h2>④ 오늘의 요약노트 ({today.note ? 1 : 0}/{TODAY_COUNTS.note})</h2>
        {note && (
          <div className="panel note-today">
            <div>
              <strong className="note-today-title">{note.title}</strong>
              <p className="muted small">{note.summary}</p>
            </div>
            <div className="btn-row">
              <Link className="btn btn-ghost" to={`/notes/${note.id}`}>
                📄 노트 읽으러 가기
              </Link>
              <button
                className={today.note ? 'btn btn-done' : 'btn btn-primary'}
                onClick={() => {
                  toggleTodayNote(note.title);
                  if (!today.note && !readNotes.includes(note.id)) toggleNoteRead(note.id, note.title);
                }}
              >
                {today.note ? '✔ 학습 완료' : '학습 완료'}
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="center-text">
        <Link className="btn btn-ghost" to="/">
          ← 홈으로
        </Link>
      </p>
    </div>
  );
}

export default Today;
