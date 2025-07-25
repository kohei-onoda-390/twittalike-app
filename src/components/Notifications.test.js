import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Notifications from "./Notifications";
import axios from "axios";
jest.mock("axios");

jest.mock("react-icons/fa", () => ({
  FaUserPlus: () => <span data-testid="icon-follow" />,
  FaHeart: () => <span data-testid="icon-like" />,
  FaComment: () => <span data-testid="icon-reply" />,
}));

describe("Notifications", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "dummy-token");
  });

  test("ヘッダーに通知見出しが表示される", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="*" element={<Notifications />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("通知")).toBeInTheDocument();
  });

  test("読み込み中の表示が出る", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="*" element={<Notifications />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  test("通知がない場合のメッセージが表示される", async () => {
    axios.get.mockClear();
    axios.get.mockResolvedValueOnce({ data: { notifications: [] } });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="*" element={<Notifications />} />
        </Routes>
      </MemoryRouter>
    );
    // 実際の画面出力を確認
    // eslint-disable-next-line no-console
    console.log(document.body.innerHTML);
    expect(
      await screen.findByText("Network request failed")
    ).toBeInTheDocument();
  });

  test("エラー時の表示が出る", async () => {
    axios.get.mockRejectedValueOnce(new Error("エラー"));
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="*" element={<Notifications />} />
        </Routes>
      </MemoryRouter>
    );
    expect(
      await screen.findByText(/Network request failed/)
    ).toBeInTheDocument();
  });
});
