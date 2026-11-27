// ============================================================
// 역할: 마크다운 글(제목, 표, 목록, 코드 블록, **굵게** 등)을 HTML 로 바꿔서 보여 주는 부품
//   - 문제, 정답, 해설, 요약노트가 모두 마크다운으로 쓰여 있어서 이 부품으로 보여 줍니다.
// props
//   - text      : 마크다운 글자
//   - inline    : true 면 문단(<p>) 없이 한 줄짜리 글로 바꿈 (문제 제목 등 짧은 글에 사용)
//   - className : 덧붙일 CSS 클래스
//
// 안전장치: 글 속의 HTML 태그(예: <stdio.h>, <T>)는 태그로 해석하지 않고 글자 그대로 보여 줍니다.
//   (줄바꿈 <br> 만 허용)
// ============================================================
import { useMemo } from 'react';
import { marked } from 'marked';

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 마크다운 변환기 설정 (앱 전체에서 한 번만)
marked.use({
  gfm: true, // 표, 취소선 등 GitHub 방식 문법 사용
  breaks: true, // 줄바꿈(엔터 한 번)을 그대로 줄바꿈으로 보여 주기
  renderer: {
    html(html) {
      const raw = typeof html === 'string' ? html : html.text;
      return /^<br\s*\/?>$/i.test(raw.trim()) ? '<br>' : escapeHtml(raw);
    },
  },
});

function Markdown({ text, inline = false, className = '' }) {
  // text 가 바뀔 때만 다시 변환 (같은 글을 매번 변환하지 않도록)
  const html = useMemo(() => (inline ? marked.parseInline(text ?? '') : marked.parse(text ?? '')), [text, inline]);
  const Tag = inline ? 'span' : 'div';
  return <Tag className={`md ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default Markdown;
