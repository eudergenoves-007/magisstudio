import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El usuario o email ya existe' });
    }

    const user = await User.create({ username, email, password });
    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      data: {
        user: { _id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Por favor, proporciona email y contraseña' });
    }

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    if (user.isLocked) {
      return res.status(403).json({ success: false, message: 'Cuenta bloqueada temporalmente' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: {
        user: { _id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({
      success: true,
      data: { _id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Token de refresco requerido' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Token de refresco inválido' });
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: tokens
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'No autorizado, token falló' });
  }
};

export const logout = async (req, res, next) => {
    try {
        if(req.user) {
            const user = await User.findById(req.user._id).select('+refreshToken');
            if (user) {
                user.refreshToken = undefined;
                await user.save({ validateBeforeSave: false });
            }
        }
        res.json({ success: true, message: 'Cierre de sesión exitoso' });
    } catch (err) {
        next(err);
    }
};
