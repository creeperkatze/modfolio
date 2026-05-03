import { getPlatformConfig } from "../constants/platformConfig.js";
import { generateProjectCard } from "./cards/projectCard.js";
import { generateUserCard } from "./cards/userCard.js";
import { generateOrganizationCard } from "./cards/organizationCard.js";
import { generateCollectionCard } from "./cards/collectionCard.js";

export function generateCard(data, platformId, entityType, options = {})
{
    const platformConfig = getPlatformConfig(platformId);

    if (!platformConfig) {
        throw new Error(`Unknown platform: ${platformId}`);
    }

    // Map platform-specific entity types to standard types
    let mappedEntityType = entityType;
    if (platformId === "curseforge" && entityType === "mod") {
        mappedEntityType = "project";
    } else if (platformId === "spigot") {
        if (entityType === "resource") {
            mappedEntityType = "project";
        } else if (entityType === "author") {
            mappedEntityType = "user";
        }
    }

    switch (mappedEntityType) {
    case "project":
    case "server":
        return generateProjectCard(data, options, platformConfig, entityType);
    case "user":
        return generateUserCard(data, options, platformConfig);
    case "organization":
        return generateOrganizationCard(data, options, platformConfig);
    case "collection":
        return generateCollectionCard(data, options, platformConfig);
    default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
}
