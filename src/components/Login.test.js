import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";

describe("Login", () => {
  test("ログインフォームが表示される", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText("Twitta-like")).toBeInTheDocument();
    expect(screen.getByLabelText("ユーザID：")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード：")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ログイン" })
    ).toBeInTheDocument();
    expect(screen.getByText("新規ユーザ登録はこちら")).toBeInTheDocument();
  });

  test("ユーザID・パスワード入力で値が反映される", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText("ユーザID："), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("パスワード："), {
      target: { value: "testpass" },
    });
    expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    expect(screen.getByDisplayValue("testpass")).toBeInTheDocument();
  });

  test("エラー時にエラーメッセージが表示される", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
    // サーバーが起動していない場合など、エラーが表示される
    expect(
      await screen.findByText(/サーバーに接続できません|ログインに失敗しました/)
    ).toBeInTheDocument();
  });
});
