import { Router } from 'express';
import { getCAs } from '../controllers/caController.js';

const router = Router();

router.get('/', getCAs);

export default router;
