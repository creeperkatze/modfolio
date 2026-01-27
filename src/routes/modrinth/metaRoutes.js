import express from "express";
import * as metaController from "../../controllers/metaController.js";

const router = express.Router();

router.get("/modrinth/meta/:type/:id", metaController.getMeta);

export default router;
