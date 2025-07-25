import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import UserProfile from "./UserProfile";

jest.mock("axios");
jest.mock("./ProfileEditModal", () => () => (
  <div data-testid="profile-edit-modal" />
));
jest.mock("./PostCard", () => ({
  __esModule: true,
  default: ({ post }) => (
    <div data-testid="post-card">{post.text || "投稿"}</div>
  ),
}));

describe("UserProfile", () => {
  beforeEach(() => {
    localStorage.setItem("user_id", "testuser");
    localStorage.setItem("jwtToken", "dummy-token");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    const axios = require("axios");
    if (axios.get && axios.get.mockReset) axios.get.mockReset();
  });

  test("ローディング中は '読み込み中...' が表示される", () => {
    render(
      <MemoryRouter initialEntries={["/user/testuser"]}>
        <Routes>
          <Route path="/user/:userId" element={<UserProfile />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  test("ユーザーが見つからない場合はメッセージが表示される", async () => {
    const axios = require("axios");
    axios.get.mockResolvedValueOnce({ data: null });
    render(
      <MemoryRouter initialEntries={["/user/testuser"]}>
        <Routes>
          <Route path="/user/:userId" element={<UserProfile />} />
        </Routes>
      </MemoryRouter>
    );
    expect(
      await screen.findByText(
        /エラー:.*プロファイルデータの読み込みに失敗しました。/
      )
    ).toBeInTheDocument();
  });

  test("エラー時はエラーメッセージが表示される", async () => {
    const axios = require("axios");
    axios.get.mockRejectedValueOnce(new Error("エラー"));
    render(
      <MemoryRouter initialEntries={["/user/testuser"]}>
        <Routes>
          <Route path="/user/:userId" element={<UserProfile />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/エラー/)).toBeInTheDocument();
  });
});
