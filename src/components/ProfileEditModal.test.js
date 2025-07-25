import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileEditModal from "./ProfileEditModal";

describe("ProfileEditModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    currentUserData: { name: "テストユーザー", bio: "自己紹介" },
  };

  test("モーダルが開いているときにフォームが表示される", () => {
    render(<ProfileEditModal {...defaultProps} />);
    expect(screen.getByLabelText("名前")).toBeInTheDocument();
    expect(screen.getByLabelText("自己紹介")).toBeInTheDocument();
    expect(screen.getByText("保存")).toBeInTheDocument();
  });

  test("モーダルが閉じているときは何も表示されない", () => {
    render(<ProfileEditModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByLabelText("名前")).not.toBeInTheDocument();
  });

  test("保存ボタンをクリックするとonSaveが呼ばれる", () => {
    render(<ProfileEditModal {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("名前"), {
      target: { value: "新しい名前" },
    });
    fireEvent.change(screen.getByLabelText("自己紹介"), {
      target: { value: "新しい自己紹介" },
    });
    fireEvent.click(screen.getByText("保存"));
    expect(defaultProps.onSave).toHaveBeenCalledWith({
      name: "新しい名前",
      bio: "新しい自己紹介",
    });
  });

  test("閉じるボタンをクリックするとonCloseが呼ばれる", () => {
    render(<ProfileEditModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("閉じる"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
