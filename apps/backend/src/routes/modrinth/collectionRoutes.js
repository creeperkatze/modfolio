import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Card routes
router.get("/modrinth/collection/:id", cardController.getCollection);

router.get("/collection/:id", (req, res) => res.redirect(301, `/modrinth/collection/${req.params.id}`)); // Deprecated

// Badge routes
router.get("/modrinth/collection/:id/downloads", badgeController.getCollectionDownloads);
router.get("/modrinth/collection/:id/projects", badgeController.getCollectionProjects);
router.get("/modrinth/collection/:id/followers", badgeController.getCollectionFollowers);

router.get("/collection/:id/downloads", (req, res) => res.redirect(301, `/modrinth/collection/${req.params.id}/downloads`)); // Deprecated
router.get("/collection/:id/projects", (req, res) => res.redirect(301, `/modrinth/collection/${req.params.id}/projects`)); // Deprecated
router.get("/collection/:id/followers", (req, res) => res.redirect(301, `/modrinth/collection/${req.params.id}/followers`)); // Deprecated

export default router;
