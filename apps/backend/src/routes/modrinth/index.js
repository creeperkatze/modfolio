import express from "express";
import userRoutes from "./userRoutes.js";
import projectRoutes from "./projectRoutes.js";
import organizationRoutes from "./organizationRoutes.js";
import collectionRoutes from "./collectionRoutes.js";
import serverRoutes from "./serverRoutes.js";
import metaRoutes from "./metaRoutes.js";

const router = express.Router();

router.use(userRoutes);
router.use(projectRoutes);
router.use(organizationRoutes);
router.use(collectionRoutes);
router.use(serverRoutes);
router.use(metaRoutes);

export default router;
