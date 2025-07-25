import React from "react";
import { render, screen } from "@testing-library/react";
import MainLayout from "./MainLayout";

jest.mock("./Sidebar", () => ({
  __esModule: true,
  default: () => <div data-testid="sidebar" />,
}));
jest.mock("./CreatePosts", () => ({
  __esModule: true,
  default: () => <div data-testid="create-posts" />,
}));

describe("MainLayout", () => {
  beforeEach(() => {
    localStorage.setItem("jwtToken", "dummy-token");
  });

  test("SidebarとCreatePostsが表示される", () => {
    render(<MainLayout />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("create-posts")).toBeInTheDocument();
  });
});
