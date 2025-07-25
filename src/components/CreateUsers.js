import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const CreateUser = () => {
  const [user_id, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 英数字のみチェック（半角英数字のみ）
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(user_id)) {
      setError("ユーザー名は英数字のみで入力してください。");
      return;
    }
    if (!alphanumericRegex.test(password)) {
      setError("パスワードは英数字のみで入力してください。");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/createuser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, password }),
      });

      const data = await response.json();

      if (response.status === 201) {
        navigate("/createdusers");
      } else {
        setError(data.message || "ユーザー登録失敗");
      }
    } catch (error) {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setLoading(false);
      setUserId("");
      setPassword("");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>ユーザー登録</h1>
        <div>
          <label htmlFor="user_id">ユーザー名：</label>
          <input
            id="user_id"
            type="text"
            value={user_id}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">パスワード：</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn">
          ユーザー登録
        </button>
        {loading && <p>登録中...</p>}
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default CreateUser;
