import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "./Searchbar";

describe("SearchBar", () => {
  test("入力欄が表示される", () => {
    render(<SearchBar searchQuery="" setSearchQuery={() => {}} />);
    expect(
      screen.getByPlaceholderText("投稿またはユーザーを検索")
    ).toBeInTheDocument();
  });

  test("入力値が反映される", () => {
    render(<SearchBar searchQuery="テスト" setSearchQuery={() => {}} />);
    expect(screen.getByDisplayValue("テスト")).toBeInTheDocument();
  });

  test("入力イベントでsetSearchQueryが呼ばれる", () => {
    const setSearchQuery = jest.fn();
    render(<SearchBar searchQuery="" setSearchQuery={setSearchQuery} />);
    fireEvent.change(screen.getByPlaceholderText("投稿またはユーザーを検索"), {
      target: { value: "新しい検索" },
    });
    expect(setSearchQuery).toHaveBeenCalledWith("新しい検索");
  });
});
