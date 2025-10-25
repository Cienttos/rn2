import express from 'express';
import { getProfile, updateProfile, uploadMiddleware } from '../controllers/profileController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getProfile);
router.put('/', authenticate, uploadMiddleware, updateProfile);

export default router;
