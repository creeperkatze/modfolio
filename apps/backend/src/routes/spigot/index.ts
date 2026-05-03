import express from "express";
import metaRoutes from "./metaRoutes.js";
import resourceRoutes from "./resourceRoutes.js";
import authorRoutes from "./authorRoutes.js";

const router = express.Router();

router.use(metaRoutes);
router.use(resourceRoutes);
router.use(authorRoutes);

export default router;
