function roles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Login necessario." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acesso negado para este perfil." });
    }

    next();
  };
}

module.exports = roles;
