import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import CreateUser from "./components/CreateUsers";
import CreatedUsers from "./components/CreatedUsers";
import MainLayout from "./components/MainLayout";
import PostList from "./components/PostList";
import UserProfile from "./components/UserProfile";
import FollowList from "./components/FollowList"; // 新しいコンポーネントをインポート
import PostDetail from "./components/PostDetail"; // 新しいコンポーネントをインポート
import Notifications from "./components/Notifications"; // 新しいコンポーネントをインポート

function App() {
  return (
    <Routes>
      {/* ログイン・ユーザー登録関連の画面 */}
      <Route path="/login" element={<Login />} />
      <Route path="/createuser" element={<CreateUser />} />
      <Route path="/createdusers" element={<CreatedUsers />} />

      {/* ログイン後のメイン画面 (サイドバー付き) */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<PostList />} />
        <Route path="profile/:userId" element={<UserProfile />} />
        <Route path="profile/:userId/following" element={<FollowList />} />
        <Route path="profile/:userId/followers" element={<FollowList />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="post/:postId" element={<PostDetail />} />
      </Route>

      {/* 不明なURLはログイン画面へリダイレクト */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
