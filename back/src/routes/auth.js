import { Router } from 'express';
import { register, login, logout, oauth, googleSignIn } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/oauth/:provider', oauth); // Para Google, Facebook, etc.

router.post('/google-signin', googleSignIn);

export default router;
