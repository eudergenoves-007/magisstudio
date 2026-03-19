import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No autorizado para acceder a esta ruta' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'No autorizado, token falló' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this role' });
    }
    next();
  };
};
