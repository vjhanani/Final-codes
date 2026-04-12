// middleware/roleMiddleware.js

exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    try {
      // Standardized role check (case-insensitive)
      const finalUserRole = (req.userRole || (req.user && req.user.role) || "").toLowerCase();
      const allowedRoles = roles.map(r => r.toLowerCase());

      if (!allowedRoles.includes(finalUserRole)) {
        console.log(`[ROLE] Access Denied. User Role: ${finalUserRole}, Allowed Roles: ${allowedRoles.join(", ")}`);
        return res.status(403).json({
          error: "Access denied! Found role: (" + finalUserRole + "). Expected one of: (" + roles.join(", ") + ")"
        });
      }

      // console.log(`[ROLE] Access Granted. User Role: ${finalUserRole}`);
      next();

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
