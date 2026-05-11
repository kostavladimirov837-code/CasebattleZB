const STORAGE_KEY = "casebattle_front_state_v1";
const USERS_KEY = "casebattle_front_users_v1";
const SESSION_KEY = "casebattle_token";
import { rollFuseAllOutcome, FUSE_RESULT_MIN_RATIO, FUSE_RESULT_MAX_RATIO } from "./contracts";

const CONTESTS = [
  { id: 1, title: "Быстрый конкурс", ticketPrice: 100, prize: 1500 },
  { id: 2, title: "Премиум конкурс", ticketPrice: 300, prize: 5000 },
  { id: 3, title: "Мега конкурс", ticketPrice: 700, prize: 12000 }
];
const CASES = [
  {
    id: 1,
    name: "Новичок",
    price: 59,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    items: [
      { name: "P250 | Sand Dune", rarity: "consumer", value: 15, chance: 40 },
      { name: "UMP-45 | Delusion", rarity: "mil-spec", value: 40, chance: 28 },
      { name: "AK-47 | Elite Build", rarity: "restricted", value: 95, chance: 18 },
      { name: "M4A1-S | Decimator", rarity: "classified", value: 220, chance: 10 },
      { name: "AWP | Asiimov", rarity: "covert", value: 510, chance: 4 }
    ]
  },
  {
    id: 2,
    name: "Солдатик",
    price: 444,
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80",
    items: [
      { name: "Desert Eagle | Kumicho Dragon", rarity: "restricted", value: 290, chance: 38 },
      { name: "AK-47 | Neon Rider", rarity: "classified", value: 420, chance: 30 },
      { name: "M4A4 | The Emperor", rarity: "classified", value: 580, chance: 17 },
      { name: "AWP | Hyper Beast", rarity: "covert", value: 980, chance: 11 },
      { name: "Karambit | Lore", rarity: "knife", value: 3500, chance: 4 }
    ]
  },
  {
    id: 3,
    name: "Император",
    price: 1999,
    image: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=600&q=80",
    items: [
      { name: "AK-47 | Bloodsport", rarity: "classified", value: 1700, chance: 34 },
      { name: "M4A1-S | Printstream", rarity: "covert", value: 2200, chance: 28 },
      { name: "AWP | Lightning Strike", rarity: "covert", value: 3100, chance: 20 },
      { name: "Butterfly Knife | Slaughter", rarity: "knife", value: 6900, chance: 12 },
      { name: "Sport Gloves | Hedge Maze", rarity: "gloves", value: 18500, chance: 6 }
    ]
  }
];

function fail(message, status = 400) {
  const error = new Error(message);
  error.response = {
    status,
    data: { message }
  };
  throw error;
}

function readUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function createInitialState(user) {
  return {
    user,
    inventory: [],
    history: [],
    upgradesHistory: [],
    contractsHistory: [],
    contestEntries: [],
    nextId: 1
  };
}

function readState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw);
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getSessionUsername() {
  return localStorage.getItem(SESSION_KEY) || "";
}

function getAuthedState() {
  const state = readState();
  const username = getSessionUsername();
  if (!state || !username || state.user.username !== username) {
    fail("Требуется вход", 401);
  }
  return state;
}

function nextId(state) {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}

function pickItem(caseData) {
  const max = caseData.items.reduce((sum, item) => sum + item.chance, 0);
  let random = Math.random() * max;
  for (const item of caseData.items) {
    random -= item.chance;
    if (random <= 0) return item;
  }
  return caseData.items[caseData.items.length - 1];
}

function getContests(state) {
  return CONTESTS.map((contest) => ({
    ...contest,
    participants: Number(state.contestEntries.filter((entry) => entry.contestId === contest.id).length),
    joined: state.contestEntries.some(
      (entry) => entry.contestId === contest.id && entry.username === state.user.username
    )
  }));
}

const api = {
  async get(path) {
    if (path === "/cases") return { data: CASES };

    if (path === "/me") {
      const state = getAuthedState();
      return { data: state.user };
    }

    if (path === "/inventory") {
      const state = getAuthedState();
      return { data: state.inventory.slice().reverse() };
    }

    if (path === "/history") {
      const state = getAuthedState();
      return { data: state.history.slice().reverse().slice(0, 40) };
    }

    if (path === "/upgrades/history") {
      const state = getAuthedState();
      return { data: state.upgradesHistory.slice().reverse().slice(0, 30) };
    }

    if (path === "/contracts/history") {
      const state = getAuthedState();
      const list = Array.isArray(state.contractsHistory) ? state.contractsHistory : [];
      return { data: list.slice().reverse().slice(0, 40) };
    }

    if (path === "/contests") {
      const state = getAuthedState();
      return { data: getContests(state) };
    }

    fail("Маршрут не найден", 404);
  },

  async post(path, payload = {}) {
    if (path === "/auth/register") {
      const username = String(payload.username || "").trim();
      const password = String(payload.password || "");
      if (!username || password.length < 6) {
        fail("Логин обязателен, пароль от 6 символов");
      }
      const users = readUsers();
      if (users.some((item) => item.username === username)) {
        fail("Пользователь уже существует", 409);
      }
      users.push({ username, password, balance: 1000 });
      writeUsers(users);
      localStorage.setItem(SESSION_KEY, username);
      const user = { id: 1, username, balance: 1000 };
      writeState(createInitialState(user));
      return { data: { token: username, user } };
    }

    if (path === "/auth/login") {
      const username = String(payload.username || "").trim();
      const password = String(payload.password || "");
      const users = readUsers();
      const found = users.find((item) => item.username === username && item.password === password);
      if (!found) fail("Неверный логин или пароль", 401);
      localStorage.setItem(SESSION_KEY, username);
      const existingState = readState();
      if (!existingState || existingState.user.username !== username) {
        writeState(createInitialState({ id: 1, username, balance: found.balance }));
      }
      return { data: { token: username, user: { id: 1, username, balance: found.balance } } };
    }

    if (path === "/balance/topup") {
      const state = getAuthedState();
      const amount = Number(payload.amount || 0);
      if (!Number.isInteger(amount) || amount < 1 || amount > 100000) {
        fail("Сумма пополнения должна быть от 1 до 100000");
      }
      state.user.balance += amount;
      writeState(state);
      return { data: state.user };
    }

    const openCaseMatch = path.match(/^\/cases\/(\d+)\/open$/);
    if (openCaseMatch) {
      const state = getAuthedState();
      const caseId = Number(openCaseMatch[1]);
      const caseData = CASES.find((item) => item.id === caseId);
      if (!caseData) fail("Кейс не найден", 404);
      const totalPrice = caseData.price;
      if (state.user.balance < totalPrice) fail("Недостаточно средств");
      const won = pickItem(caseData);
      state.user.balance -= totalPrice;
      const invItem = {
        id: nextId(state),
        item_name: won.name,
        rarity: won.rarity,
        value: won.value,
        source_case: caseData.name
      };
      state.inventory.push(invItem);
      state.history.push({
        id: nextId(state),
        case_name: caseData.name,
        case_price: caseData.price,
        item_name: won.name,
        item_value: won.value,
        rarity: won.rarity
      });
      writeState(state);
      return {
        data: {
          case: caseData.name,
          spent: totalPrice,
          won: won.value,
          profit: won.value - totalPrice,
          inventoryItemId: invItem.id,
          items: [won],
          user: state.user
        }
      };
    }

    const sellMatch = path.match(/^\/inventory\/(\d+)\/sell$/);
    if (sellMatch) {
      const state = getAuthedState();
      const itemId = Number(sellMatch[1]);
      const index = state.inventory.findIndex((item) => item.id === itemId);
      if (index === -1) fail("Предмет не найден или уже продан", 404);
      const [sold] = state.inventory.splice(index, 1);
      state.user.balance += sold.value;
      writeState(state);
      return { data: { sold, user: state.user } };
    }

    if (path === "/contracts/fuse-all") {
      const state = getAuthedState();
      if (!Array.isArray(state.contractsHistory)) {
        state.contractsHistory = [];
      }
      const items = state.inventory;
      if (items.length === 0) {
        fail("В инвентаре нет скинов для контракта");
      }
      const totalInput = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
      const resultValue = rollFuseAllOutcome(totalInput);
      const bestByValue = items.reduce((a, b) => (a.value >= b.value ? a : b));
      const consumed = items.map((item) => ({
        id: item.id,
        item_name: item.item_name,
        value: item.value
      }));
      state.inventory.splice(0, state.inventory.length);
      const merged = {
        id: nextId(state),
        item_name: `Результат контракта (${consumed.length} шт.)`,
        rarity: bestByValue.rarity,
        value: resultValue,
        source_case: "Контракт: слияние"
      };
      state.inventory.push(merged);
      const ratioApprox = totalInput > 0 ? resultValue / totalInput : null;
      state.contractsHistory.push({
        id: nextId(state),
        contractId: "fuse-all",
        consumedCount: consumed.length,
        totalInput,
        resultValue,
        ratioApprox,
        bounds: {
          minRatio: FUSE_RESULT_MIN_RATIO,
          maxRatio: FUSE_RESULT_MAX_RATIO
        }
      });
      writeState(state);
      return {
        data: {
          consumed,
          merged,
          totalInput,
          resultValue,
          user: state.user
        }
      };
    }

    if (path === "/upgrade") {
      const state = getAuthedState();
      const itemId = Number(payload.itemId);
      const multiplier = Number(payload.multiplier);
      if (!itemId || ![1.5, 2, 3, 5].includes(multiplier)) {
        fail("Выберите предмет и корректный множитель");
      }
      const index = state.inventory.findIndex((item) => item.id === itemId);
      if (index === -1) fail("Предмет не найден", 404);
      const [item] = state.inventory.splice(index, 1);
      const chance = Math.max(0.05, Math.min(0.85, 1 / multiplier));
      const success = Math.random() < chance;
      let reward = null;
      if (success) {
        reward = {
          id: nextId(state),
          item_name: `${item.item_name} | UPGRADE x${multiplier}`,
          rarity: item.rarity,
          value: Math.round(item.value * multiplier),
          source_case: "Upgrade"
        };
        state.inventory.push(reward);
      }
      state.upgradesHistory.push({
        id: nextId(state),
        source_item_name: item.item_name,
        source_item_value: item.value,
        multiplier,
        success,
        new_item_name: reward?.item_name || null,
        new_item_value: reward?.value || null
      });
      writeState(state);
      return {
        data: {
          success,
          chance,
          source: item,
          reward: reward ? { item_name: reward.item_name, value: reward.value } : null,
          user: state.user
        }
      };
    }

    const joinMatch = path.match(/^\/contests\/(\d+)\/join$/);
    if (joinMatch) {
      const state = getAuthedState();
      const contestId = Number(joinMatch[1]);
      const contest = CONTESTS.find((item) => item.id === contestId);
      if (!contest) fail("Конкурс не найден", 404);
      if (state.contestEntries.some((entry) => entry.contestId === contestId && entry.username === state.user.username)) {
        fail("Вы уже участвуете в этом конкурсе");
      }
      if (state.user.balance < contest.ticketPrice) fail("Недостаточно средств для участия");
      state.user.balance -= contest.ticketPrice;
      state.contestEntries.push({ contestId, username: state.user.username });
      writeState(state);
      return { data: { user: state.user, message: "Вы успешно вступили в конкурс" } };
    }

    const drawMatch = path.match(/^\/contests\/(\d+)\/draw$/);
    if (drawMatch) {
      const state = getAuthedState();
      const contestId = Number(drawMatch[1]);
      const contest = CONTESTS.find((item) => item.id === contestId);
      if (!contest) fail("Конкурс не найден", 404);
      const entries = state.contestEntries.filter((entry) => entry.contestId === contestId);
      if (entries.length < 2) fail("Для розыгрыша нужно минимум 2 участника");
      const winner = entries[Math.floor(Math.random() * entries.length)];
      if (winner.username === state.user.username) {
        state.user.balance += contest.prize;
      }
      state.contestEntries = state.contestEntries.filter((entry) => entry.contestId !== contestId);
      writeState(state);
      return {
        data: {
          winner: { username: winner.username },
          prize: contest.prize,
          user: state.user
        }
      };
    }

    fail("Маршрут не найден", 404);
  }
};

export default api;
