import sharp from "sharp";
import { performance } from "perf_hooks";
import { readdirSync, readFileSync } from "fs";
import path from "path";

// Load and convert font files to base64
const fontsDir = path.join(process.cwd(), "public", "fonts");
const fontBase64Strings = [];

try {
    const fontFiles = readdirSync(fontsDir)
        .filter(file => /\.(ttf|otf|woff|woff2)$/i.test(file));

    for (const file of fontFiles) {
        const fontBuffer = readFileSync(path.join(fontsDir, file));
        const ext = path.extname(file).slice(1);
        const mime = ext === "woff2" ? "font/woff2" : ext === "woff" ? "font/woff" : "font/truetype";
        fontBase64Strings.push(`url(data:${mime};charset=utf-8;base64,${fontBuffer.toString("base64")})`);
    }
} catch {
    // fonts directory doesn't exist
}

export async function generatePng(svgString)
{
    const startTime = performance.now();

    let processedSvg = svgString;

    if (fontBase64Strings.length > 0) {
        const fontFace = `
            <style>
                @font-face {
                    font-family: 'EmbeddedFont';
                    src: ${fontBase64Strings.join(", ")};
                }
            </style>
        `;

        processedSvg = svgString.replace("<svg", fontFace + "<svg");

        // Replace font-family references to use embedded font
        processedSvg = processedSvg.replace(/font-family="Inter, sans-serif"/g, "font-family='EmbeddedFont, Inter, sans-serif'");
    }

    const pngBuffer = await sharp(Buffer.from(processedSvg), {
        density: 72
    })
        .resize(800, null, {
            fit: "inside",
            withoutEnlargement: true
        })
        .png()
        .toBuffer();

    const renderTime = performance.now() - startTime;

    return { buffer: pngBuffer, renderTime };
}