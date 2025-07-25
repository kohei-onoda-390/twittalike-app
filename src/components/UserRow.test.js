import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserRow from "./UserRow";
jest.mock("axios");

const mockUser = {
  userId: "testuser",
  name: "テストユーザー",
  avatarUrl: "/uploads/avatars/default.png",
  bio: "テスト用のプロフィール",
  isFollowedByCurrentUser: false,
};

describe("UserRow", () => {
  beforeEach(() => {
    localStorage.setItem("user_id", "otheruser");
    localStorage.setItem("jwtToken", "dummy-token");
  });

  test("ユーザー情報が表示される", () => {
    render(
      <MemoryRouter>
        <UserRow user={mockUser} />
      </MemoryRouter>
    );
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(`@${mockUser.userId}`)).toBeInTheDocument();
    expect(screen.getByText(mockUser.bio)).toBeInTheDocument();
    expect(screen.getByText("フォロー")).toBeInTheDocument();
  });

  test("自分自身の場合はフォローボタンが表示されない", () => {
    render(
      <MemoryRouter>
        <UserRow user={{ ...mockUser, userId: "otheruser" }} />
      </MemoryRouter>
    );
    expect(screen.queryByText("フォロー")).not.toBeInTheDocument();
  });

  test("フォローボタンをクリックするとonFollowChangeが呼ばれる", async () => {
    const axios = require("axios");
    axios.mockResolvedValueOnce({});
    const onFollowChange = jest.fn();
    render(
      <MemoryRouter>
        <UserRow user={mockUser} onFollowChange={onFollowChange} />
      </MemoryRouter>
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    // ボタン押下後の非同期処理とonFollowChangeの呼び出しを待つ
    await screen.findByText("フォロー中");
    await waitFor(() => {
      expect(onFollowChange).toHaveBeenCalledWith(mockUser.userId, true);
    });
  });
});
