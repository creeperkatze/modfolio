import express from 'express';
import * as cardController from '../controllers/cardController.js';

const router = express.Router();

router.get('/summary/:username', cardController.getUser); // Deprecated
router.get('/user/:username', cardController.getUser);

export default router;
