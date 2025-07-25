import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateUser from "./CreateUsers";

describe("CreateUser", () => {
  test("ユーザー登録フォームが表示される", () => {
    render(
      <MemoryRouter>
        <CreateUser />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: "ユーザー登録" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("ユーザー名：")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード：")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ユーザー登録" })
    ).toBeInTheDocument();
  });

  test("ユーザー名・パスワード入力で値が反映される", () => {
    render(
      <MemoryRouter>
        <CreateUser />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText("ユーザー名："), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("パスワード："), {
      target: { value: "testpass" },
    });
    expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    expect(screen.getByDisplayValue("testpass")).toBeInTheDocument();
  });

  test("英数字以外のユーザー名でエラーが表示される", () => {
    render(
      <MemoryRouter>
        <CreateUser />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText("ユーザー名："), {
      target: { value: "テスト!" },
    });
    fireEvent.change(screen.getByLabelText("パスワード："), {
      target: { value: "testpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ユーザー登録" }));
    expect(
      screen.getByText("ユーザー名は英数字のみで入力してください。")
    ).toBeInTheDocument();
  });

  test("英数字以外のパスワードでエラーが表示される", () => {
    render(
      <MemoryRouter>
        <CreateUser />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText("ユーザー名："), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("パスワード："), {
      target: { value: "パス!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ユーザー登録" }));
    expect(
      screen.getByText("パスワードは英数字のみで入力してください。")
    ).toBeInTheDocument();
  });
});
