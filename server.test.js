const { app, db, server } = require("./server");
const supertest = require("supertest");
const bcrypt = require("bcrypt");
const fs = require("fs").promises; // fs.promises を使用
const path = require("path");
const util = require("util");

afterAll(async () => {
  // サーバーとDBのクリーンアップ
  if (server && typeof server.close === "function") {
    await util.promisify(server.close).bind(server)();
  }
  if (db && typeof db.end === "function") {
    await util.promisify(db.end).bind(db)();
  }
});

describe("通知API", () => {
  let testUserId = "testuser_" + Date.now();
  let testToken;
  let notificationId;

  beforeAll(async () => {
    // ユーザー作成
    await db
      .promise()
      .query(
        "INSERT INTO user001 (user_id, password, user_name, bio, avatar_url) VALUES (?, ?, ?, ?, ?)",
        [
          testUserId,
          await bcrypt.hash("testpass123", 10),
          testUserId,
          "bio",
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
        ]
      );
    // JWT取得
    const res = await supertest(app)
      .post("/login")
      .send({ user_id: testUserId, password: "testpass123" });
    testToken = res.body.token;

    // 通知作成
    const result = await db
      .promise()
      .query(
        "INSERT INTO notification001 (user_id, actor_id, type, is_read, created_at) VALUES (?, ?, 'like', 0, NOW())",
        [testUserId, testUserId]
      );
    notificationId = result[0].insertId;
  });

  afterAll(async () => {
    await db
      .promise()
      .query("DELETE FROM notification001 WHERE user_id = ?", [testUserId]);
    await db
      .promise()
      .query("DELETE FROM user001 WHERE user_id = ?", [testUserId]);
  });

  test("GET /api/notifications - 通知一覧取得", async () => {
    const res = await supertest(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${testToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((n) => n.notification_id === notificationId)).toBe(
      true
    );
  });

  test("GET /api/notifications/unread-count - 未読通知件数取得", async () => {
    const res = await supertest(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${testToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("unreadCount");
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
  });

  test("PUT /api/notifications/:notification_id/read - 通知を既読化", async () => {
    const res = await supertest(app)
      .put(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${testToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("通知を既読にしました。");

    // DB確認
    const [rows] = await db
      .promise()
      .query("SELECT is_read FROM notification001 WHERE notification_id = ?", [
        notificationId,
      ]);
    expect(rows[0].is_read).toBe(1);
  });

  test("POST /api/notifications/read - 全通知を既読化", async () => {
    // 未読通知追加
    await db
      .promise()
      .query(
        "INSERT INTO notification001 (user_id, actor_id, type, is_read, created_at) VALUES (?, ?, 'reply', 0, NOW())",
        [testUserId, testUserId]
      );
    const res = await supertest(app)
      .post("/api/notifications/read")
      .set("Authorization", `Bearer ${testToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("通知を既読にしました。");

    // 全通知既読確認
    const [rows] = await db
      .promise()
      .query(
        "SELECT COUNT(*) as unread FROM notification001 WHERE user_id = ? AND is_read = 0",
        [testUserId]
      );
    expect(rows[0].unread).toBe(0);
  });
});

describe("アバター画像アップロードAPI", () => {
  let testUserId = "avataruser_" + Date.now();
  let testToken;
  let avatarFilePath;

  beforeAll(async () => {
    await db
      .promise()
      .query(
        "INSERT INTO user001 (user_id, password, user_name, bio, avatar_url) VALUES (?, ?, ?, ?, ?)",
        [
          testUserId,
          await bcrypt.hash("avatarpass123", 10),
          testUserId,
          "bio",
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
        ]
      );
    const res = await supertest(app)
      .post("/login")
      .send({ user_id: testUserId, password: "avatarpass123" });
    testToken = res.body.token;
  });

  afterAll(async () => {
    await db
      .promise()
      .query("DELETE FROM user001 WHERE user_id = ?", [testUserId]);
    if (avatarFilePath) {
      // ファイルが存在しない場合のエラーは無視する
      await fs.unlink(avatarFilePath).catch(() => {});
    }
  });

  test("POST /api/profile/avatar - 画像アップロード成功", async () => {
    avatarFilePath = path.join(__dirname, "dummy-avatar.png");
    await fs.writeFile(
      avatarFilePath,
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    ); // PNG header

    const res = await supertest(app)
      .post("/api/profile/avatar")
      .set("Authorization", `Bearer ${testToken}`)
      .attach("avatar", avatarFilePath);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("avatarUrl");
    expect(res.body.avatarUrl).toMatch(/^http/);

    // DBにavatar_urlが保存されているか
    const [rows] = await db
      .promise()
      .query("SELECT avatar_url FROM user001 WHERE user_id = ?", [testUserId]);
    expect(rows[0].avatar_url).toMatch(/\/uploads\/avatars\//);
  });

  test("POST /api/profile/avatar - 不正なファイルタイプはエラー", async () => {
    const txtPath = path.join(__dirname, "dummy.txt");
    await fs.writeFile(txtPath, "not an image");

    const res = await supertest(app)
      .post("/api/profile/avatar")
      .set("Authorization", `Bearer ${testToken}`)
      .attach("avatar", txtPath);

    // サーバー側で画像以外は400エラーを返す仕様なので、エラーになるのが正しいです
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/画像ファイル/);

    await fs.unlink(txtPath);
  });

  test("POST /api/profile/avatar - ファイル未添付はエラー", async () => {
    const res = await supertest(app)
      .post("/api/profile/avatar")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/ファイルがアップロードされませんでした/);
  });

  test("POST /api/profile/avatar - 5MB超過はエラー", async () => {
    const bigFilePath = path.join(__dirname, "big-avatar.png");
    // 6MBのダミーファイル
    await fs.writeFile(bigFilePath, Buffer.alloc(6 * 1024 * 1024, 0));

    const res = await supertest(app)
      .post("/api/profile/avatar")
      .set("Authorization", `Bearer ${testToken}`)
      .attach("avatar", bigFilePath);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/File too large/);

    await fs.unlink(bigFilePath);
  });
});

// 追加テスト: 認証なしで通知APIにアクセス
describe("認証なしアクセス", () => {
  test("GET /api/notifications - 認証なしは401", async () => {
    const res = await supertest(app).get("/api/notifications");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/認証トークン/);
  });

  test("POST /api/profile/avatar - 認証なしは401", async () => {
    const res = await supertest(app)
      .post("/api/profile/avatar")
      .attach(
        "avatar",
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        "dummy.png"
      );
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/認証トークン/);
  });
});

// 追加テスト: 通知既読APIで存在しないID
describe("通知既読API 異常系", () => {
  let testUserId = "notfounduser_" + Date.now();
  let testToken;

  beforeAll(async () => {
    await db
      .promise()
      .query(
        "INSERT INTO user001 (user_id, password, user_name, bio, avatar_url) VALUES (?, ?, ?, ?, ?)",
        [
          testUserId,
          await bcrypt.hash("notfoundpass", 10),
          testUserId,
          "bio",
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
        ]
      );
    const res = await supertest(app)
      .post("/login")
      .send({ user_id: testUserId, password: "notfoundpass" });
    testToken = res.body.token;
  });

  afterAll(async () => {
    await db
      .promise()
      .query("DELETE FROM user001 WHERE user_id = ?", [testUserId]);
  });

  test("PUT /api/notifications/:notification_id/read - 存在しないIDでも200", async () => {
    const res = await supertest(app)
      .put("/api/notifications/99999999/read")
      .set("Authorization", `Bearer ${testToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("通知を既読にしました。");
  });
});
