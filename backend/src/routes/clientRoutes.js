import { Router } from 'express';
import { getClients, syncClients, assignCA, manualResetTemp } from '../controllers/clientController.js';

const router = Router();

router.get('/', getClients);
router.post('/sync', syncClients);
router.put('/:clientId/assign-ca', assignCA);
router.all('/reset-temp', manualResetTemp);

export default router;
