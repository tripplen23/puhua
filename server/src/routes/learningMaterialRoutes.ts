import { Router } from 'express';
import { createLearningMaterial } from '../controllers/learningMaterialController';

const router = Router();

// POST /api/learning-materials
router.post('/', createLearningMaterial);

export default router;