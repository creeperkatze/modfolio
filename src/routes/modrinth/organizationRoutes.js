import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Card routes
router.get("/modrinth/organization/:id", cardController.getOrganization);

router.get("/organization/:id", (req, res) => res.redirect(301, `/modrinth/organization/${req.params.id}`)); // Deprecated

// Badge routes
router.get("/modrinth/organization/:id/downloads", badgeController.getOrganizationDownloads);
router.get("/modrinth/organization/:id/projects", badgeController.getOrganizationProjects);
router.get("/modrinth/organization/:id/followers", badgeController.getOrganizationFollowers);

router.get("/organization/:id/downloads", (req, res) => res.redirect(301, `/modrinth/organization/${req.params.id}/downloads`)); // Deprecated
router.get("/organization/:id/projects", (req, res) => res.redirect(301, `/modrinth/organization/${req.params.id}/projects`)); // Deprecated
router.get("/organization/:id/followers", (req, res) => res.redirect(301, `/modrinth/organization/${req.params.id}/followers`)); // Deprecated

export default router;
