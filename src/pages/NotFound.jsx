// 역할: 없는 주소로 들어왔을 때 보여 주는 안내 페이지
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="page">
      <div className="empty-box">
        <h1>404</h1>
        <p>찾는 페이지가 없어요.</p>
        <Link className="btn btn-primary" to="/">
          홈으로 가기
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
