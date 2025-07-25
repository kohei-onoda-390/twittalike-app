import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PostList from "./PostList";

jest.mock("./PostCard", () => ({
  __esModule: true,
  default: ({ post }) => (
    <div data-testid="post-card">{post.text || "投稿"}</div>
  ),
}));
jest.mock("./UserRow", () => ({
  __esModule: true,
  default: ({ user }) => (
    <div data-testid="user-row">{user.name || "ユーザー"}</div>
  ),
}));

describe("PostList", () => {
  beforeEach(() => {
    localStorage.setItem("user_id", "testuser");
    localStorage.setItem("jwtToken", "dummy-token");
  });

  test("ホーム見出しが表示される", () => {
    render(
      <MemoryRouter>
        <PostList />
      </MemoryRouter>
    );
    expect(screen.getByText("ホーム")).toBeInTheDocument();
  });

  test("検索ボックスが表示される", () => {
    render(
      <MemoryRouter>
        <PostList />
      </MemoryRouter>
    );
    expect(
      screen.getByPlaceholderText("投稿とユーザーを検索")
    ).toBeInTheDocument();
  });

  test("おすすめ・フォロー中タブが表示される", () => {
    render(
      <MemoryRouter>
        <PostList />
      </MemoryRouter>
    );
    expect(screen.getByText("おすすめ")).toBeInTheDocument();
    expect(screen.getByText("フォロー中")).toBeInTheDocument();
  });
});
