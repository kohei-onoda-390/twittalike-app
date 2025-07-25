import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CreatePosts from "./CreatePosts";

describe("CreatePosts", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onPostSuccess: jest.fn(),
    replyToPost: null,
  };

  test("モーダルが開いているときにフォームが表示される", () => {
    render(<CreatePosts {...defaultProps} />);
    expect(screen.getByPlaceholderText("いま何してる？")).toBeInTheDocument();
    expect(screen.getByText("投稿")).toBeInTheDocument();
  });

  test("モーダルが閉じているときは何も表示されない", () => {
    render(<CreatePosts {...defaultProps} isOpen={false} />);
    expect(
      screen.queryByPlaceholderText("いま何してる？")
    ).not.toBeInTheDocument();
  });

  test("投稿ボタンが表示される", () => {
    render(<CreatePosts {...defaultProps} />);
    expect(screen.getByRole("button", { name: "投稿" })).toBeInTheDocument();
  });

  test("投稿内容を入力すると文字数が反映される", () => {
    render(<CreatePosts {...defaultProps} />);
    const textarea = screen.getByPlaceholderText("いま何してる？");
    fireEvent.change(textarea, { target: { value: "テスト投稿" } });
    expect(
      screen.getByText((content) => content.replace(/\s/g, "") === "5/255")
    ).toBeInTheDocument();
  });
});
