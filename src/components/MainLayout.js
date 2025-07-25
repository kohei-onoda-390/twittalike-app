import React, { useState, useCallback, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import CreatePosts from "./CreatePosts";
import "./ViewPosts.css"; // 既存のCSSを流用

const MainLayout = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyToPost, setReplyToPost] = useState(null); // リプライ対象の投稿を保持
  const [unreadCount, setUnreadCount] = useState(0); // 未読件数用のstate
  // 投稿が成功したことを示すためのカウンター。この値が変わると子コンポーネントが再レンダリングされる。
  const [postSuccessCount, setPostSuccessCount] = useState(0);
  const jwtToken = localStorage.getItem("jwtToken");

  // 未読件数を更新する関数
  const fetchUnreadCount = useCallback(async () => {
    if (!jwtToken) return;
    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications/unread-count",
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [jwtToken]);

  const handleOpenModal = () => {
    setReplyToPost(null); // 通常の投稿なのでリプライ対象はnull
    setIsModalOpen(true);
  };

  const handleOpenReplyModal = (post) => {
    setReplyToPost(post); // リプライ対象の投稿をセット
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  // 投稿成功時にカウントをインクリメントして子コンポーネントを更新させる
  const handlePostSuccess = useCallback(() => {
    setPostSuccessCount((prev) => prev + 1);
    fetchUnreadCount(); // 投稿（リプライ）成功時に通知が増える可能性があるので再取得
  }, [fetchUnreadCount]);

  // MainLayoutがマウントされた時と、投稿成功時に件数を取得
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount, postSuccessCount]);

  return (
    <div className="viewpost-container">
      <Sidebar onOpenModal={handleOpenModal} unreadCount={unreadCount} />
      <main className="post-list">
        <Outlet
          context={{ postSuccessCount, handleOpenReplyModal, fetchUnreadCount }}
        />
      </main>
      <CreatePosts
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPostSuccess={handlePostSuccess}
        replyToPost={replyToPost}
      />
    </div>
  );
};

export default MainLayout;
