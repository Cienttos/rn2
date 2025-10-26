import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import uploadRoutes from './routes/upload.js';

const app = express();

app.use(cors({ origin: ["http://localhost:8081", "https://rn2.vercel.app"], credentials: true }));
app.use(express.json());
app.use(cookieParser());



app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);

export default app;
