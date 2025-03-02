const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "Acceso denegado. No hay token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guardamos los datos del usuario en req.user
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token no válido." });
  }
};

module.exports = authMiddleware;
