import path from "path";
import { readdirSync } from "fs";
import { Resvg } from "@resvg/resvg-js";

// Load font files
const fontsDir = path.join(process.cwd(), "public", "fonts");

const fontFiles = readdirSync(fontsDir)
    .filter(file => /\.(ttf|otf|woff2)$/i.test(file))
    .map(file => path.join(fontsDir, file));

export async function generatePng(svgString)
{
    const options = {
        fitTo: {
            mode: "original"
        },
        font: {
            loadSystemFonts: false,
            fontFiles: fontFiles,
            defaultFontFamily: "Inter"
        }
    };

    const resvg = new Resvg(svgString, options);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return pngBuffer;
}