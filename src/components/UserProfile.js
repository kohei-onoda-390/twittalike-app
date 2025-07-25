import React, { useState, useEffect, useRef } from "react";
import {
  useParams,
  useOutletContext,
  useNavigate,
  Link,
} from "react-router-dom";
import "./UserProfile.css";
import axios from "axios";
import PostCard from "./PostCard";
import ProfileEditModal from "./ProfileEditModal"; // 新しいモーダルをインポート

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" className="avatar-edit-icon">
    <path d="M12 14.5c1.38 0 2.5-1.12 2.5-2.5S13.38 9.5 12 9.5 9.5 10.62 9.5 12s1.12 2.5 2.5 2.5zM19.25 5.5h-2.82l-1.13-1.7c-.34-.51-.94-.82-1.59-.82H10.29c-.65 0-1.25.31-1.59.82L7.57 5.5H4.75C3.78 5.5 3 6.28 3 7.25v10.5c0 .97.78 1.75 1.75 1.75h14.5c.97 0 1.75-.78 1.75-1.75V7.25c0-.97-.78-1.75-1.75-1.75zm0 11.5H4.75V7.25h3.44l1.13-1.7c.17-.25.45-.4.74-.4h3.88c.29 0 .57.15.74.4l1.13 1.7h3.44v10.75z"></path>
  </svg>
);

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const { postSuccessCount = 0, handleOpenReplyModal } = outletContext;
  const currentUserId = localStorage.getItem("user_id");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' or 'replies'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // モーダルの表示状態
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const jwtToken = localStorage.getItem("jwtToken");
  const targetUserId = userId || currentUserId;
  const isCurrentUser = targetUserId === currentUserId;

  useEffect(() => {
    if (!jwtToken || !currentUserId) {
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      const contentEndpoint =
        activeTab === "posts"
          ? `http://localhost:5000/users/${targetUserId}/posts`
          : `http://localhost:5000/users/${targetUserId}/replies`;
      try {
        const [userResponse, postsResponse] = await Promise.all([
          axios.get(`http://localhost:5000/users/${targetUserId}`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }),
          axios.get(contentEndpoint, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }),
        ]);

        const userData = userResponse.data;
        setUser(userData); // ユーザー情報は毎回取得するが、UI上は問題ない
        setPosts(postsResponse.data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          // トークンが無効または期限切れの場合
          localStorage.removeItem("jwtToken");
          localStorage.removeItem("user_id");
          navigate("/login");
        } else {
          const errorMessage =
            error.response?.data?.message ||
            "プロファイルデータの読み込みに失敗しました。";
          setError(errorMessage);
        }
        setPosts([]); // エラー発生時に投稿リストを空にする
      } finally {
        setLoading(false);
      }
    };
    if (targetUserId) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [
    targetUserId,
    jwtToken,
    postSuccessCount,
    currentUserId,
    navigate,
    activeTab,
  ]);

  const handleAvatarClick = () => {
    if (isCurrentUser) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/profile/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );
      // ユーザーオブジェクトのavatarUrlを更新して、UIに即時反映させる
      setUser((prevUser) => ({
        ...prevUser,
        avatarUrl: response.data.avatarUrl,
      }));
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("画像のアップロードに失敗しました。");
    }
  };

  const handleProfileSave = async (updatedData) => {
    try {
      const response = await axios.put(
        "http://localhost:5000/api/profile",
        updatedData, // { name, bio }
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      setUser((prevUser) => ({ ...prevUser, ...response.data.user }));
      setIsEditModalOpen(false); // モーダルを閉じる
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("プロフィールの保存に失敗しました。");
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`http://localhost:5000/posts/${postId}`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setPosts(posts.filter((post) => post.post_id !== postId));
    } catch (err) {
      alert("削除中にエラーが発生しました。");
    }
  };

  const handleLikeToggle = async (postId, hasLiked) => {
    const method = hasLiked ? "delete" : "post";
    try {
      await axios({
        method,
        url: `http://localhost:5000/posts/${postId}/like`,
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      setPosts(
        posts.map((post) =>
          post.post_id === postId
            ? {
                ...post,
                user_has_liked: !hasLiked,
                likes_count: hasLiked
                  ? post.likes_count - 1
                  : post.likes_count + 1,
              }
            : post
        )
      );
    } catch (err) {
      alert("いいね操作中にエラーが発生しました。");
    }
  };

  const handleFollowToggle = async () => {
    if (!user) return;

    const method = user.isFollowedByCurrentUser ? "delete" : "post";
    try {
      await axios({
        method,
        url: `http://localhost:5000/api/users/${user.userId}/follow`,
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      // UIを即時更新（オプティミスティックアップデート）
      setUser((prevUser) => ({
        ...prevUser,
        isFollowedByCurrentUser: !prevUser.isFollowedByCurrentUser,
        followers: prevUser.isFollowedByCurrentUser
          ? prevUser.followers - 1
          : prevUser.followers + 1,
      }));
    } catch (error) {
      console.error("Follow/unfollow failed:", error);
      alert("操作に失敗しました。");
    }
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="error-message" style={{ padding: "20px" }}>
        エラー: {error}
      </div>
    );
  }

  if (!user) {
    return <div style={{ padding: "20px" }}>ユーザーが見つかりません。</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div
          className={`profile-avatar ${
            isCurrentUser ? "profile-avatar-editable" : ""
          }`}
          onClick={handleAvatarClick}
          style={{ backgroundImage: `url(${user.avatarUrl})` }}
        >
          <div className="avatar-edit-overlay">
            <CameraIcon />
          </div>
        </div>
        {isCurrentUser && (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept="image/*"
          />
        )}
      </div>

      <div className="profile-info">
        <div className="profile-actions">
          {isCurrentUser ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="edit-profile-btn"
            >
              プロフィールを編集
            </button>
          ) : (
            <button
              onClick={handleFollowToggle}
              className={`follow-btn ${
                user.isFollowedByCurrentUser ? "following" : ""
              }`}
            >
              <span className="follow-text">
                {user.isFollowedByCurrentUser ? "フォロー中" : "フォロー"}
              </span>
              <span className="unfollow-text">フォロー解除</span>
            </button>
          )}
        </div>

        <div className="profile-details">
          <h2>{user.name}</h2>
          <p className="username">{user.username}</p>
          <p className="bio">{user.bio}</p>
          <div className="profile-stats">
            <Link
              to={`/profile/${user.userId}/following`}
              className="profile-stat-link"
            >
              <span>{user.following}</span> フォロー中
            </Link>
            <Link
              to={`/profile/${user.userId}/followers`}
              className="profile-stat-link"
            >
              <span>{user.followers}</span> フォロワー
            </Link>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          投稿
        </button>
        <button
          className={`profile-tab ${activeTab === "replies" ? "active" : ""}`}
          onClick={() => setActiveTab("replies")}
        >
          返信
        </button>
      </div>

      <div className="posts-list-inner">
        {posts.map((post) => (
          <PostCard
            key={post.post_id}
            post={post}
            currentUserId={currentUserId}
            onDelete={() => {
              if (window.confirm("本当に削除しますか？")) {
                handleDelete(post.post_id);
              }
            }}
            onLike={handleLikeToggle}
            onReply={handleOpenReplyModal}
          />
        ))}
      </div>

      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleProfileSave}
        currentUserData={user}
      />
    </div>
  );
};

export default UserProfile;
