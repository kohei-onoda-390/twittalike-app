import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [user_id, setUser_id] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    setError(""); // エラーメッセージをリセット
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id, password }),
      });

      if (res.status === 200) {
        const data = await res.json();
        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("user_id", data.user_id); // user_id を localStorage に保存
        navigate("/");
      } else {
        const errorData = await res.json();
        setError(errorData.message || "ログインに失敗しました。");
      }
    } catch (err) {
      setError(
        "サーバーに接続できませんでした。ネットワークを確認してください。"
      );
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Twitta-like</h1>
        <div>
          <label htmlFor="user_id">ユーザID：</label>
          <input
            id="user_id"
            type="text"
            value={user_id}
            onChange={(e) => setUser_id(e.target.value)}
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
        <button type="submit">ログイン</button>
        {error && <p className="error-message">{error}</p>}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link to="/createuser">新規ユーザ登録はこちら</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
