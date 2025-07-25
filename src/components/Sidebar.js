import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./ViewPosts.css"; // 既存のCSSを流用
import { LOCAL_STORAGE_JWT_KEY, LOCAL_STORAGE_USER_ID_KEY } from "../Constants";
import { HomeIcon } from "./icons/HomeIcon";
import { ProfileIcon } from "./icons/ProfileIcon";
import { BellIcon } from "./icons/BellIcon";

const Sidebar = ({ onOpenModal, unreadCount }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY);

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_JWT_KEY);
    localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {currentUserId && (
        <div className="user-info">
          <p>ログインユーザ：{currentUserId}</p>
        </div>
      )}
      <nav className="sidebar-nav">
        <Link
          to="/"
          className={`sidebar-nav-link ${
            location.pathname === "/" ? "active" : ""
          }`}
        >
          <HomeIcon />
          <span>ホーム</span>
        </Link>
        {currentUserId && (
          <Link
            to={`/profile/${currentUserId}`}
            className={`sidebar-nav-link ${
              location.pathname.startsWith("/profile") ? "active" : ""
            }`}
          >
            <ProfileIcon />
            <span>プロフィール</span>
          </Link>
        )}
        <Link
          to="/notifications"
          className={`sidebar-nav-link ${
            location.pathname === "/notifications" ? "active" : ""
          }`}
        >
          <div className="nav-icon-wrapper">
            <BellIcon />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
          <span>通知</span>
        </Link>
      </nav>

      <button onClick={onOpenModal} className="btn btn-post">
        投稿する
      </button>

      <button onClick={handleLogout} className="btn btn-logout">
        ログアウト
      </button>
    </aside>
  );
};

export default Sidebar;
