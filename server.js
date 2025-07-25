require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// --- アバター画像アップロード設定 ---
const uploadDir = path.join(__dirname, "uploads/avatars");
// ディレクトリが存在しない場合は作成
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      req.user.user_id + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB制限
  fileFilter: (req, file, cb) => {
    // 許可するMIMEタイプと拡張子
    const filetypes = /^image\/(jpeg|jpg|png|gif)$/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = /\.(jpeg|jpg|png|gif)$/i.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    // 不正なファイルタイプの場合は必ずreturnで終了
    return cb(
      new Error("画像ファイル（jpeg, jpg, png, gif）のみアップロードできます。")
    );
  },
});

// JWTトークンを検証するミドルウェア
const authenticateToken = (req, res, next) => {
  // "Bearer TOKEN" という形式のヘッダーを取得
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ message: "認証トークンが必要です。" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "トークンが無効です。" });
    req.user = user;
    next();
  });
};

// ログインAPI（既存）
app.post("/login", async (req, res) => {
  const { user_id, password } = req.body;
  db.query(
    "SELECT * FROM user001 WHERE user_id = ?",
    [user_id],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "DBエラー" });

      if (results.length === 0) {
        return res
          .status(401)
          .json({ message: "ユーザー名かパスワードが違います" });
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        // JWTを生成
        const token = jwt.sign(
          { user_id: user.user_id },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        res.status(200).json({ token, user_id: user.user_id });
      } else {
        res.status(401).json({ message: "ユーザー名かパスワードが違います" });
      }
    }
  );
});

// ユーザー作成API（既存）
app.post("/createuser", async (req, res) => {
  const { user_id, password } = req.body;
  db.query(
    "SELECT * FROM user001 WHERE user_id = ?",
    [user_id],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "DBエラー" });
      if (results.length > 0) {
        return res.status(409).json({ message: "ユーザー名は既に存在します" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const defaultName = user_id;
      const defaultBio = "よろしくお願いします";
      const defaultAvatarUrl =
        "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
      db.query(
        "INSERT INTO user001 (user_id, password, user_name, bio, avatar_url) VALUES (?, ?, ?, ?, ?)",
        [user_id, hashedPassword, defaultName, defaultBio, defaultAvatarUrl],
        (err2) => {
          if (err2) {
            console.error(err2);
            return res
              .status(500)
              .json({ message: "ユーザーの登録に失敗しました。" });
          }
          res.status(201).json({ message: "ユーザー登録完了" });
        }
      );
    }
  );
});

// 投稿一覧取得API（追加）
app.get("/posts", authenticateToken, (req, res) => {
  const loggedInUserId = req.user.user_id;
  // 投稿一覧に、各投稿のいいね数と、ログイン中のユーザーがいいねしているかどうかの情報を含める
  const sql = `
    SELECT
      p.post_id,
      p.post_user,
      p.post_body,
      p.post_time,
      u.user_name,
      u.avatar_url,
      (SELECT COUNT(*) FROM post001 WHERE reply_to_post_id = p.post_id) AS reply_count,
      (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id) AS likes_count,
      (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id AND user_id = ?) > 0 AS user_has_liked
    FROM
      post001 AS p
    LEFT JOIN
      user001 AS u ON p.post_user = u.user_id
    WHERE
      p.reply_to_post_id IS NULL
    ORDER BY
      p.post_time DESC
  `;
  db.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "投稿の取得に失敗しました。" });
    }
    const posts = results.map((post) => {
      let avatarUrl = post.avatar_url;
      if (!avatarUrl) {
        avatarUrl =
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
      } else if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = `${
          process.env.SERVER_BASE_URL || "http://localhost:5000"
        }${avatarUrl}`;
      }
      return {
        ...post,
        user_name: post.user_name || post.post_user,
        avatar_url: avatarUrl,
        user_has_liked: !!post.user_has_liked,
      };
    });
    res.json(posts);
  });
});

// フォローしているユーザーの投稿一覧取得API
app.get("/posts/following", authenticateToken, (req, res) => {
  const loggedInUserId = req.user.user_id;
  // ログインユーザーがフォローしているユーザーの投稿（リプライは除く）を取得する
  const sql = `
    SELECT
      p.post_id,
      p.post_user,
      p.post_body,
      p.post_time,
      u.user_name,
      u.avatar_url,
      (SELECT COUNT(*) FROM post001 WHERE reply_to_post_id = p.post_id) AS reply_count,
      (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id) AS likes_count,
      (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id AND user_id = ?) > 0 AS user_has_liked
    FROM
      post001 AS p
    LEFT JOIN
      user001 AS u ON p.post_user = u.user_id
    WHERE
      p.post_user IN (SELECT following_id FROM follow001 WHERE follower_id = ?)
      AND p.reply_to_post_id IS NULL
    ORDER BY
      p.post_time DESC
  `;
  db.query(sql, [loggedInUserId, loggedInUserId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "投稿の取得に失敗しました。" });
    }
    const posts = results.map((post) => {
      let avatarUrl = post.avatar_url;
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = `${
          process.env.SERVER_BASE_URL || "http://localhost:5000"
        }${avatarUrl}`;
      }
      return {
        ...post,
        user_name: post.user_name || post.post_user,
        avatar_url: avatarUrl,
        user_has_liked: !!post.user_has_liked,
      };
    });
    res.json(posts);
  });
});

// 投稿作成API (CreatePosts.jsから呼ばれる)
app.post("/createposts", authenticateToken, (req, res) => {
  const { post_body, reply_to_post_id } = req.body;
  const post_user = req.user.user_id;

  if (!post_body || post_body.trim() === "") {
    return res.status(400).json({ message: "投稿内容が空です。" });
  }

  if (post_body.length > 255) {
    return res
      .status(400)
      .json({ message: "投稿は255文字以内で入力してください。" });
  }

  const sql =
    "INSERT INTO post001 (post_user, post_body, post_time, reply_to_post_id) VALUES (?, ?, NOW(), ?)";
  db.query(
    sql,
    [post_user, post_body, reply_to_post_id || null],
    (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "データベースへの投稿に失敗しました。" });
      }

      // --- リプライ通知の作成 ---
      if (reply_to_post_id) {
        const getPostAuthorSql =
          "SELECT post_user FROM post001 WHERE post_id = ?";
        db.query(getPostAuthorSql, [reply_to_post_id], (err, postResults) => {
          if (err || postResults.length === 0) return;
          const postAuthorId = postResults[0].post_user;

          // 自分自身へのリプライでは通知しない
          if (postAuthorId !== post_user) {
            const notificationSql =
              "INSERT INTO notification001 (user_id, actor_id, type, target_id) VALUES (?, ?, 'reply', ?)";
            db.query(
              notificationSql,
              [postAuthorId, post_user, reply_to_post_id],
              (err, notifResult) => {
                if (err)
                  console.error("Failed to create reply notification:", err);
              }
            );
          }
        });
      }
      res
        .status(201)
        .json({ message: "投稿しました。", insertId: results.insertId });
    }
  );
});

// 投稿詳細取得API (リプライと親投稿をすべて取得)
app.get("/posts/:postId", authenticateToken, async (req, res) => {
  const { postId } = req.params;
  const loggedInUserId = req.user.user_id;

  const createPostObject = (post) => {
    if (!post) return null;
    let avatarUrl = post.avatar_url;
    if (!avatarUrl) {
      avatarUrl =
        "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
    } else if (avatarUrl && !avatarUrl.startsWith("http")) {
      avatarUrl = `${
        process.env.SERVER_BASE_URL || "http://localhost:5000"
      }${avatarUrl}`;
    }
    return {
      ...post,
      user_name: post.user_name || post.post_user,
      avatar_url: avatarUrl,
      user_has_liked: !!post.user_has_liked,
    };
  };

  const getPostById = (id) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, u.user_name, u.avatar_url,
               (SELECT COUNT(*) FROM post001 WHERE reply_to_post_id = p.post_id) AS reply_count,
               (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id) AS likes_count,
               (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id AND user_id = ?) > 0 AS user_has_liked
        FROM post001 p
        LEFT JOIN user001 u ON p.post_user = u.user_id
        WHERE p.post_id = ?
      `;
      db.query(sql, [loggedInUserId, id], (err, results) => {
        if (err) return reject(err);
        resolve(results[0] || null);
      });
    });
  };

  try {
    let mainPost = await getPostById(postId);
    if (!mainPost) {
      return res.status(404).json({ message: "投稿が見つかりません。" });
    }

    const ancestors = [];
    let currentPostForAncestor = mainPost;
    while (currentPostForAncestor && currentPostForAncestor.reply_to_post_id) {
      const parentPost = await getPostById(
        currentPostForAncestor.reply_to_post_id
      );
      if (parentPost) {
        ancestors.unshift(parentPost);
        currentPostForAncestor = parentPost;
      } else {
        break;
      }
    }

    const repliesSql = `
      SELECT p.*, u.user_name, u.avatar_url,
             (SELECT COUNT(*) FROM post001 WHERE reply_to_post_id = p.post_id) AS reply_count,
             (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id) AS likes_count,
             (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id AND user_id = ?) > 0 AS user_has_liked
      FROM post001 p
      LEFT JOIN user001 u ON p.post_user = u.user_id
      WHERE p.reply_to_post_id = ?
      ORDER BY p.post_time ASC`;
    db.query(repliesSql, [loggedInUserId, postId], (err, repliesResults) => {
      if (err)
        return res
          .status(500)
          .json({ message: "リプライの取得に失敗しました。" });
      res.json({
        ancestors: ancestors.map(createPostObject),
        mainPost: createPostObject(mainPost),
        replies: repliesResults.map(createPostObject),
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "投稿の取得中にエラーが発生しました。" });
  }
});

// いいね登録API（追加）
app.post("/posts/:postId/like", authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.user_id;
  const sql = "INSERT INTO like001 (post_id, user_id) VALUES (?, ?)";
  db.query(sql, [postId, userId], (err, results) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "既にいいねしています。" });
      }
      console.error(err);
      return res.status(500).json({ message: "いいねに失敗しました。" });
    }

    // --- いいね通知の作成 ---
    const getPostAuthorSql = "SELECT post_user FROM post001 WHERE post_id = ?";
    db.query(getPostAuthorSql, [postId], (err, postResults) => {
      if (err || postResults.length === 0) return;
      const postAuthorId = postResults[0].post_user;

      // 自分自身の投稿へのいいねでは通知しない
      if (postAuthorId !== userId) {
        const notificationSql =
          "INSERT INTO notification001 (user_id, actor_id, type, target_id) VALUES (?, ?, 'like', ?)";
        db.query(
          notificationSql,
          [postAuthorId, userId, postId],
          (err, notifResult) => {
            if (err) console.error("Failed to create like notification:", err);
          }
        );
      }
    });

    res.status(201).json({ message: "いいねしました。" });
  });
});

// いいね削除API（追加）
app.delete("/posts/:postId/like", authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.user_id;
  const sql = "DELETE FROM like001 WHERE post_id = ? AND user_id = ?";
  db.query(sql, [postId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "いいねの取り消しに失敗しました。" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "いいねされていません。" });
    }
    res.status(200).json({ message: "いいねを取り消しました。" });
  });
});

// 投稿削除API（追加）
app.delete("/posts/:postId", authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const loggedInUserId = req.user.user_id;

  const sql = "DELETE FROM post001 WHERE post_id = ? AND post_user = ?";
  db.query(sql, [postId, loggedInUserId], (err, results) => {
    // ログインユーザーと投稿者が一致する場合のみ削除を許可
    //db.query("DELETE FROM posts WHERE post_id = ?", [postId], (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: "投稿の削除に失敗しました。" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "該当する投稿がありません。" });
    }
    res.status(200).json({ message: "投稿を削除しました。" });
  });
});

// ユーザー情報取得API (UserProfile.jsから呼ばれる)
app.get("/users/:userId", authenticateToken, (req, res) => {
  const { userId } = req.params;
  const loggedInUserId = req.user.user_id;
  // SELECT * を使い、カラムが存在しない場合のエラーを防ぐ
  const sql = `
    SELECT
      u.*,
      (SELECT COUNT(*) FROM follow001 WHERE follower_id = u.user_id) as followingCount,
      (SELECT COUNT(*) FROM follow001 WHERE following_id = u.user_id) as followersCount,
      (SELECT COUNT(*) FROM follow001 WHERE follower_id = ? AND following_id = ?) > 0 as isFollowedByCurrentUser
    FROM user001 as u
    WHERE u.user_id = ?
  `;
  db.query(sql, [loggedInUserId, userId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "ユーザー情報の取得に失敗しました。" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "ユーザーが見つかりません。" });
    }
    const dbUser = results[0];
    let avatarUrl = dbUser.avatar_url;

    if (!avatarUrl) {
      avatarUrl =
        "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
    } else if (avatarUrl && !avatarUrl.startsWith("http")) {
      avatarUrl = `${
        process.env.SERVER_BASE_URL || "http://localhost:5000"
      }${avatarUrl}`;
    }

    const user = {
      userId: dbUser.user_id,
      name: dbUser.user_name || dbUser.user_id, // user_nameがなければuser_idで代用
      bio: dbUser.bio || "", // bioがなければ空文字
      avatarUrl: avatarUrl,
      username: `@${dbUser.user_id}`,
      coverUrl: "https://via.placeholder.com/600x200", // ダミーデータ
      following: dbUser.followingCount,
      followers: dbUser.followersCount,
      isFollowedByCurrentUser: !!dbUser.isFollowedByCurrentUser,
    };
    res.json(user);
  });
});

// 特定ユーザーの投稿一覧取得API (UserProfile.jsから呼ばれる)
app.get("/users/:userId/posts", authenticateToken, (req, res) => {
  const { userId } = req.params;
  const loggedInUserId = req.user.user_id;
  const sql = `
    SELECT
      p.post_id,
      p.post_user,
      p.post_body,
      p.post_time,
      u.user_name,
      u.avatar_url,
      (SELECT COUNT(*) FROM post001 WHERE reply_to_post_id = p.post_id) AS reply_count,
      (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id) AS likes_count,
      (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id AND user_id = ?) > 0 AS user_has_liked
    FROM
      post001 AS p
    LEFT JOIN
      user001 AS u ON p.post_user = u.user_id
    WHERE
      p.post_user = ? AND p.reply_to_post_id IS NULL
    ORDER BY
      p.post_time DESC
  `;
  db.query(sql, [loggedInUserId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "投稿の取得に失敗しました。" });
    }
    const posts = results.map((post) => {
      let avatarUrl = post.avatar_url;
      if (!avatarUrl) {
        avatarUrl =
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
      } else if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = `${
          process.env.SERVER_BASE_URL || "http://localhost:5000"
        }${avatarUrl}`;
      }
      return {
        ...post,
        user_name: post.user_name || post.post_user,
        avatar_url: avatarUrl,
        user_has_liked: !!post.user_has_liked,
      };
    });
    res.json(posts);
  });
});

// 特定ユーザーの返信一覧取得API
app.get("/users/:userId/replies", authenticateToken, (req, res) => {
  const { userId } = req.params;
  const loggedInUserId = req.user.user_id;
  const sql = `
    SELECT
      p.post_id,
      p.post_user,
      p.post_body,
      p.post_time,
      u.user_name,
      u.avatar_url,
      (SELECT COUNT(*) FROM post001 WHERE reply_to_post_id = p.post_id) AS reply_count,
      (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id) AS likes_count,
      (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id AND user_id = ?) > 0 AS user_has_liked
    FROM
      post001 AS p
    LEFT JOIN
      user001 AS u ON p.post_user = u.user_id
    WHERE
      p.post_user = ? AND p.reply_to_post_id IS NOT NULL
    ORDER BY
      p.post_time DESC
  `;
  db.query(sql, [loggedInUserId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "返信の取得に失敗しました。" });
    }
    const posts = results.map((post) => {
      let avatarUrl = post.avatar_url;
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = `${
          process.env.SERVER_BASE_URL || "http://localhost:5000"
        }${avatarUrl}`;
      }
      return {
        ...post,
        user_name: post.user_name || post.post_user,
        avatar_url: avatarUrl,
        user_has_liked: !!post.user_has_liked,
      };
    });
    res.json(posts);
  });
});

// プロフィール更新API
app.put("/api/profile", authenticateToken, (req, res) => {
  const { name, bio } = req.body;
  const userId = req.user.user_id;

  const sql = "UPDATE user001 SET user_name = ?, bio = ? WHERE user_id = ?";
  db.query(sql, [name, bio, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "プロフィールの更新に失敗しました。" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "ユーザーが見つかりません。" });
    }

    // 更新後のユーザー情報を取得して返す
    const getUserSql = `
      SELECT
        u.*,
        (SELECT COUNT(*) FROM follow001 WHERE follower_id = u.user_id) as followingCount,
        (SELECT COUNT(*) FROM follow001 WHERE following_id = u.user_id) as followersCount
      FROM user001 as u
      WHERE u.user_id = ?
    `;
    db.query(getUserSql, [userId], (err, userResult) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "更新後のユーザー情報の取得に失敗しました。" });
      }
      const dbUser = userResult[0];
      let avatarUrl = dbUser.avatar_url;

      if (!avatarUrl) {
        avatarUrl =
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
      } else if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = `${
          process.env.SERVER_BASE_URL || "http://localhost:5000"
        }${avatarUrl}`;
      }

      const fullUser = {
        userId: dbUser.user_id,
        name: dbUser.user_name,
        bio: dbUser.bio,
        avatarUrl: avatarUrl,
        username: `@${dbUser.user_id}`,
        coverUrl: "https://via.placeholder.com/600x200", // ダミーデータ
        following: dbUser.followingCount,
        followers: dbUser.followersCount,
        isFollowedByCurrentUser: true, // 自分のプロフィールなので常にtrue
      };
      res.status(200).json({
        message: "プロフィールを更新しました。",
        user: fullUser,
      });
    });
  });
});

// フォローAPI
app.post("/api/users/:userId/follow", authenticateToken, (req, res) => {
  const followerId = req.user.user_id;
  const followingId = req.params.userId;

  if (followerId === followingId) {
    return res.status(400).json({ message: "自分自身はフォローできません。" });
  }

  const sql = "INSERT INTO follow001 (follower_id, following_id) VALUES (?, ?)";
  db.query(sql, [followerId, followingId], (err, results) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "既にフォローしています。" });
      }
      console.error(err);
      return res.status(500).json({ message: "フォローに失敗しました。" });
    }

    // --- フォロー通知の作成 ---
    const notificationSql =
      "INSERT INTO notification001 (user_id, actor_id, type) VALUES (?, ?, 'follow')";
    db.query(notificationSql, [followingId, followerId], (err, notifResult) => {
      if (err) console.error("Failed to create follow notification:", err);
    });

    res.status(201).json({ message: "フォローしました。" });
  });
});

// アンフォローAPI
app.delete("/api/users/:userId/follow", authenticateToken, (req, res) => {
  const followerId = req.user.user_id;
  const followingId = req.params.userId;

  const sql =
    "DELETE FROM follow001 WHERE follower_id = ? AND following_id = ?";
  db.query(sql, [followerId, followingId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "アンフォローに失敗しました。" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "フォローしていません。" });
    }
    res.status(200).json({ message: "アンフォローしました。" });
  });
});

// フォロー中リスト取得API
app.get("/api/users/:userId/following", authenticateToken, (req, res) => {
  const targetUserId = req.params.userId;
  const loggedInUserId = req.user.user_id;

  const sql = `
    SELECT
      u.user_id as userId,
      u.user_name as name,
      u.bio,
      u.avatar_url,
      (SELECT COUNT(*) FROM follow001 WHERE follower_id = ? AND following_id = u.user_id) > 0 AS isFollowedByCurrentUser
    FROM user001 u
    INNER JOIN follow001 f ON u.user_id = f.following_id
    WHERE f.follower_id = ?
  `;

  db.query(sql, [loggedInUserId, targetUserId], (err, results) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "フォローリストの取得に失敗しました。" });
    }
    const users = results.map((user) => {
      let avatarUrl = user.avatar_url;
      if (!avatarUrl) {
        avatarUrl =
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
      } else if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = `${
          process.env.SERVER_BASE_URL || "http://localhost:5000"
        }${avatarUrl}`;
      }
      return {
        ...user,
        avatarUrl: avatarUrl, // ←ここでavatarUrlとして返す
      };
    });
    res.json(users);
  });
});

// フォロワーリスト取得API
app.get("/api/users/:userId/followers", authenticateToken, (req, res) => {
  const targetUserId = req.params.userId;
  const loggedInUserId = req.user.user_id;

  const sql = `
    SELECT
      u.user_id as userId,
      u.user_name as name,
      u.bio,
      u.avatar_url,
      (SELECT COUNT(*) FROM follow001 WHERE follower_id = ? AND following_id = u.user_id) > 0 AS isFollowedByCurrentUser
    FROM user001 u
    INNER JOIN follow001 f ON u.user_id = f.follower_id
    WHERE f.following_id = ?
  `;

  db.query(sql, [loggedInUserId, targetUserId], (err, results) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "フォロワーリストの取得に失敗しました。" });
    }
    const users = results.map((user) => {
      let avatarUrl = user.avatar_url;
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = `${
          process.env.SERVER_BASE_URL || "http://localhost:5000"
        }${avatarUrl}`;
      }
      return {
        ...user,
        avatarUrl:
          avatarUrl ||
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
      };
    });
    res.json(users);
  });
});

// 通知一覧取得API
app.get("/api/notifications", authenticateToken, (req, res) => {
  const loggedInUserId = req.user.user_id;

  const sql = `
      SELECT
          n.notification_id, n.type, n.target_id, n.is_read, n.created_at,
          a.user_id as actor_id, a.user_name as actor_name, a.avatar_url as actor_avatar,
          p.post_body
      FROM notification001 n
      JOIN user001 a ON n.actor_id = a.user_id
      LEFT JOIN post001 p ON n.target_id = p.post_id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
  `;

  db.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "通知の取得に失敗しました。" });
    }
    const notifications = results.map((n) => {
      let avatarUrl = n.actor_avatar;
      if (avatarUrl && !avatarUrl.startsWith("http")) {
        avatarUrl = `${
          process.env.SERVER_BASE_URL || "http://localhost:5000"
        }${avatarUrl}`;
      }
      return {
        ...n,
        actor_avatar:
          avatarUrl ||
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
      };
    });
    res.json(notifications);
  });
});

// 未読通知件数取得API
app.get("/api/notifications/unread-count", authenticateToken, (req, res) => {
  const loggedInUserId = req.user.user_id;
  const sql =
    "SELECT COUNT(*) as unreadCount FROM notification001 WHERE user_id = ? AND is_read = 0";
  db.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "未読通知件数の取得に失敗しました。" });
    }
    // { "unreadCount": 5 } のような形式で返す
    res.json({ unreadCount: results[0].unreadCount });
  });
});

// 特定の通知を既読にするAPI
app.put(
  "/api/notifications/:notification_id/read",
  authenticateToken,
  (req, res) => {
    const { notification_id } = req.params;
    const loggedInUserId = req.user.user_id;

    // 自分宛の通知のみを既読にできるよう、user_idも条件に加える
    const sql =
      "UPDATE notification001 SET is_read = 1 WHERE notification_id = ? AND user_id = ? AND is_read = 0";
    db.query(sql, [notification_id, loggedInUserId], (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "通知の既読化に失敗しました。" });
      }
      // affectedRowsが0でも、既に既読だった場合などがあるのでエラーにはしない
      res.status(200).json({ message: "通知を既読にしました。" });
    });
  }
);

// 全ての通知を既読にするAPI
app.post("/api/notifications/read", authenticateToken, (req, res) => {
  const loggedInUserId = req.user.user_id;
  const sql =
    "UPDATE notification001 SET is_read = 1 WHERE user_id = ? AND is_read = 0";
  db.query(sql, [loggedInUserId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "通知の既読化に失敗しました。" });
    }
    res.status(200).json({ message: "通知を既読にしました。" });
  });
});

// アバター画像アップロードAPI
app.post("/api/profile/avatar", authenticateToken, async (req, res, next) => {
  // 1. まず古いアバターのパスを取得
  const getOldAvatarSql = "SELECT avatar_url FROM user001 WHERE user_id = ?";
  db.query(getOldAvatarSql, [req.user.user_id], (err, oldAvatarResult) => {
    if (err) {
      return next(new Error("データベースでエラーが発生しました。"));
    }
    const oldAvatarPath = oldAvatarResult[0]?.avatar_url;

    // 2. Multerでファイルをアップロード
    upload.single("avatar")(req, res, function (err) {
      if (err) {
        return next(err); // Multerのエラーをグローバルハンドラへ
      }
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "ファイルがアップロードされませんでした。" });
      }

      const userId = req.user.user_id;
      const relativeAvatarUrl = `/uploads/avatars/${req.file.filename}`;

      // 3. DBのURLを更新
      const updateSql = "UPDATE user001 SET avatar_url = ? WHERE user_id = ?";
      db.query(updateSql, [relativeAvatarUrl, userId], (err, results) => {
        if (err) {
          // DB更新に失敗した場合、アップロードしたファイルを削除
          fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr)
              console.error(
                "Failed to delete uploaded file on DB error:",
                unlinkErr
              );
          });
          return next(new Error("データベースの更新に失敗しました。"));
        }

        // 4. DB更新成功後、古いアバターファイルを削除
        if (oldAvatarPath && !oldAvatarPath.startsWith("http")) {
          const fullOldPath = path.join(__dirname, oldAvatarPath);
          fs.unlink(fullOldPath, (unlinkErr) => {
            if (unlinkErr && unlinkErr.code !== "ENOENT") {
              console.error("Failed to delete old avatar:", unlinkErr);
            }
          });
        }

        // 5. 成功レスポンスを返す
        const fullAvatarUrl = `${req.protocol}://${req.get(
          "host"
        )}${relativeAvatarUrl}`;
        res.status(200).json({
          message: "画像をアップロードしました。",
          avatarUrl: fullAvatarUrl,
        });
      });
    });
  });
});

// --- 検索API（投稿 or ユーザー） ---
app.get("/search/:target", authenticateToken, (req, res) => {
  const { target } = req.params;
  const q = req.query.q?.trim();
  const userId = req.user.user_id;

  if (!q)
    return res.status(400).json({ message: "検索ワードを指定してください。" });

  if (target === "posts") {
    const sql = `
      SELECT
        p.post_id,
        p.post_user,
        p.post_body,
        p.post_time,
        (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id) AS likes_count,
        (SELECT COUNT(*) FROM like001 WHERE post_id = p.post_id AND user_id = ?) > 0 AS user_has_liked
      FROM post001 AS p
      WHERE p.post_body LIKE ?
      ORDER BY p.post_time DESC
    `;
    db.query(sql, [userId, `%${q}%`], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "投稿検索に失敗しました。" });
      }
      const posts = results.map((post) => ({
        ...post,
        user_has_liked: !!post.user_has_liked,
      }));
      res.json(posts);
    });
  } else if (target === "users") {
    const loggedInUserId = req.user.user_id;
    const sql = `
      SELECT
        u.user_id as userId,
        u.user_name as name,
        u.bio,
        u.avatar_url,
        (SELECT COUNT(*) FROM follow001 WHERE follower_id = ? AND following_id = u.user_id) > 0 AS isFollowedByCurrentUser
      FROM user001 u
      WHERE u.user_id LIKE ? OR u.user_name LIKE ?
      ORDER BY user_id ASC
    `;
    db.query(sql, [loggedInUserId, `%${q}%`, `%${q}%`], (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "ユーザー検索に失敗しました。" });
      }
      const users = results.map((user) => {
        let avatarUrl = user.avatar_url;
        if (avatarUrl && !avatarUrl.startsWith("http")) {
          avatarUrl = `${
            process.env.SERVER_BASE_URL || "http://localhost:5000"
          }${avatarUrl}`;
        }
        return {
          ...user,
          avatarUrl:
            avatarUrl ||
            "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
        };
      });
      res.json(users);
    });
  } else {
    res.status(400).json({ message: "不正な検索ターゲットです。" });
  }
});

// --- ここから修正 ---
// 本番環境用の設定：静的ファイルを提供し、Reactルーターにルーティングを委ねる
// 注意：これらのルートは、必ずすべてのAPIルートの後に記述してください。
// そうしないと、APIへのリクエストがindex.htmlにフォールバックされてしまいます。

// Reactのビルド成果物（buildディレクトリ）を提供
// プロジェクトルートに 'build' ディレクトリがあると仮定しています。
app.use(express.static(path.join(__dirname, "build")));

// アップロードされたファイルを提供
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 上記のAPIルートにマッチしなかったすべてのGETリクエストはindex.htmlを返す
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// グローバルエラーハンドラ（必ず最後！）
app.use((err, req, res, next) => {
  console.error("[Global Error Handler]:", err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err.message && err.message.includes("画像ファイル")) {
    return res.status(400).json({ message: err.message });
  }
  // その他の予期せぬサーバーエラー
  if (!res.headersSent) {
    return res
      .status(500)
      .json({ message: "サーバー内部でエラーが発生しました。" });
  }
  // ここで必ずレスポンスを返す
  res.end();
});

let server;

if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db, server };
