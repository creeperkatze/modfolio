import express from "express";
import * as metaController from "../controllers/metaController.js";
import * as curseforgeController from "../controllers/curseforgeController.js";
import * as hangarController from "../controllers/hangarController.js";

const router = express.Router();

// Modrinth meta endpoint (prefixed)
router.get("/meta/:type/:id", metaController.getMeta);

// Redirect to /meta/curseforge for backward compatibility
router.get("/meta/modrinth/:type/:id", (req, res) => res.redirect(301, `/meta/${req.params.type}/${req.params.id}`));

// CurseForge meta endpoint
router.get("/meta/curseforge/:modId", curseforgeController.getCfMeta);

// Hangar meta endpoint
router.get("/meta/hangar/:slug", hangarController.getHangarMeta);

export default router;
