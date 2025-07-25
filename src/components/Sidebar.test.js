import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "./Sidebar";

jest.mock("./icons/HomeIcon", () => ({
  HomeIcon: () => <span data-testid="home-icon" />,
}));
jest.mock("./icons/ProfileIcon", () => ({
  ProfileIcon: () => <span data-testid="profile-icon" />,
}));
jest.mock("./icons/BellIcon", () => ({
  BellIcon: () => <span data-testid="bell-icon" />,
}));

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "dummy-token");
    localStorage.setItem("user_id", "testuser");
  });

  test("ホームリンクが表示される", () => {
    render(
      <MemoryRouter>
        <Sidebar unreadCount={0} />
      </MemoryRouter>
    );
    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
  });

  test("プロフィールリンクが表示される", () => {
    render(
      <MemoryRouter>
        <Sidebar unreadCount={0} />
      </MemoryRouter>
    );
    expect(screen.getByText("プロフィール")).toBeInTheDocument();
    expect(screen.getByTestId("profile-icon")).toBeInTheDocument();
  });

  test("通知リンクと未読バッジが表示される", () => {
    render(
      <MemoryRouter>
        <Sidebar unreadCount={3} />
      </MemoryRouter>
    );
    expect(screen.getByText("通知")).toBeInTheDocument();
    expect(screen.getByTestId("bell-icon")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("投稿するボタンが表示される", () => {
    render(
      <MemoryRouter>
        <Sidebar unreadCount={0} />
      </MemoryRouter>
    );
    expect(screen.getByText("投稿する")).toBeInTheDocument();
  });

  test("ログアウトボタンをクリックするとlocalStorageがクリアされる", () => {
    render(
      <MemoryRouter>
        <Sidebar unreadCount={0} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("ログアウト"));
    expect(localStorage.getItem("jwtToken")).toBeNull();
    expect(localStorage.getItem("user_id")).toBeNull();
  });
});
