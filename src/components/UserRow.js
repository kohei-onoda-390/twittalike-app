import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const UserRow = ({ user, onFollowChange }) => {
  const [isFollowed, setIsFollowed] = useState(user.isFollowedByCurrentUser);
  const currentUserId = localStorage.getItem("user_id");
  const jwtToken = localStorage.getItem("jwtToken");

  const handleFollowToggle = async (e) => {
    e.preventDefault(); // Linkへの遷移を防ぐ
    const method = isFollowed ? "delete" : "post";
    try {
      await axios({
        method,
        url: `http://localhost:5000/api/users/${user.userId}/follow`,
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const newFollowState = !isFollowed;
      setIsFollowed(newFollowState);
      if (onFollowChange) {
        onFollowChange(user.userId, newFollowState);
      }
    } catch (error) {
      console.error("Follow/unfollow failed:", error);
      alert("操作に失敗しました。");
    }
  };

  return (
    <Link to={`/profile/${user.userId}`} className="user-row-link">
      <div className="user-row">
        <img src={user.avatarUrl} alt={user.name} className="user-row-avatar" />
        <div className="user-row-info">
          <strong>{user.name}</strong>
          <span className="username">@{user.userId}</span>
          <p className="bio">{user.bio}</p>
        </div>
        {currentUserId !== user.userId && (
          <button
            onClick={handleFollowToggle}
            className={`follow-btn ${isFollowed ? "following" : ""}`}
          >
            <span className="follow-text">
              {isFollowed ? "フォロー中" : "フォロー"}
            </span>
            <span className="unfollow-text">フォロー解除</span>
          </button>
        )}
      </div>
    </Link>
  );
};

export default UserRow;
