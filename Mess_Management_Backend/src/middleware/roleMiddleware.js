// middleware/roleMiddleware.js

exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    try {
      const userRole = req.userRole || (req.user && req.user.role);

      if (!req.user || !userRole) {
        return res.status(401).json({
          error: "User not authenticated. userRole: (" + userRole + ")"
        });
      }

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: "Access denied! Found role: (" + userRole + "). Expected one of: (" + roles.join(", ") + ")"
        });
      }

      next();

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
