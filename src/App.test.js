import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import axios from "axios";

jest.mock("axios");

describe("App routing", () => {
  test("/login で Login コンポーネントが表示される", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/ログイン/i)).toBeInTheDocument();
  });

  test("不明なURLは /login にリダイレクトされる", () => {
    render(
      <MemoryRouter initialEntries={["/unknown"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/ログイン/i)).toBeInTheDocument();
  });
});
