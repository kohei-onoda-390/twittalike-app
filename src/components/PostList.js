import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./ViewPosts.css";
import PostCard from "./PostCard"; // PostCardコンポーネントをインポート
import UserRow from "./UserRow"; // UserRowコンポーネントをインポート
import axios from "axios";

const PostList = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const { postSuccessCount, handleOpenReplyModal } = outletContext;
  const currentUserId = localStorage.getItem("user_id");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // タイムラインタブ用のstate
  const [timelineTab, setTimelineTab] = useState("recommend"); // 'recommend' or 'following'
  // 検索機能用のstate
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' or 'users'

  const jwtToken = localStorage.getItem("jwtToken");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    // タブに応じてエンドポイントを切り替える
    const endpoint =
      timelineTab === "following"
        ? "http://localhost:5000/posts/following"
        : "http://localhost:5000/posts";
    try {
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})); // エラーレスポンスがJSONでない場合に備える
        throw new Error(errorData.message || "投稿の取得に失敗しました。");
      }
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
      console.error(err); // デバッグ用にコンソールにもエラーを出力
    } finally {
      setLoading(false);
    }
  }, [jwtToken, timelineTab]);

  useEffect(() => {
    if (!currentUserId || !jwtToken) {
      navigate("/login");
      return;
    }
    // 検索結果が表示されている場合は、タイムラインの投稿は取得しない
    if (searchResults) return;

    fetchPosts();
  }, [
    jwtToken,
    currentUserId,
    navigate,
    fetchPosts,
    postSuccessCount,
    searchResults,
  ]);

  const handleTimelineTabChange = (tab) => {
    // 既にアクティブなタブをクリックした場合は何もしない
    if (timelineTab === tab) return;

    // タイムラインのタブを切り替える際に検索状態をリセットする
    setTimelineTab(tab);
    setSearchResults(null);
    setSearchTerm(""); // 検索ボックスの入力もクリア
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      setSearchResults(null); // 検索ワードが空なら検索結果をリセット
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    try {
      const [postsRes, usersRes] = await Promise.all([
        axios.get(`http://localhost:5000/search/posts?q=${query}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }),
        axios.get(`http://localhost:5000/search/users?q=${query}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }),
      ]);
      setSearchResults({
        posts: postsRes.data,
        users: usersRes.data,
      });
      setActiveTab("posts"); // デフォルトは投稿タブ
    } catch (err) {
      console.error("Search failed:", err);
      setError("検索に失敗しました。");
      setSearchResults({ posts: [], users: [] }); // エラー時も空の結果をセット
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (postId) => {
    try {
      const res = await fetch(`http://localhost:5000/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      if (res.ok) {
        setPosts(posts.filter((post) => post.post_id !== postId));
      } else {
        const errorData = await res.json();
        alert(`削除に失敗しました: ${errorData.message || res.statusText}`);
      }
    } catch (err) {
      alert("削除中にネットワークエラーが発生しました。");
    }
  };

  const handleLikeToggle = async (postId, hasLiked) => {
    const method = hasLiked ? "DELETE" : "POST";
    try {
      const res = await fetch(`http://localhost:5000/posts/${postId}/like`, {
        method,
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (res.ok) {
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
      } else {
        const errorData = await res.json();
        alert(`いいねに失敗しました: ${errorData.message || res.statusText}`);
      }
    } catch (err) {
      alert("いいね操作中にネットワークエラーが発生しました。");
    }
  };

  const handleFollowChange = (targetUserId, isFollowed) => {
    if (searchResults) {
      setSearchResults((prevResults) => ({
        ...prevResults,
        users: prevResults.users.map((user) =>
          user.userId === targetUserId
            ? { ...user, isFollowedByCurrentUser: isFollowed }
            : user
        ),
      }));
    }
  };

  return (
    <>
      <div className="post-list-header">
        <h2>ホーム</h2>
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="search"
            placeholder="投稿とユーザーを検索"
            className="search-box"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>

      {isSearching && <p>検索中...</p>}

      {searchResults ? (
        // 検索結果表示
        <>
          <div className="search-results-tabs">
            <button
              className={`search-results-tab ${
                activeTab === "posts" ? "active" : ""
              }`}
              onClick={() => setActiveTab("posts")}
            >
              投稿
            </button>
            <button
              className={`search-results-tab ${
                activeTab === "users" ? "active" : ""
              }`}
              onClick={() => setActiveTab("users")}
            >
              ユーザー
            </button>
          </div>
          <div className="posts-list-inner">
            {activeTab === "posts" &&
              (searchResults.posts.length > 0 ? (
                searchResults.posts.map((post) => (
                  <PostCard
                    key={post.post_id}
                    post={post}
                    onLike={handleLikeToggle}
                    onReply={handleOpenReplyModal}
                  />
                ))
              ) : (
                <p className="no-results-message">
                  投稿が見つかりませんでした。
                </p>
              ))}
            {activeTab === "users" &&
              (searchResults.users.length > 0 ? (
                searchResults.users.map((user) => (
                  <UserRow
                    key={user.userId}
                    user={user}
                    onFollowChange={handleFollowChange}
                  />
                ))
              ) : (
                <p className="no-results-message">
                  ユーザーが見つかりませんでした。
                </p>
              ))}
          </div>
        </>
      ) : (
        // 通常のタイムライン表示
        <>
          <div className="timeline-tabs">
            <button
              className={`timeline-tab ${
                timelineTab === "recommend" ? "active" : ""
              }`}
              onClick={() => handleTimelineTabChange("recommend")}
            >
              おすすめ
            </button>
            <button
              className={`timeline-tab ${
                timelineTab === "following" ? "active" : ""
              }`}
              onClick={() => handleTimelineTabChange("following")}
            >
              フォロー中
            </button>
          </div>
          {loading && <p>読み込み中...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && posts.length === 0 && (
            <p className="no-results-message">
              {timelineTab === "following"
                ? "フォローしているユーザーの投稿はまだありません。"
                : "投稿がありません。"}
            </p>
          )}
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
        </>
      )}
    </>
  );
};

export default PostList;
