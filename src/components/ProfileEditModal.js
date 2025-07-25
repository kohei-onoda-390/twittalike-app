import React, { useState, useEffect } from "react";
import "./ProfileEditModal.css"; // 新しいCSSファイル

const ProfileEditModal = ({ isOpen, onClose, onSave, currentUserData }) => {
  const [editedName, setEditedName] = useState("");
  const [editedBio, setEditedBio] = useState("");

  useEffect(() => {
    // モーダルが開かれるたびに、現在のユーザーデータでフォームを初期化する
    if (currentUserData) {
      setEditedName(currentUserData.name || "");
      setEditedBio(currentUserData.bio || "");
    }
  }, [currentUserData, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = (e) => {
    e.preventDefault();
    onSave({ name: editedName, bio: editedBio });
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter または Cmd+Enterで保存
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault(); // デフォルトのEnterキーの動作（改行など）を防ぐ
      handleSave(e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSave} onKeyDown={handleKeyDown}>
          <div className="modal-header">
            <button
              type="button"
              className="close-modal-btn"
              onClick={onClose}
              aria-label="閉じる"
            >
              &times;
            </button>
            <h2>プロフィールを編集</h2>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">名前</label>
              <input
                id="name"
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="bio">自己紹介</label>
              <textarea
                id="bio"
                rows="4"
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="submit" className="save-btn">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
