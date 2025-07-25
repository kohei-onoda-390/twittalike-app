import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import PostCard from "./PostCard";
import "./PostDetail.css"; // 新しいCSSファイル

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const { handleOpenReplyModal } = outletContext;

  const [ancestors, setAncestors] = useState([]);
  const [mainPost, setMainPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserId = localStorage.getItem("user_id");
  const jwtToken = localStorage.getItem("jwtToken");

  const fetchPostDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:5000/posts/${postId}`,
        {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }
      );
      setAncestors(response.data.ancestors || []);
      setMainPost(response.data.mainPost);
      setReplies(response.data.replies);
    } catch (err) {
      setError("投稿の読み込みに失敗しました。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [postId, jwtToken]);

  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]);

  const handleLikeToggle = async (targetPostId, hasLiked) => {
    const method = hasLiked ? "delete" : "post";
    try {
      await axios({
        method,
        url: `http://localhost:5000/posts/${targetPostId}/like`,
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      const updatePostState = (post) => {
        if (post.post_id === targetPostId) {
          return {
            ...post,
            user_has_liked: !hasLiked,
            likes_count: hasLiked ? post.likes_count - 1 : post.likes_count + 1,
          };
        }
        return post;
      };

      setMainPost((prev) =>
        prev.post_id === targetPostId ? updatePostState(prev) : prev
      );
      setReplies((prev) => prev.map(updatePostState));
      setAncestors((prev) => prev.map(updatePostState));
    } catch (err) {
      alert("いいね操作中にエラーが発生しました。");
    }
  };

  const handleDelete = async (targetPostId) => {
    if (!window.confirm("本当に削除しますか？")) return;
    try {
      await axios.delete(`http://localhost:5000/posts/${targetPostId}`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (mainPost && mainPost.post_id === targetPostId) {
        alert("投稿を削除しました。");
        navigate(-1);
      } else {
        fetchPostDetails(); // データを再取得してリストを更新
      }
    } catch (err) {
      alert("削除中にエラーが発生しました。");
    }
  };

  if (loading)
    return (
      <div className="post-detail-container">
        <p>読み込み中...</p>
      </div>
    );
  if (error)
    return (
      <div className="post-detail-container">
        <p className="error">{error}</p>
      </div>
    );

  return (
    <div className="post-detail-container">
      <div className="post-detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ←
        </button>
        <h2>ポスト</h2>
      </div>

      {ancestors.length > 0 && (
        <div className="ancestors-section">
          {ancestors.map((ancestorPost) => (
            <PostCard
              key={ancestorPost.post_id}
              post={ancestorPost}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onLike={handleLikeToggle}
              onReply={handleOpenReplyModal}
            />
          ))}
        </div>
      )}

      {mainPost && (
        <div className="main-post-section">
          <PostCard
            post={mainPost}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            onLike={handleLikeToggle}
            onReply={handleOpenReplyModal}
          />
        </div>
      )}

      <div className="replies-section">
        {replies.map((reply) => (
          <PostCard
            key={reply.post_id}
            post={reply}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            onLike={handleLikeToggle}
            onReply={handleOpenReplyModal}
          />
        ))}
      </div>
    </div>
  );
};

export default PostDetail;
