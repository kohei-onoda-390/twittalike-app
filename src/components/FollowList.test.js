import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import FollowList from "./FollowList";
import axios from "axios";

jest.mock("./UserRow", () => ({
  __esModule: true,
  default: ({ user }) => (
    <div data-testid="user-row">{user.name || "ユーザー"}</div>
  ),
}));

describe("FollowList", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "dummy-token");
    jest.spyOn(axios, "get").mockImplementation((url) => {
      if (url.includes("/users/")) {
        return Promise.resolve({
          data: { name: "テストユーザー", userId: "testuser" },
        });
      }
      if (url.includes("/following") || url.includes("/followers")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("読み込み中の表示が出る", () => {
    render(
      <MemoryRouter initialEntries={["/profile/testuser/following"]}>
        <Routes>
          <Route path="/profile/:userId/following" element={<FollowList />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  test("エラー時の表示が出る", async () => {
    jest
      .spyOn(axios, "get")
      .mockImplementation(() => Promise.reject(new Error("APIエラー")));
    render(
      <MemoryRouter initialEntries={["/profile/testuser/following"]}>
        <Routes>
          <Route path="/profile/:userId/following" element={<FollowList />} />
        </Routes>
      </MemoryRouter>
    );
    expect(
      await screen.findByText("ユーザーリストの取得に失敗しました。")
    ).toBeInTheDocument();
  });

  test("フォロー中・フォロワータブが表示される", async () => {
    render(
      <MemoryRouter initialEntries={["/profile/testuser/following"]}>
        <Routes>
          <Route path="/profile/:userId/following" element={<FollowList />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText("フォロー中")).toBeInTheDocument();
    expect(await screen.findByText("フォロワー")).toBeInTheDocument();
  });
});
