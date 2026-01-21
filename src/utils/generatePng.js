import path from "path";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "fs";
import logger from "./logger.js";

// Load Inter font from public/fonts
const fontPath = path.join(process.cwd(), "public", "fonts", "inter.ttf");
const fontBuffer = readFileSync(fontPath);

export async function generatePng(svgString)
{
    logger.info(fontPath);

    const options = {
        fitTo: {
            mode: "original"
        },
        font: {
            loadSystemFonts: false,
            fontFiles: [fontBuffer],
            defaultFontFamily: "Inter"
        }
    };

    const resvg = new Resvg(svgString, options);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return pngBuffer;
}