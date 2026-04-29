const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { initDb, run, get, all } = require("./db");
const { CASES, pickItem } = require("./data");
const { signToken, authMiddleware } = require("./auth");

const app = express();
const PORT = process.env.PORT || 4000;
const CONTESTS = [
  { id: 1, title: "Быстрый конкурс", ticketPrice: 100, prize: 1500 },
  { id: 2, title: "Премиум конкурс", ticketPrice: 300, prize: 5000 },
  { id: 3, title: "Мега конкурс", ticketPrice: 700, prize: 12000 }
];

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password || password.length < 6) {
      res.status(400).json({ message: "Логин обязателен, пароль от 6 символов" });
      return;
    }

    const existing = await get("SELECT id FROM users WHERE username = ?", [username]);
    if (existing) {
      res.status(409).json({ message: "Пользователь уже существует" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      "INSERT INTO users (username, password_hash, balance) VALUES (?, ?, ?)",
      [username, passwordHash, 1000]
    );

    const user = { id: result.lastID, username, balance: 1000 };
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Ошибка регистрации" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await get("SELECT * FROM users WHERE username = ?", [username]);

    if (!user) {
      res.status(401).json({ message: "Неверный логин или пароль" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ message: "Неверный логин или пароль" });
      return;
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка авторизации" });
  }
});

app.get("/api/me", authMiddleware, async (req, res) => {
  const user = await get("SELECT id, username, balance FROM users WHERE id = ?", [req.user.id]);
  if (!user) {
    res.status(404).json({ message: "Пользователь не найден" });
    return;
  }
  res.json(user);
});

app.get("/api/cases", (req, res) => {
  res.json(CASES);
});

app.post("/api/cases/:id/open", authMiddleware, async (req, res) => {
  try {
    const caseId = Number(req.params.id);
    const count = Number(req.body.count || 1);
    const caseData = CASES.find((item) => item.id === caseId);

    if (!caseData) {
      res.status(404).json({ message: "Кейс не найден" });
      return;
    }

    if (!Number.isInteger(count) || count < 1 || count > 5) {
      res.status(400).json({ message: "Количество открытий от 1 до 5" });
      return;
    }

    const user = await get("SELECT id, balance FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      res.status(404).json({ message: "Пользователь не найден" });
      return;
    }

    const totalPrice = caseData.price * count;
    if (user.balance < totalPrice) {
      res.status(400).json({ message: "Недостаточно средств" });
      return;
    }

    const openedItems = [];
    let totalWon = 0;

    for (let i = 0; i < count; i += 1) {
      const won = pickItem(caseData);
      totalWon += won.value;
      openedItems.push(won);

      await run(
        "INSERT INTO inventory (user_id, item_name, rarity, value, source_case) VALUES (?, ?, ?, ?, ?)",
        [req.user.id, won.name, won.rarity, won.value, caseData.name]
      );

      await run(
        "INSERT INTO openings (user_id, case_id, case_name, case_price, item_name, item_value, rarity) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [req.user.id, caseData.id, caseData.name, caseData.price, won.name, won.value, won.rarity]
      );
    }

    await run("UPDATE users SET balance = balance - ? WHERE id = ?", [totalPrice, req.user.id]);
    const updatedUser = await get("SELECT id, username, balance FROM users WHERE id = ?", [req.user.id]);

    res.json({
      case: caseData.name,
      spent: totalPrice,
      won: totalWon,
      profit: totalWon - totalPrice,
      items: openedItems,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка открытия кейса" });
  }
});

app.get("/api/inventory", authMiddleware, async (req, res) => {
  const items = await all(
    "SELECT id, item_name, rarity, value, source_case, created_at FROM inventory WHERE user_id = ? ORDER BY id DESC",
    [req.user.id]
  );
  res.json(items);
});

app.post("/api/inventory/:id/sell", authMiddleware, async (req, res) => {
  try {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      res.status(400).json({ message: "Некорректный id предмета" });
      return;
    }

    const item = await get(
      "SELECT id, item_name, value FROM inventory WHERE id = ? AND user_id = ?",
      [itemId, req.user.id]
    );

    if (!item) {
      res.status(404).json({ message: "Предмет не найден или уже продан" });
      return;
    }

    await run("BEGIN TRANSACTION");
    try {
      await run("DELETE FROM inventory WHERE id = ? AND user_id = ?", [itemId, req.user.id]);
      await run("UPDATE users SET balance = balance + ? WHERE id = ?", [item.value, req.user.id]);
      await run("COMMIT");
    } catch (transactionError) {
      await run("ROLLBACK");
      throw transactionError;
    }

    const updated = await get("SELECT id, username, balance FROM users WHERE id = ?", [req.user.id]);
    res.json({
      sold: item,
      user: updated
    });
  } catch (error) {
    res.status(500).json({ message: "Не удалось продать скин, попробуйте снова" });
  }
});

app.get("/api/history", authMiddleware, async (req, res) => {
  const history = await all(
    "SELECT id, case_name, case_price, item_name, item_value, rarity, created_at FROM openings WHERE user_id = ? ORDER BY id DESC LIMIT 40",
    [req.user.id]
  );
  res.json(history);
});

app.post("/api/balance/topup", authMiddleware, async (req, res) => {
  const amount = Number(req.body.amount || 0);
  if (!Number.isInteger(amount) || amount < 1 || amount > 100000) {
    res.status(400).json({ message: "Сумма пополнения должна быть от 1 до 100000" });
    return;
  }

  await run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, req.user.id]);
  const updated = await get("SELECT id, username, balance FROM users WHERE id = ?", [req.user.id]);
  res.json(updated);
});

app.post("/api/upgrade", authMiddleware, async (req, res) => {
  try {
    const itemId = Number(req.body.itemId);
    const multiplier = Number(req.body.multiplier);

    if (!itemId || ![1.5, 2, 3, 5].includes(multiplier)) {
      res.status(400).json({ message: "Выберите предмет и корректный множитель" });
      return;
    }

    const item = await get(
      "SELECT id, item_name, rarity, value FROM inventory WHERE id = ? AND user_id = ?",
      [itemId, req.user.id]
    );
    if (!item) {
      res.status(404).json({ message: "Предмет не найден" });
      return;
    }

    const chance = Math.max(0.05, Math.min(0.85, 1 / multiplier));
    const success = Math.random() < chance;
    await run("DELETE FROM inventory WHERE id = ? AND user_id = ?", [itemId, req.user.id]);

    let newItemName = null;
    let newItemValue = null;

    if (success) {
      newItemName = `${item.item_name} | UPGRADE x${multiplier}`;
      newItemValue = Math.round(item.value * multiplier);

      await run(
        "INSERT INTO inventory (user_id, item_name, rarity, value, source_case) VALUES (?, ?, ?, ?, ?)",
        [req.user.id, newItemName, item.rarity, newItemValue, "Upgrade"]
      );
    }

    await run(
      "INSERT INTO upgrades (user_id, source_item_name, source_item_value, multiplier, success, new_item_name, new_item_value) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        req.user.id,
        item.item_name,
        item.value,
        multiplier,
        success ? 1 : 0,
        newItemName,
        newItemValue
      ]
    );

    const updated = await get("SELECT id, username, balance FROM users WHERE id = ?", [req.user.id]);
    res.json({
      success,
      chance,
      source: item,
      reward: success ? { item_name: newItemName, value: newItemValue } : null,
      user: updated
    });
  } catch (error) {
    res.status(500).json({ message: "Ошибка апгрейда" });
  }
});

app.get("/api/upgrades/history", authMiddleware, async (req, res) => {
  const rows = await all(
    "SELECT id, source_item_name, source_item_value, multiplier, success, new_item_name, new_item_value, created_at FROM upgrades WHERE user_id = ? ORDER BY id DESC LIMIT 30",
    [req.user.id]
  );
  res.json(rows);
});

app.get("/api/contests", authMiddleware, async (req, res) => {
  const rows = await all(
    "SELECT contest_id, COUNT(*) as participants FROM contest_entries GROUP BY contest_id",
    []
  );
  const counts = Object.fromEntries(rows.map((row) => [row.contest_id, row.participants]));
  const myEntries = await all(
    "SELECT contest_id FROM contest_entries WHERE user_id = ?",
    [req.user.id]
  );
  const joinedSet = new Set(myEntries.map((entry) => entry.contest_id));

  const data = CONTESTS.map((contest) => ({
    ...contest,
    participants: Number(counts[contest.id] || 0),
    joined: joinedSet.has(contest.id)
  }));

  res.json(data);
});

app.post("/api/contests/:id/join", authMiddleware, async (req, res) => {
  const contestId = Number(req.params.id);
  const contest = CONTESTS.find((item) => item.id === contestId);
  if (!contest) {
    res.status(404).json({ message: "Конкурс не найден" });
    return;
  }

  const alreadyJoined = await get(
    "SELECT id FROM contest_entries WHERE contest_id = ? AND user_id = ?",
    [contestId, req.user.id]
  );
  if (alreadyJoined) {
    res.status(400).json({ message: "Вы уже участвуете в этом конкурсе" });
    return;
  }

  const user = await get("SELECT id, balance FROM users WHERE id = ?", [req.user.id]);
  if (!user || user.balance < contest.ticketPrice) {
    res.status(400).json({ message: "Недостаточно средств для участия" });
    return;
  }

  await run("UPDATE users SET balance = balance - ? WHERE id = ?", [contest.ticketPrice, req.user.id]);
  await run("INSERT INTO contest_entries (contest_id, user_id) VALUES (?, ?)", [contestId, req.user.id]);
  const updated = await get("SELECT id, username, balance FROM users WHERE id = ?", [req.user.id]);

  res.json({ user: updated, message: "Вы успешно вступили в конкурс" });
});

app.post("/api/contests/:id/draw", authMiddleware, async (req, res) => {
  const contestId = Number(req.params.id);
  const contest = CONTESTS.find((item) => item.id === contestId);
  if (!contest) {
    res.status(404).json({ message: "Конкурс не найден" });
    return;
  }

  const entries = await all(
    "SELECT ce.user_id, u.username FROM contest_entries ce JOIN users u ON u.id = ce.user_id WHERE ce.contest_id = ?",
    [contestId]
  );

  if (entries.length < 2) {
    res.status(400).json({ message: "Для розыгрыша нужно минимум 2 участника" });
    return;
  }

  const winner = entries[Math.floor(Math.random() * entries.length)];
  await run("UPDATE users SET balance = balance + ? WHERE id = ?", [contest.prize, winner.user_id]);
  await run("DELETE FROM contest_entries WHERE contest_id = ?", [contestId]);
  const me = await get("SELECT id, username, balance FROM users WHERE id = ?", [req.user.id]);

  res.json({
    winner,
    prize: contest.prize,
    user: me
  });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CaseBattle API started on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("DB init error:", error);
    process.exit(1);
  });
