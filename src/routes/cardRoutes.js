import express from 'express';
import * as cardController from '../controllers/cardController.js';

const router = express.Router();

router.get('/summary/:username', cardController.getSummary);
router.get('/user/:username', cardController.getSummary);
router.get('/projects/:username', cardController.getProjects);

export default router;
