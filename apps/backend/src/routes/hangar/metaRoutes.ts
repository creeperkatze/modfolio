import express from "express";
import { getHangarMeta } from "../../controllers/hangarController.js";

const router = express.Router();

router.get("/hangar/meta/:slug", getHangarMeta);

export default router;
