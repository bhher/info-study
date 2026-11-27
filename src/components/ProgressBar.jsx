// ============================================================
// 역할: 진행률 막대
// props
//   - value : 0 ~ 100 사이의 숫자(%)
//   - label : (선택) 막대 위에 보여 줄 제목
//   - text  : (선택) 막대 오른쪽에 보여 줄 글자 (없으면 "n%")
//   - tone  : (선택) 색상 'blue' | 'green' | 'orange'
// ============================================================
function ProgressBar({ value, label, text, tone = 'blue' }) {
  // 0 ~ 100 범위를 벗어나지 않게 보정
  const percent = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="progress-wrap">
      {(label || text !== null) && (
        <div className="progress-head">
          <span>{label}</span>
          <strong>{text !== undefined ? text : `${percent}%`}</strong>
        </div>
      )}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div className={`progress-fill tone-${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
