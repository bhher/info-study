// ============================================================
// 역할: 화면 위에 떠서 내용을 보여 주는 팝업 창(모달)
// props
//   - title    : 팝업 제목
//   - onClose  : 닫기 함수
//   - children : 팝업 안에 보여 줄 내용
//   - footer   : (선택) 아래쪽 버튼 영역
// 닫는 방법 3가지: ✕ 버튼 / 바깥(어두운 영역) 클릭 / ESC 키
// ============================================================
import { useEffect } from 'react';

function Modal({ title, onClose, children, footer }) {
  // ESC 키로 닫기 + 팝업이 떠 있는 동안 뒤 화면 스크롤 막기
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown); // 반드시 해제
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    // 바깥 영역을 누르면 닫힘
    <div className="modal-overlay" onClick={onClose}>
      {/* 안쪽을 눌렀을 때는 닫히지 않도록 이벤트 전달을 막음 */}
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
