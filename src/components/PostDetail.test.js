import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PostDetail from "./PostDetail";

jest.mock("./PostCard", () => ({
  __esModule: true,
  default: ({ post }) => (
    <div data-testid="post-card">{post.text || "投稿"}</div>
  ),
}));

describe("PostDetail", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.setItem("user_id", "testuser");
    localStorage.setItem("jwtToken", "dummy-token");
  });

  test("読み込み中の表示が出る", () => {
    render(
      <MemoryRouter>
        <PostDetail />
      </MemoryRouter>
    );
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  test("エラー時の表示が出る", async () => {
    jest.restoreAllMocks();
    // axios.getを失敗でモック
    jest
      .spyOn(require("axios"), "get")
      .mockRejectedValueOnce(new Error("エラー"));
    render(
      <MemoryRouter>
        <PostDetail />
      </MemoryRouter>
    );
    expect(
      await screen.findByText(/投稿の読み込みに失敗しました/)
    ).toBeInTheDocument();
  });

  test("ヘッダーにポスト見出しが表示される", async () => {
    jest.restoreAllMocks();
    // axios.getを成功でモック
    jest.spyOn(require("axios"), "get").mockResolvedValueOnce({
      data: { ancestors: [], mainPost: { post_id: 1 }, replies: [] },
    });
    render(
      <MemoryRouter>
        <PostDetail />
      </MemoryRouter>
    );
    expect(await screen.findByText("ポスト")).toBeInTheDocument();
  });
});
