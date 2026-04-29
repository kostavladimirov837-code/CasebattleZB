const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "casebattle_secret_key";

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: "Недействительный токен" });
  }
}

module.exports = {
  signToken,
  authMiddleware
};
