import { Router } from 'express';
import multer from 'multer';
import { uploadFile, scanImage } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Todas las rutas de subida requieren autenticación
router.use(authenticate);

// Ruta para subir cualquier tipo de archivo (documento, imagen, etc.)
router.post('/document', upload.single('file'), uploadFile);

// Ruta específica para escanear una imagen y extraer texto
router.post('/scan', upload.single('image'), scanImage);

export default router;
