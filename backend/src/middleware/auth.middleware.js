export const protect = async (req, res, next) => {
  // MOCK: Simulamos que el usuario "Andrés" está logueado para poder probar
  // Cuando conectemos el Login real, cambiaremos esto por verificación JWT.
  req.user = { 
    _id: '65e0a0b9f0a2d3e4c5b6a789', // ID falso de MongoDB
    username: 'Andres_Magis',
    role: 'admin'
  };
  next();
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this role' });
    }
    next();
  };
};
