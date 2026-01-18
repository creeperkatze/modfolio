import modrinthClient from '../services/modrinthClient.js';
import cache from '../utils/cache.js';
import { generateBadge } from '../generators/badge.js';
import { formatNumber } from '../utils/formatters.js';
import logger from '../utils/logger.js';

const MAX_AGE = Math.floor(cache.ttl / 1000);

const handleBadgeRequest = async (req, res, next, badgeType, getValue) => {
  try {
    const { username } = req.params;
    const color = req.query.color || '#1bd96a';
    const cacheKey = `badge:${badgeType}:${username}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info(`Showing ${badgeType} badge for "${username}" (cached)`);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', `public, max-age=${MAX_AGE}`);
      return res.send(cached);
    }

    const data = await modrinthClient.getUserStats(username);
    const value = getValue(data.stats);
    const svg = generateBadge(badgeType, value, color);

    cache.set(cacheKey, svg);
    logger.info(`Showing ${badgeType} badge for "${username}"`);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${MAX_AGE}`);
    res.send(svg);
  } catch (err) {
    logger.error(`Error showing ${badgeType} badge for "${req.params.username}": ${err.message}`);
    next(err);
  }
};

export const getDownloads = (req, res, next) =>
  handleBadgeRequest(req, res, next, 'downloads', stats => formatNumber(stats.totalDownloads));

export const getProjects = (req, res, next) =>
  handleBadgeRequest(req, res, next, 'projects', stats => stats.projectCount.toString());

export const getFollowers = (req, res, next) =>
  handleBadgeRequest(req, res, next, 'followers', stats => formatNumber(stats.totalFollowers));
