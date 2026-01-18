# Modrinth Embeds

Generate beautiful, embeddable cards and badges for Modrinth projects, users, organizations, and collections.

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v1/monitor/2d89t.svg)](https://uptime.betterstack.com/?utm_source=status_badge)
![GitHub Issues](https://img.shields.io/github/issues/creeperkatze/modrinth-embeds?labelColor=0d143c)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/creeperkatze/modrinth-embeds?labelColor=0d143c)
![GitHub Repo stars](https://img.shields.io/github/stars/creeperkatze/modrinth-embeds?style=flat&labelColor=0d143c)

## Features

- **SVG Cards**: Rich, informative cards displaying stats, latest versions, and metadata
- **Badges**: Compact badges showing download counts, follower counts, and version/project counts
- **Multiple Entity Types**: Support for projects, users, organizations, and collections
- **OpenGraph Metadata**: Generate meta tags for social media previews
- **Lightweight**: Fast, cacheable SVG generation with no frontend dependencies

## Usage

### Web Configurator

Visit **[modrinth-embeds.creeperkatze.de](https://modrinth-embeds.creeperkatze.de)** to configure and preview embeds with a visual interface.

### Examples

[![Prospector](https://modrinth-embeds.creeperkatze.de/user/prospector)](https://modrinth.com/user/prospector)
[![Mod Menu](https://modrinth-embeds.creeperkatze.de/project/modmenu)](https://modrinth.com/project/modmenu)
[![CaffeineMC](https://modrinth-embeds.creeperkatze.de/organization/caffeinemc)](https://modrinth.com/organization/caffeinemc)

### Embedding in Markdown

```markdown
[![Project Name](https://modrinth-embeds.creeperkatze.de/project/{slug})](https://modrinth.com/project/{slug})
```

### Embedding in HTML

```html
<a href="https://modrinth.com/project/{slug}">
  <img src="https://modrinth-embeds.creeperkatze.de/project/{slug}" alt="Project Name">
</a>
```

## API Reference

Base URL: `https://modrinth-embeds.creeperkatze.de`

### Project Endpoints

#### Get Project Card
```
GET /project/{slug}
```
Returns an SVG card with project stats, latest versions, loaders, and download counts.

**Parameters:**
- `slug` (path): Project slug or ID

#### Get Project Download Badge
```
GET /project/{slug}/downloads
```
Returns a compact badge showing total download count.

#### Get Project Follower Badge
```
GET /project/{slug}/followers
```
Returns a compact badge showing follower count.

#### Get Project Version Badge
```
GET /project/{slug}/versions
```
Returns a compact badge showing version count.

---

### User Endpoints

#### Get User Card
```
GET /user/{username}
```
Returns an SVG card with user stats and information.

**Parameters:**
- `username` (path): Username or user ID

#### Get User Download Badge
```
GET /user/{username}/downloads
```
Returns a badge showing total downloads across all user projects.

#### Get User Project Badge
```
GET /user/{username}/projects
```
Returns a badge showing total project count.

#### Get User Follower Badge
```
GET /user/{username}/followers
```
Returns a badge showing follower count.

---

### Organization Endpoints

#### Get Organization Card
```
GET /organization/{id}
```
Returns an SVG card with organization stats and information.

**Parameters:**
- `id` (path): Organization ID

#### Get Organization Download Badge
```
GET /organization/{id}/downloads
```
Returns a badge showing total downloads across all organization projects.

#### Get Organization Project Badge
```
GET /organization/{id}/projects
```
Returns a badge showing total project count.

#### Get Organization Follower Badge
```
GET /organization/{id}/followers
```
Returns a badge showing follower count.

---

### Collection Endpoints

#### Get Collection Card
```
GET /collection/{id}
```
Returns an SVG card with collection information.

**Parameters:**
- `id` (path): Collection ID

#### Get Collection Download Badge
```
GET /collection/{id}/downloads
```
Returns a badge showing total downloads across all collection projects.

#### Get Collection Project Badge
```
GET /collection/{id}/projects
```
Returns a badge showing project count in the collection.

#### Get Collection Follower Badge
```
GET /collection/{id}/followers
```
Returns a badge showing follower count.

## Self-Hosting

### Prerequisites

- Node.js 18 or higher
- pnpm (or npm/yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/modrinth-embeds.git
cd modrinth-embeds

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Or start production server
pnpm start
```

### Environment Variables

Copy the `.env.example` file and rename it to `.env`

## License

AGPL-3.0
