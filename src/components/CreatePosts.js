import React, { useState, useEffect, useRef } from "react";
import "./CreatePosts.css"; // 新規作成するCSS

const CreatePosts = ({ isOpen, onClose, onPostSuccess, replyToPost }) => {
  const [postBody, setPostBody] = useState("");
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);

  const jwtToken = localStorage.getItem("jwtToken");

  useEffect(() => {
    // モーダルが開いたときにテキストエリアにフォーカスを当てる
    if (isOpen) {
      // setTimeoutを使うことで、モーダルの表示アニメーション後にフォーカスが当たるようにする
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100); // 100ミリ秒の遅延
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleTextChange = (e) => {
    const text = e.target.value;
    if (text.length <= 255) {
      setPostBody(text);
      setCharCount(text.length);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl + Enterで投稿
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault(); // テキストエリアでの改行を防ぐ
      handleSubmit(); // 投稿処理を実行
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); // 通常のフォーム送信イベントをキャンセル
    setError("");

    if (!postBody.trim()) {
      setError("投稿内容を入力してください。");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/createposts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json", // 明示的にJSONを期待することを追加
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          post_body: postBody,
          reply_to_post_id: replyToPost ? replyToPost.post_id : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "投稿に失敗しました。");
      }

      // 投稿成功後、一覧を再取得するように親コンポーネントに通知
      onPostSuccess();
      setPostBody(""); // テキストエリアをクリア
      setCharCount(0);
      onClose(); // モーダルを閉じる
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-modal-btn"
          onClick={onClose}
          aria-label="閉じる"
        >
          &times;
        </button>
        <form onSubmit={handleSubmit}>
          <h2>新規投稿</h2>
          {replyToPost && (
            <div className="reply-info">
              <p>返信先: @{replyToPost.post_user}</p>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={postBody}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="いま何してる？"
            rows="5"
            maxLength="255"
            required
          ></textarea>
          <div className="modal-footer">
            <span className="char-count">{charCount} / 255</span>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="post-submit-btn">
              投稿
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePosts;
