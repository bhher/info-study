// ============================================================
// 역할: 요약노트 페이지 (/notes, /notes/:noteId)
//   - /notes         : 단원별 요약노트 목록 (읽은 노트에는 ✔ 표시)
//   - /notes/:noteId : 노트 본문(마크다운)을 읽고 [읽기 완료] 로 기록
//   노트 본문은 src/notes/*.md 파일이며, 읽을 때만 불러옵니다. (import.meta.glob 의 지연 로딩)
// ============================================================
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { NOTE_GROUPS, NOTE_LIST } from '../data/noteData';
import { useStudy } from '../context/StudyContext';
import Markdown from '../components/Markdown';
import ProgressBar from '../components/ProgressBar';

// { '../notes/ch01.md': () => 파일 내용을 불러오는 함수 }
const NOTE_LOADERS = import.meta.glob('../notes/*.md', { query: '?raw', import: 'default' });

/** 노트 한 편 읽기 화면 */
function NoteView({ note }) {
  const { readNotes, toggleNoteRead } = useStudy();
  const [loaded, setLoaded] = useState({ id: null, text: '' }); // 어느 노트의 내용을 불러왔는지 함께 저장

  useEffect(() => {
    let cancelled = false;
    const loader = NOTE_LOADERS[`../notes/${note.id}.md`];
    if (loader) {
      loader().then((text) => {
        if (!cancelled) setLoaded({ id: note.id, text: text.replace(/^# .*\n/, '') }); // 첫 줄 제목은 위에서 따로 보여 줌
      });
    }
    return () => {
      cancelled = true; // 노트를 바꾸면 이전 요청의 결과는 버림
    };
  }, [note.id]);

  const index = NOTE_LIST.findIndex((item) => item.id === note.id);
  const prev = NOTE_LIST[index - 1];
  const next = NOTE_LIST[index + 1];
  const isRead = readNotes.includes(note.id);

  return (
    <div className="page">
      <div className="page-head">
        <h1>{note.title}</h1>
        <Link to="/notes" className="btn btn-small btn-ghost">
          ← 목록으로
        </Link>
      </div>

      <article className="panel note-article">
        {loaded.id === note.id ? <Markdown text={loaded.text} className="md-note" /> : <p className="muted">불러오는 중...</p>}
      </article>

      <div className="note-nav">
        {prev ? (
          <Link className="btn btn-ghost" to={`/notes/${prev.id}`}>
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        <button className={isRead ? 'btn btn-done' : 'btn btn-primary'} onClick={() => toggleNoteRead(note.id, note.title)}>
          {isRead ? '✔ 읽기 완료' : '읽기 완료로 표시'}
        </button>
        {next ? (
          <Link className="btn btn-ghost" to={`/notes/${next.id}`}>
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function Notes() {
  const { noteId } = useParams();
  const { readNotes } = useStudy();

  // 주소에 노트 번호가 있으면 읽기 화면
  if (noteId) {
    const note = NOTE_LIST.find((item) => item.id === noteId);
    if (!note) {
      return (
        <div className="page">
          <p className="empty-box">해당 요약노트를 찾을 수 없어요.</p>
          <p className="center-text">
            <Link className="btn btn-primary" to="/notes">
              목록으로
            </Link>
          </p>
        </div>
      );
    }
    return <NoteView note={note} />;
  }

  // 목록 화면
  return (
    <div className="page">
      <div className="page-head">
        <h1>요약노트</h1>
        <p className="muted">
          전체 {NOTE_LIST.length}편 · 읽기 완료 {readNotes.filter((id) => NOTE_LIST.some((n) => n.id === id)).length}편
        </p>
      </div>
      <ProgressBar value={(readNotes.length / NOTE_LIST.length) * 100} label="요약노트 읽기 진행률" tone="green" />

      {NOTE_GROUPS.map((group) => (
        <section key={group} className="today-section">
          <h2>{group}</h2>
          <div className="note-grid">
            {NOTE_LIST.filter((note) => note.group === group).map((note) => (
              <Link key={note.id} to={`/notes/${note.id}`} className={readNotes.includes(note.id) ? 'note-card read' : 'note-card'}>
                <div className="note-card-top">
                  <strong>{note.title}</strong>
                  {readNotes.includes(note.id) && <span className="badge badge-ok">✔ 읽음</span>}
                </div>
                <p className="muted small">{note.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default Notes;
