import { Router } from 'express';
import { getCAs, getCAClientMappings } from '../controllers/caController.js';

const router = Router();

router.get('/', getCAs);
router.get('/assignments', getCAClientMappings);

export default router;
