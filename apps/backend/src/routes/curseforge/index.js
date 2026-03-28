import express from "express";
import metaRoutes from "./metaRoutes.js";
import projectRoutes from "./projectRoutes.js";
import userRoutes from "./userRoutes.js";

const router = express.Router();

router.use(metaRoutes);
router.use(projectRoutes);
router.use(userRoutes);

export default router;
