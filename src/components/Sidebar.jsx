// ============================================================
// 역할: 학습 화면 옆의 "필터 목록" (난이도별, 카테고리별 보기)
// props
//   - title    : 목록 제목 (예: '난이도')
//   - items    : [{ value, label, count }]  → 버튼 하나하나. count 는 해당 항목의 개수
//   - selected : 지금 선택된 value
//   - onSelect : 항목을 눌렀을 때 호출 (value 를 넘겨 줌)
//   - children : (선택) 목록 아래에 덧붙일 내용 (예: 체크 상자)
// 같은 부품을 한자·단어 화면에서 재사용합니다.
// ============================================================
function Sidebar({ title, items, selected, onSelect, children }) {
  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">{title}</h3>
      <ul className="sidebar-list">
        {items.map((item) => (
          <li key={item.value}>
            <button
              className={selected === item.value ? 'sidebar-item active' : 'sidebar-item'}
              onClick={() => onSelect(item.value)}
            >
              <span>{item.label}</span>
              <span className="sidebar-count">{item.count}</span>
            </button>
          </li>
        ))}
      </ul>
      {children}
    </aside>
  );
}

export default Sidebar;
