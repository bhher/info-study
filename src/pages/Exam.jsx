// ============================================================
// 역할: 모의고사 페이지 (/exam) - 시험 고르기 + 모의고사 보기
//
//  화면 상태(phase)
//   'ready'   : 모의고사 선택 + 시험 안내 + 시간 선택 + [시험 시작] + 최근 응시 기록
//   'running' : 시험 중 (남은 시간, 문제 번호표, 이전/다음, 제출)
//
//  시험이 끝나는 방법
//   - [제출하기] 를 눌러 확인 창에서 제출
//   - 남은 시간이 0이 되면 자동 제출
//  제출하면 채점해서 결과를 저장하고 /exam/result/:id 로 이동합니다.
//  (틀린 문제는 오답노트에 자동으로 저장됩니다.)
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EXAM_LIST, EXAM_MAP } from '../data/examData';
import { useStudy } from '../context/StudyContext';
import { formatScore, gradeExam, isAnswered } from '../utils/examUtils';
import { formatDateTime, formatTime } from '../utils/studyUtils';
import ExamQuestion from '../components/ExamQuestion';
import Modal from '../components/Modal';

function Exam() {
  const navigate = useNavigate();
  const { examHistory, submitExamResult } = useStudy();

  const [phase, setPhase] = useState('ready'); // 'ready' | 'running'
  const [examId, setExamId] = useState(EXAM_LIST[0].id); // 선택한 모의고사
  const exam = EXAM_MAP[examId];
  const questions = exam.questions;

  const [minutes, setMinutes] = useState(exam.defaultMinutes); // 선택한 시험 시간(분)
  const [answers, setAnswers] = useState({}); // { 문제id: 답 }
  const [current, setCurrent] = useState(0); // 현재 문제 위치(0부터)
  const [remaining, setRemaining] = useState(exam.defaultMinutes * 60); // 남은 시간(초)
  const [confirmOpen, setConfirmOpen] = useState(false); // 제출 확인 창

  const startedAt = useRef(0); // 시험을 시작한 시각
  const submittedRef = useRef(false); // 이미 제출했는지 (두 번 제출 방지)
  const submitRef = useRef(null); // 가장 최신 제출 함수를 담아 두는 곳 (타이머에서 사용)

  const total = questions.length;
  const question = questions[current];
  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;
  const unansweredNumbers = questions.map((q, i) => (isAnswered(q, answers[q.id]) ? null : i + 1)).filter(Boolean);

  // 배점 구성 안내용
  const choiceCount = questions.filter((q) => q.type === 'choice').length;
  const shortCount = total - choiceCount;
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  // 모의고사를 바꾸면 시험 시간도 그 시험의 기본값으로
  function handleSelectExam(id) {
    setExamId(id);
    setMinutes(EXAM_MAP[id].defaultMinutes);
  }

  // ---------- 시험 시작 ----------
  function handleStart() {
    startedAt.current = Date.now();
    submittedRef.current = false;
    setAnswers({});
    setCurrent(0);
    setRemaining(minutes * 60);
    setConfirmOpen(false);
    setPhase('running');
  }

  // ---------- 제출 + 채점 ----------
  function handleSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const usedSec = Math.min(minutes * 60, Math.floor((Date.now() - startedAt.current) / 1000));
    const result = gradeExam(questions, answers, {
      examId: exam.id,
      examTitle: exam.title,
      limitMin: minutes,
      usedSec,
    });
    submitExamResult(result); // 결과 + 오답노트 저장
    navigate(`/exam/result/${result.id}`);
  }
  // 타이머가 항상 "가장 최신 answers" 로 제출할 수 있도록 매 렌더링마다 갱신
  submitRef.current = handleSubmit;

  // ---------- 타이머: 1초마다 남은 시간 계산, 0이 되면 자동 제출 ----------
  useEffect(() => {
    if (phase !== 'running') return undefined;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      const left = Math.max(0, minutes * 60 - elapsed);
      setRemaining(left);
      if (left === 0) {
        clearInterval(timer);
        submitRef.current(); // 시간 종료 → 자동 제출
      }
    }, 1000);

    return () => clearInterval(timer); // 화면을 벗어나면 타이머 정리
  }, [phase, minutes]);

  // 시험 중 새로고침/창 닫기를 하면 경고
  useEffect(() => {
    if (phase !== 'running') return undefined;
    function warn(e) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  // 답 바꾸기 (객관식: 번호 / 주관식: 글자)
  function handleChange(value) {
    setAnswers({ ...answers, [question.id]: value });
  }

  // =====================================================
  // 시험 시작 전 화면
  // =====================================================
  if (phase === 'ready') {
    const history = examHistory.filter((record) => record.examId === examId);
    return (
      <div className="page">
        <div className="page-head">
          <h1>모의고사</h1>
          <p className="muted">실제 시험처럼 시간을 재면서 풀어 보세요. 틀린 문제는 오답노트에 자동 저장돼요.</p>
        </div>

        {/* 모의고사 고르기 */}
        <section className="panel">
          <h2 className="sub-title">모의고사 선택</h2>
          <div className="exam-picker">
            {EXAM_LIST.map((item) => (
              <button
                key={item.id}
                className={item.id === examId ? 'exam-pick active' : 'exam-pick'}
                onClick={() => handleSelectExam(item.id)}
                aria-pressed={item.id === examId}
              >
                <span className="badge">{item.kind}</span>
                <strong>{item.title}</strong>
                <span className="muted small">{item.questions.length}문제</span>
              </button>
            ))}
          </div>
        </section>

        <div className="exam-ready">
          <section className="panel">
            <span className="badge">{exam.round}</span>
            <h2 className="exam-title">{exam.title}</h2>
            <p className="muted">{exam.description}</p>

            <ul className="info-grid">
              <li>
                <span>총 문항</span>
                <strong>{total}문제</strong>
              </li>
              <li>
                <span>만점</span>
                <strong>{formatScore(totalPoints)}점</strong>
              </li>
              <li>
                <span>객관식</span>
                <strong>{choiceCount}문제</strong>
              </li>
              <li>
                <span>주관식</span>
                <strong>{shortCount}문제</strong>
              </li>
            </ul>

            <h3 className="sub-title">시험 시간 선택</h3>
            <div className="time-options">
              {exam.timeOptions.map((time) => (
                <label key={time} className={minutes === time ? 'time-option active' : 'time-option'}>
                  <input type="radio" name="time" checked={minutes === time} onChange={() => setMinutes(time)} />
                  {time}분
                </label>
              ))}
            </div>

            <ul className="notice-list">
              <li>문제 번호를 눌러 원하는 문제로 이동할 수 있어요.</li>
              <li>제출하기 전에는 답을 얼마든지 바꿀 수 있어요.</li>
              <li>시간이 끝나면 자동으로 제출돼요.</li>
              <li>합격 기준은 {exam.passScore}점 이상이에요.</li>
            </ul>

            <button className="btn btn-primary btn-large" onClick={handleStart}>
              ▶ 시험 시작
            </button>
          </section>

          <section className="panel">
            <h2 className="sub-title">이 시험의 최근 응시 기록</h2>
            {history.length === 0 ? (
              <p className="empty-box small-box">아직 응시한 기록이 없어요.</p>
            ) : (
              <ul className="history-list">
                {history.slice(0, 5).map((record) => (
                  <li key={record.id}>
                    <Link to={`/exam/result/${record.id}`}>
                      <span className="history-score">{formatScore(record.score)}점</span>
                      <span className="muted small">
                        {formatDateTime(record.takenAt)} · {record.correctCount}/{record.totalCount} 정답
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    );
  }

  // =====================================================
  // 시험 중 화면
  // =====================================================
  return (
    <div className="page">
      {/* 위쪽 고정 바: 시험 이름, 남은 시간, 푼 문제 수, 제출 */}
      <div className="exam-bar">
        <div>
          <strong>{exam.title}</strong>
          <span className="muted small">
            {' '}
            · 푼 문제 {answeredCount} / {total}
          </span>
        </div>
        <div className="exam-bar-right">
          <span className={remaining <= 60 ? 'timer danger' : 'timer'} aria-label="남은 시간">
            ⏱ {formatTime(remaining)}
          </span>
          <button className="btn btn-primary btn-small" onClick={() => setConfirmOpen(true)}>
            제출하기
          </button>
        </div>
      </div>

      <div className="exam-layout">
        {/* 문제 번호표 */}
        <aside className="q-nav">
          <h3 className="sidebar-title">문제 번호</h3>
          <div className="q-nav-grid">
            {questions.map((q, i) => {
              let cls = 'q-nav-btn';
              if (isAnswered(q, answers[q.id])) cls += ' answered';
              if (i === current) cls += ' current';
              return (
                <button key={q.id} className={cls} onClick={() => setCurrent(i)} aria-label={`${i + 1}번 문제로 이동`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <ul className="legend">
            <li>
              <span className="dot answered" /> 푼 문제
            </li>
            <li>
              <span className="dot" /> 안 푼 문제
            </li>
            <li>
              <span className="dot current" /> 현재 문제
            </li>
          </ul>
        </aside>

        {/* 문제 + 이전/다음 */}
        <section className="exam-main panel">
          <ExamQuestion key={question.id} question={question} number={current + 1} value={answers[question.id]} onChange={handleChange} />

          <div className="pager">
            <button className="btn btn-ghost" onClick={() => setCurrent(current - 1)} disabled={current === 0}>
              ← 이전 문제
            </button>
            <span className="pager-text">
              {current + 1} / {total}
            </span>
            {current === total - 1 ? (
              <button className="btn btn-primary" onClick={() => setConfirmOpen(true)}>
                제출하기
              </button>
            ) : (
              <button className="btn btn-ghost" onClick={() => setCurrent(current + 1)}>
                다음 문제 →
              </button>
            )}
          </div>
        </section>
      </div>

      {/* 제출 확인 창 */}
      {confirmOpen && (
        <Modal
          title="답안을 제출할까요?"
          onClose={closeConfirm}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeConfirm}>
                계속 풀기
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                제출하기
              </button>
            </>
          }
        >
          <p>
            푼 문제 <strong>{answeredCount}</strong>개 / 안 푼 문제 <strong>{unansweredNumbers.length}</strong>개
          </p>
          {unansweredNumbers.length > 0 ? (
            <p className="warn-text">
              ⚠ 답하지 않은 문제: {unansweredNumbers.length > 20 ? `${unansweredNumbers.slice(0, 20).join(', ')} 외 ${unansweredNumbers.length - 20}개` : `${unansweredNumbers.join(', ')}번`} (틀린 문제로 처리돼요)
            </p>
          ) : (
            <p className="muted">모든 문제에 답했어요. 제출하면 바로 채점됩니다.</p>
          )}
        </Modal>
      )}
    </div>
  );
}

export default Exam;
