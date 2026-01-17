import express from 'express';
import * as cardController from '../controllers/cardController.js';

const router = express.Router();

router.get('/summary/:username', cardController.getSummary);
router.get('/top-projects/:username', cardController.getTopProjects);

export default router;
