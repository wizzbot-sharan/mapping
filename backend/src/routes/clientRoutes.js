import { Router } from 'express';
import { getClients, syncClients, assignCA } from '../controllers/clientController.js';

const router = Router();

router.get('/', getClients);
router.post('/sync', syncClients);
router.put('/:clientId/assign-ca', assignCA);

export default router;
