import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import socialRoutes from './src/routes/social.routes.js'; // <-- Importamos tu red social
import authRoutes from './src/routes/auth.routes.js'; // <-- Importamos autenticación

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("🔥 Magis Studio DB Conectada"))
  .catch(err => console.error("❌ Error DB:", err));

app.get('/', (req, res) => res.send('Magis Studio API Online'));

// 🚀 Inyectamos la súper-carretera social
app.use('/api/v1/social', socialRoutes);
app.use('/api/v1/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
module.exports = app;
