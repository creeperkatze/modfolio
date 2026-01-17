import express from 'express';
import * as badgeController from '../controllers/badgeController.js';

const router = express.Router();

router.get('/downloads/:username', badgeController.getDownloads);
router.get('/projects/:username', badgeController.getProjects);
router.get('/followers/:username', badgeController.getFollowers);

export default router;
    