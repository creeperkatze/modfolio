import { generateBadge } from '../utils/svgGenerator.js';

function generateErrorCard(message, theme = 'dark') {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1e1e2e' : '#ffffff';
  const textColor = isDark ? '#f38ba8' : '#d20f39';
  const borderColor = isDark ? '#f38ba8' : '#d20f39';

  return `
<svg width="450" height="120" xmlns="http://www.w3.org/2000/svg">
  <rect width="450" height="120" fill="${bgColor}" rx="10" stroke="${borderColor}" stroke-width="2"/>
  <text x="225" y="50" text-anchor="middle" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="18" font-weight="bold" fill="${textColor}">
    Error
  </text>
  <text x="225" y="80" text-anchor="middle" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" fill="${textColor}">
    ${message}
  </text>
</svg>`.trim();
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  const theme = req.query.theme || 'dark';

  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err.message.includes('not found')) {
    statusCode = 404;
    message = 'User not found';
  } else if (err.message.includes('Modrinth API')) {
    statusCode = 502;
    message = 'Modrinth API unavailable';
  } else if (err.message.includes('Rate limit')) {
    statusCode = 429;
    message = 'Rate limit exceeded';
  }

  // Check if this is a badge request
  const isBadge = req.path.includes('/badge');

  // Return appropriate error SVG
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (isBadge) {
    res.status(statusCode).send(generateBadge('error', message, '#f38ba8'));
  } else {
    res.status(statusCode).send(generateErrorCard(message, theme));
  }
}
