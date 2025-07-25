import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./Notifications.css";
import { FaUserPlus, FaHeart, FaComment } from "react-icons/fa"; // アイコン表示用のライブラリ例

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // MainLayoutから渡されたcontextを取得
  const outletContext = useOutletContext() || {};
  const { fetchUnreadCount } = outletContext;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          navigate("/login");
          return;
        }
        // APIのURLは環境に合わせて修正してください
        const response = await fetch(
          "http://localhost:5000/api/notifications",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate("/login");
          }
          throw new Error("通知の取得に失敗しました。");
        }

        const data = await response.json();
        // APIは通知の配列を直接返すため、dataをそのままセットします
        setNotifications(data);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // ページを開いた時点で未読件数を再計算させる
    if (fetchUnreadCount) {
      fetchUnreadCount();
    }
  }, [navigate, fetchUnreadCount]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "follow":
        return <FaUserPlus className="notification-icon follow" />;
      case "like":
        return <FaHeart className="notification-icon like" />;
      case "reply":
        return <FaComment className="notification-icon reply" />;
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification) => {
    const { notification_id, type, actor_id, target_id, is_read } =
      notification;

    // 未読の場合のみAPIを呼び出して既読にする
    if (!is_read) {
      try {
        const token = localStorage.getItem("jwtToken");
        await fetch(
          `http://localhost:5000/api/notifications/${notification_id}/read`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // フロントエンドの表示も即時更新
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notification_id ? { ...n, is_read: true } : n
          )
        );
        // バッジのカウントを更新するためにMainLayoutの関数を呼び出す
        if (fetchUnreadCount) {
          fetchUnreadCount();
        }
      } catch (err) {
        console.error("Failed to mark notification as read", err);
        // API呼び出しに失敗してもページ遷移は行う
      }
    }

    if (type === "follow") {
      navigate(`/profile/${actor_id}`);
    } else {
      navigate(`/post/${target_id}`);
    }
  };

  const renderNotificationItem = (notification) => {
    const {
      notification_id,
      type,
      actor_id,
      actor_name,
      actor_avatar,
      post_body,
      is_read,
    } = notification;

    // アバターやユーザー名がクリックされたときに、アイテム全体のクリック（ページ遷移）をさせないようにする
    const goToActorProfile = (e) => {
      e.stopPropagation();
      navigate(`/profile/${actor_id}`);
    };

    return (
      <div
        key={notification_id}
        className={`notification-item ${!is_read ? "unread" : ""}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="notification-icon-container">
          {getNotificationIcon(type)}
        </div>
        <div className="notification-content">
          <img
            src={actor_avatar || "/default-avatar.png"}
            alt={actor_name}
            className="notification-avatar"
            onClick={goToActorProfile}
          />
          <div className="notification-text">
            <p>
              <strong className="sender-name" onClick={goToActorProfile}>
                {actor_name}
              </strong>
              {type === "follow" && "さんがあなたをフォローしました。"}
              {type === "like" && "さんがあなたの投稿にいいねしました。"}
              {type === "reply" && "さんがあなたの投稿に返信しました。"}
            </p>
            {post_body && type !== "reply" && (
              <div className="notification-post-context">{post_body}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <button
          onClick={() => navigate(-1)}
          className="back-btn"
          aria-label="戻る"
        >
          &larr;
        </button>
        <h2>通知</h2>
      </div>
      <div className="notifications-list">
        {loading && <p className="message">読み込み中...</p>}
        {error && <p className="message error">{error}</p>}
        {!loading && !error && notifications.length === 0 && (
          <p className="message">通知はまだありません。</p>
        )}
        {!loading && !error && notifications.map(renderNotificationItem)}
      </div>
    </div>
  );
};

export default Notifications;
