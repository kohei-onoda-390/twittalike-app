import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreatedUsers from "./CreatedUsers";

describe("CreatedUsers", () => {
  test("登録完了メッセージが表示される", () => {
    render(
      <MemoryRouter>
        <CreatedUsers />
      </MemoryRouter>
    );
    expect(screen.getByText("ユーザー登録が完了しました")).toBeInTheDocument();
    expect(screen.getByText("ログインページへ")).toBeInTheDocument();
  });

  test("ログインページへボタンが表示される", () => {
    render(
      <MemoryRouter>
        <CreatedUsers />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("button", { name: "ログインページへ" })
    ).toBeInTheDocument();
  });
});
