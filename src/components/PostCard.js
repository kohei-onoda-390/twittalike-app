import React from "react";
import { useNavigate } from "react-router-dom";
import "./ViewPosts.css"; // スタイルは共通のものを流用

const LikeIcon = () => (
  <svg
    className="like-icon"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const ReplyIcon = () => (
  <svg className="reply-icon" viewBox="0 0 24 24" aria-hidden="true">
    {/* A more classic speech bubble icon */}
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
  </svg>
);

const PostCard = ({ post, currentUserId, onDelete, onLike, onReply }) => {
  const navigate = useNavigate();
  const isOwnPost = post.post_user === currentUserId;

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // 親要素へのクリックイベント伝播を防ぐ
    // onDeleteが渡されている場合のみ実行
    if (onDelete) {
      onDelete(post.post_id);
    }
  };

  const handleLikeClick = (e) => {
    e.stopPropagation(); // 親要素へのクリックイベント伝播を防ぐ
    // onLikeが渡されている場合のみ実行
    if (onLike) {
      onLike(post.post_id, post.user_has_liked);
    }
  };

  const handleReplyClick = (e) => {
    e.stopPropagation(); // 親要素へのクリックイベント伝播を防ぐ
    if (onReply) {
      onReply(post);
    }
  };

  const handleCardClick = () => {
    navigate(`/post/${post.post_id}`);
  };

  return (
    <div className="post-card" onClick={handleCardClick}>
      <div
        className="post-avatar-container"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/profile/${post.post_user}`);
        }}
      >
        <img
          src={post.avatar_url}
          alt={`${post.user_name}のアバター`}
          className="post-avatar"
        />
      </div>
      <div className="post-main-content">
        <div className="post-header">
          <div
            className="user-info"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${post.post_user}`);
            }}
          >
            <strong>{post.user_name}</strong>
            <span className="post-user-id">@{post.post_user}</span>
          </div>
          <p className="post-time">
            <small>· {new Date(post.post_time).toLocaleString()}</small>
          </p>
          {isOwnPost && onDelete && (
            <button className="delete-btn" onClick={handleDeleteClick}>
              削除
            </button>
          )}
        </div>
        <p className="post-content">{post.post_body}</p>
        <div className="post-actions">
          <div className="action-item">
            <button
              className="reply-btn"
              onClick={handleReplyClick}
              aria-label="返信する"
            >
              <ReplyIcon />
            </button>
            <span className="reply-count">{post.reply_count || 0}</span>
          </div>
          <div className="action-item">
            <button
              className={`like-btn ${post.user_has_liked ? "liked" : ""}`}
              onClick={handleLikeClick}
              disabled={!onLike}
              aria-label={post.user_has_liked ? "いいねを取り消す" : "いいね"}
            >
              <LikeIcon />
            </button>
            <span className="likes-count">{post.likes_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
