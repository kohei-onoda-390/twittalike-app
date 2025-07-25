import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PostCard from "./PostCard";

describe("PostCard", () => {
  const mockPost = {
    post_id: 1,
    post_user: "testuser",
    user_name: "テストユーザー",
    avatar_url: "https://example.com/avatar.png",
    post_body: "テスト投稿本文",
    post_time: Date.now(),
    reply_count: 2,
    likes_count: 5,
    user_has_liked: false,
  };

  test("投稿内容が表示される", () => {
    render(
      <MemoryRouter>
        <PostCard post={mockPost} currentUserId="otheruser" />
      </MemoryRouter>
    );
    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByText("テスト投稿本文")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  test("自分の投稿の場合は削除ボタンが表示される", () => {
    render(
      <MemoryRouter>
        <PostCard
          post={mockPost}
          currentUserId="testuser"
          onDelete={jest.fn()}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("削除")).toBeInTheDocument();
  });

  test("削除ボタンをクリックするとonDeleteが呼ばれる", () => {
    const onDelete = jest.fn();
    render(
      <MemoryRouter>
        <PostCard
          post={mockPost}
          currentUserId="testuser"
          onDelete={onDelete}
        />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("削除"));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  test("いいねボタンをクリックするとonLikeが呼ばれる", () => {
    const onLike = jest.fn();
    render(
      <MemoryRouter>
        <PostCard post={mockPost} currentUserId="otheruser" onLike={onLike} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText("いいね"));
    expect(onLike).toHaveBeenCalledWith(1, false);
  });

  test("返信ボタンをクリックするとonReplyが呼ばれる", () => {
    const onReply = jest.fn();
    render(
      <MemoryRouter>
        <PostCard post={mockPost} currentUserId="otheruser" onReply={onReply} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText("返信する"));
    expect(onReply).toHaveBeenCalledWith(mockPost);
  });
});
