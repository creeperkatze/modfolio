import modrinthClient from '../services/modrinthClient.js';
import cache from '../utils/cache.js';
import { generateUserSummaryCard as generateUserCard, generateProjectsCard } from '../utils/svgGenerator.js';

const MAX_AGE = Math.floor(cache.ttl / 1000);

const handleCardRequest = async (req, res, next, cardType, generator) => {
  try {
    const { username } = req.params;
    const theme = req.query.theme || 'dark';
    const cacheKey = `${cardType}:${username}:${theme}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', `public, max-age=${MAX_AGE}`);
      return res.send(cached);
    }

    const data = await modrinthClient.getUserStats(username);
    const svg = generator(data, theme);

    cache.set(cacheKey, svg);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${MAX_AGE}`);
    res.send(svg);
  } catch (err) {
    next(err);
  }
};

export const getUser = (req, res, next) =>
  handleCardRequest(req, res, next, 'user', generateUserCard);