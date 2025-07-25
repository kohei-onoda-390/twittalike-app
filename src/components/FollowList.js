import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import UserRow from "./UserRow"; // 新しく作成するコンポーネント
import "./FollowList.css"; // 新しく作成するCSS

const FollowList = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileUser, setProfileUser] = useState(null);

  const isFollowingPage = location.pathname.includes("/following");
  const jwtToken = localStorage.getItem("jwtToken");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const listType = isFollowingPage ? "following" : "followers";
    try {
      const [profileRes, listRes] = await Promise.all([
        axios.get(`http://localhost:5000/users/${userId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }),
        axios.get(`http://localhost:5000/api/users/${userId}/${listType}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }),
      ]);
      setProfileUser(profileRes.data);
      setUsers(listRes.data);
    } catch (err) {
      setError("ユーザーリストの取得に失敗しました。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId, isFollowingPage, jwtToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFollowChange = (targetUserId, isFollowed) => {
    setUsers(
      users.map((user) => {
        if (user.userId === targetUserId) {
          return { ...user, isFollowedByCurrentUser: isFollowed };
        }
        return user;
      })
    );
  };

  if (loading)
    return (
      <div className="follow-list-container">
        <p>読み込み中...</p>
      </div>
    );
  if (error)
    return (
      <div className="follow-list-container">
        <p className="error">{error}</p>
      </div>
    );

  return (
    <div className="follow-list-container">
      <div className="follow-list-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ←
        </button>
        <div>
          <h2>{profileUser?.name}</h2>
          <p className="username">@{profileUser?.userId}</p>
        </div>
      </div>
      <div className="follow-list-tabs">
        <Link
          to={`/profile/${userId}/following`}
          className={`follow-list-tab ${isFollowingPage ? "active" : ""}`}
        >
          フォロー中
        </Link>
        <Link
          to={`/profile/${userId}/followers`}
          className={`follow-list-tab ${!isFollowingPage ? "active" : ""}`}
        >
          フォロワー
        </Link>
      </div>
      <div className="user-list">
        {users.length > 0 ? (
          users.map((user) => (
            <UserRow
              key={user.userId}
              user={user}
              onFollowChange={handleFollowChange}
            />
          ))
        ) : (
          <p className="no-users-message">
            {isFollowingPage
              ? "まだ誰もフォローしていません。"
              : "フォロワーがいません。"}
          </p>
        )}
      </div>
    </div>
  );
};

export default FollowList;
