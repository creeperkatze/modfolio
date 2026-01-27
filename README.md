# <a href="https://modfolio.creeperkatze.de"><img src=".github/assets/logo.png" alt="Logo" width="400"></a>

Generate fast, beautiful and consistent embeddable cards and badges for Modrinth, CurseForge, Hangar and Spigot content.

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v1/monitor/2d89t.svg)](https://status.creeperkatze.de)
![GitHub Issues](https://img.shields.io/github/issues/creeperkatze/modfolio?labelColor=0d143c)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/creeperkatze/modfolio?labelColor=0d143c)
![GitHub Repo stars](https://img.shields.io/github/stars/creeperkatze/modfolio?style=flat&labelColor=0d143c)

## Quick Start

Use the **[Website](https://modfolio.creeperkatze.de)** to visually configure and preview your embeds.

Examples:

[![Mod Menu](https://modfolio.creeperkatze.de/project/modmenu)](https://modrinth.com/project/modmenu)
[![Prospector](https://modfolio.creeperkatze.de/user/prospector)](https://modrinth.com/user/prospector)
[![CaffeineMC](https://modfolio.creeperkatze.de/organization/caffeinemc)](https://modrinth.com/organization/caffeinemc)
[![Featured - Vol. 38](https://modfolio.creeperkatze.de/collection/VEgGDFFE)](https://modrinth.com/collection/VEgGDFFE)

## Endpoints

Base URL: `https://modfolio.creeperkatze.de`

### Cards

Rich cards showing stats, versions, projects, and activity sparklines.

Pattern: `/<type>/<slug-or-id>?<option>=<value>`

| Card Type | Path | Example |
|-----------|------|---------|
| Project | `/project/<slug-or-id>` | [![Mod Menu](https://modfolio.creeperkatze.de/project/modmenu)](https://modrinth.com/project/modmenu) |
| User | `/user/<username-or-id>` | [![Prospector](https://modfolio.creeperkatze.de/user/prospector)](https://modrinth.com/user/prospector) |
| Organizationn | `/organization/<slug-or-id>` | [![CaffeineMC](https://modfolio.creeperkatze.de/organization/caffeinemc)](https://modrinth.com/organization/caffeinemc) |
| Collection | `/collection/<id>` | [![Featured - Vol. 38](https://modfolio.creeperkatze.de/collection/VEgGDFFE)](https://modrinth.com/collection/VEgGDFFE) |

#### Card Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `color` | Accent color (hex) | `#1bd96a` |
| `backgroundColor` | Background color (hex) | `transparent` |
| `showProjects` | Show top projects section | `true` |
| `showVersions` | Show versions section | `true` |
| `maxProjects` | Max projects to display (1-10) | `5` |
| `maxVersions` | Max versions to display (1-10) | `5` |
| `relativeTime` | Show relative time for dates | `true` |
| `showSparklines` | Display activity sparklines | `true` |

### Badges

Pattern: `/<type>/<slug-or-id>/<metric>?<option>=<value>`

Compact badges showing a single metric.

| Badge Type | Path | Example |
|------------|------|---------|
| Downloads | `<type>/<slug-or-id>/downloads` | ![Downloads](https://modfolio.creeperkatze.de/project/modmenu/downloads) |
| Projects | `<type>/<slug-or-id>/projects` | ![Projects](https://modfolio.creeperkatze.de/user/prospector/projects) |
| Followers | `<type>/<slug-or-id>/followers` | ![Followers](https://modfolio.creeperkatze.de/project/modmenu/followers) |
| Versions | `<type>/<slug-or-id>/versions` | ![Versions](https://modfolio.creeperkatze.de/project/modmenu/versions) |

#### Badge Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `color` | Accent color (hex) | `#1bd96a` |
| `backgroundColor` | Background color (hex) | `transparent` |
| `format` | Output format (`svg` / `png`) | `svg` |

## Development

### Prequisites

- Node.js
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/creeperkatze/modfolio.git
cd modfolio

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Variables

Copy the `.env.example` file and rename it to `.env`.

## Contributing

Contributions are always welcome!

Please ensure you run `pnpm lint` before opening a pull request.

## License

AGPL-3.0
