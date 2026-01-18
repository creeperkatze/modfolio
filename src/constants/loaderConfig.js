export function getLoaderColor(loader) {
    const colors = {
        fabric: "#8a7b71",
        quilt: "#8b61b4",
        forge: "#5b6197",
        neoforge: "#dc895c",
        liteloader: "#4c90de",
        bukkit: "#e78362",
        bungeecord: "#c69e39",
        folia: "#6aa54f",
        paper: "#e67e7e",
        purpur: "#7763a3",
        spigot: "#cd7a21",
        velocity: "#4b98b0",
        waterfall: "#5f83cb",
        sponge: "#c49528",
        ornithe: "#6097ca",
        "bta-babric": "#5ba938",
        "legacy-fabric": "#6879f6",
        nilloader: "#dd5088",
    };
    return colors[loader.toLowerCase()] || "#8b949e";
}

export function getProjectTypeIcon(projectType) {
    const iconMap = {
        mod: "box",
        modpack: "package-open",
        resourcepack: "paintbrush",
        shader: "glasses",
        plugin: "plug",
        datapack: "datapack",
        project: "box"
    };
    return iconMap[projectType?.toLowerCase()] || "box";
}
