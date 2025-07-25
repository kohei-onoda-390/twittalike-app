import React from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const CreatedUsers = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 style={{ fontSize: "24px", textAlign: "center" }}>
          ユーザー登録が完了しました
        </h1>
        <button onClick={() => navigate("/")} className="btn">
          ログインページへ
        </button>
      </div>
    </div>
  );
};

export default CreatedUsers;
