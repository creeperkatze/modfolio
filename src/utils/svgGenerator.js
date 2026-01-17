export function formatNumber(num)
{
    if (num >= 1000000)
    {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000)
    {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function escapeXml(unsafe)
{
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Icon definitions
const ICONS = {
    download: (color = 'currentColor') => `
        <path d="M12 15V3" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="m7 10 5 5 5-5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    heart: (color = 'currentColor') => `
        <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    fabric: (color = 'currentColor') => `
        <path fill="none" stroke="${color}" stroke-width="23" d="m820 761-85.6-87.6c-4.6-4.7-10.4-9.6-25.9 1-19.9 13.6-8.4 21.9-5.2 25.4 8.2 9 84.1 89 97.2 104 2.5 2.8-20.3-22.5-6.5-39.7 5.4-7 18-12 26-3 6.5 7.3 10.7 18-3.4 29.7-24.7 20.4-102 82.4-127 103-12.5 10.3-28.5 2.3-35.8-6-7.5-8.9-30.6-34.6-51.3-58.2-5.5-6.3-4.1-19.6 2.3-25 35-30.3 91.9-73.8 111.9-90.8" transform="matrix(.08671 0 0 .0867 -49.8 -56)"/>
    `,
    quilt: (color = 'currentColor') => `
        <defs>
            <path id="quilt-piece" fill="none" stroke="${color}" stroke-width="65.6" d="M442.5 233.9c0-6.4-5.2-11.6-11.6-11.6h-197c-6.4 0-11.6 5.2-11.6 11.6v197c0 6.4 5.2 11.6 11.6 11.6h197c6.4 0 11.6-5.2 11.6-11.7v-197Z"/>
        </defs>
        <use href="#quilt-piece" stroke-width="65.6" transform="matrix(.03053 0 0 .03046 -3.2 -3.2)"/>
        <use href="#quilt-piece" stroke-width="65.6" transform="matrix(.03053 0 0 .03046 -3.2 7)"/>
        <use href="#quilt-piece" stroke-width="65.6" transform="matrix(.03053 0 0 .03046 6.9 -3.2)"/>
        <path fill="none" stroke="${color}" stroke-width="70.4" d="M442.5 234.8c0-7-5.6-12.5-12.5-12.5H234.7c-6.8 0-12.4 5.6-12.4 12.5V430c0 6.9 5.6 12.5 12.4 12.5H430c6.9 0 12.5-5.6 12.5-12.5V234.8Z" transform="rotate(45 3.5 24) scale(.02843 .02835)"/>
    `,
    forge: (color = 'currentColor') => `
        <path fill="none" stroke="${color}" stroke-width="2" d="M2 7.5h8v-2h12v2s-7 3.4-7 6 3.1 3.1 3.1 3.1l.9 3.9H5l1-4.1s3.8.1 4-2.9c.2-2.7-6.5-.7-8-6Z"/>
    `,
    neoforge: (color = 'currentColor') => `
        <g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <path d="m12 19.2v2m0-2v2"/>
            <path d="m8.4 1.3c0.5 1.5 0.7 3 0.1 4.6-0.2 0.5-0.9 1.5-1.6 1.5m8.7-6.1c-0.5 1.5-0.7 3-0.1 4.6 0.2 0.6 0.9 1.5 1.6 1.5"/>
            <path d="m3.6 15.8h-1.7m18.5 0h1.7"/>
            <path d="m3.2 12.1h-1.7m19.3 0h1.8"/>
            <path d="m8.1 12.7v1.6m7.8-1.6v1.6"/>
            <path d="m10.8 18h1.2m0 1.2-1.2-1.2m2.4 0h-1.2m0 1.2 1.2-1.2"/>
            <path d="m4 9.7c-0.5 1.2-0.8 2.4-0.8 3.7 0 3.1 2.9 6.3 5.3 8.2 0.9 0.7 2.2 1.1 3.4 1.1m0.1-17.8c-1.1 0-2.1 0.2-3.2 0.7m11.2 4.1c0.5 1.2 0.8 2.4 0.8 3.7 0 3.1-2.9 6.3-5.3 8.2-0.9 0.7-2.2 1.1-3.4 1.1m-0.1-17.8c1.1 0 2.1 0.2 3.2 0.7"/>
            <path d="m4 9.7c-0.2-1.8-0.3-3.7 0.5-5.5s2.2-2.6 3.9-3m11.6 8.5c0.2-1.9 0.3-3.7-0.5-5.5s-2.2-2.6-3.9-3"/>
            <path d="m12 21.2-2.4 0.4m2.4-0.4 2.4 0.4"/>
        </g>
    `,
    paper: (color = 'currentColor') => `
        <path fill="none" stroke="${color}" stroke-width="2" d="m12 18 6 2 3-17L2 14l6 2"/>
        <path stroke="${color}" stroke-width="2" d="m9 21-1-5 4 2-3 3Z"/>
        <path fill="${color}" d="m12 18-4-2 10-9-6 11Z"/>
    `,
    spigot: (color = 'currentColor') => `
        <path stroke="${color}" fill="none" stroke-width="24" d="M147.5,27l27,-15l27.5,15l66.5,0l0,33.5l-73,-0.912l0,45.5l26,-0.088l0,31.5l-12.5,0l0,15.5l16,21.5l35,0l0,-21.5l35.5,0l0,21.5l24.5,0l0,55.5l-24.5,0l0,17l-35.5,0l0,-27l-35,0l-55.5,14.5l-67.5,-14.5l-15,14.5l18,12.5l-3,24.5l-41.5,1.5l-48.5,-19.5l6,-19l24.5,-4.5l16,-41l79,-36l-7,-15.5l0,-31.5l23.5,0l0,-45.5l-73.5,0l0,-32.5l67,0Z" transform="scale(.072)"/>
    `,
    bukkit: (color = 'currentColor') => `
        <path stroke="${color}" fill="none" stroke-width="24" d="M12,109.5L12,155L34.5,224L57.5,224L57.5,271L81,294L160,294L160,172L259.087,172L265,155L265,109.5M12,109.5L12,64L34.5,64L34.5,41L81,17L195.5,17L241,41L241,64L265,64L265,109.5M12,109.5L81,109.5L81,132L195.5,132L195.5,109.5L265,109.5M264.087,204L264.087,244M207.5,272L207.5,312M250,272L250,312L280,312L280,272L250,272ZM192.5,204L192.5,204L222.5,244L222.5,204L192.5,204Z" transform="matrix(1,0,0,1,0,-5) scale(.075)"/>
    `,
    purpur: (color = 'currentColor') => `
        <defs>
            <path id="purpur-piece" fill="none" stroke="${color}" stroke-width="1.68" d="m264 41.95 8-4v8l-8 4v-8Z"/>
        </defs>
        <path fill="none" stroke="${color}" stroke-width="1.77" d="m264 29.95-8 4 8 4.42 8-4.42-8-4Z" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
        <path fill="none" stroke="${color}" stroke-width="1.77" d="m272 38.37-8 4.42-8-4.42" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
        <path fill="none" stroke="${color}" stroke-width="1.77" d="m260 31.95 8 4.21V45" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
        <path fill="none" stroke="${color}" stroke-width="1.77" d="M260 45v-8.84l8-4.21" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
        <use href="#purpur-piece" stroke-width="1.68" transform="matrix(1.125 0 0 1.2569 -285 -40.78)"/>
        <use href="#purpur-piece" stroke-width="1.68" transform="matrix(-1.125 0 0 1.2569 309 -40.78)"/>
    `,
    vanilla: (color = 'currentColor') => `
        <path fill="${color}" fill-rule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clip-rule="evenodd"/>
    `,
    box: (color = 'currentColor') => `
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="m3.3 7 8.7 5 8.7-5" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 22V12" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    'package-open': (color = 'currentColor') => `
        <path d="M12 22v-9" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    paintbrush: (color = 'currentColor') => `
        <path d="m14.622 17.897-10.68-2.913" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    plug: (color = 'currentColor') => `
        <path d="M12 22v-5" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 8V2" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 8V2" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    braces: (color = 'currentColor') => `
        <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    glasses: (color = 'currentColor') => `
        <circle cx="6" cy="15" r="4" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="18" cy="15" r="4" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    liteloader: (color = 'currentColor') => `
        <path d="m3.924 21.537s3.561-1.111 8.076-6.365c2.544-2.959 2.311-1.986 4-4.172" fill="none" stroke="${color}" stroke-width="2"/>
        <path d="m7.778 19s1.208-0.48 4.222 0c2.283 0.364 6.037-4.602 6.825-6.702 1.939-5.165 0.894-10.431 0.894-10.431s-4.277 4.936-6.855 7.133c-5.105 4.352-6.509 11-6.509 11" fill="none" stroke="${color}" stroke-width="2"/>
    `,
    bungeecord: (color = 'currentColor') => `
        <path d="M3.778,19.778C3.778,21.004 4.774,22 6,22C7.226,22 8.222,21.004 8.222,19.778L8.222,16.444C8.222,15.218 7.226,14.222 6,14.222L6,7.556C6,5.727 7.171,4.222 9,4.222C10.829,4.222 12,5.727 12,7.556L12,16.444" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7,15L6,13L5,15L7,15" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20.222,4.444C20.222,3.218 19.226,2.222 18,2.222C16.774,2.222 15.778,3.218 15.778,4.444L15.778,7.778C15.778,9.004 16.774,10 18,10L18,16.667C18,18.495 16.829,20 15,20C13.171,20 12,18.495 12,16.667L12,7.778" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17,9.222L18,11.222L19,9.222L17,9.222" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    folia: (color = 'currentColor') => `
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    waterfall: (color = 'currentColor') => `
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    velocity: (color = 'currentColor') => `
        <path d="M236.25 232.55l-54.08-73.79a11.86 11.86 0 00-11.91-4.62L84 171.57a11.88 11.88 0 00-8 5.88l-42.64 77.07a11.84 11.84 0 00.81 12.75l54.21 74a11.86 11.86 0 0011.91 4.62l86-17.37a11.85 11.85 0 008-5.89l42.78-77.3a11.86 11.86 0 00-.82-12.78zm-59.45 74.21a9.57 9.57 0 01-13.39-2.06l-31-42.24a16 16 0 00-16-6.21l-52.58 10.63a9.58 9.58 0 01-11.29-7.49A9.58 9.58 0 0160 248.1l57-11.52a16 16 0 0010.81-7.92L156.42 177a9.58 9.58 0 0113-3.75 9.58 9.58 0 013.75 13L146.81 234a16 16 0 001.09 17.16l31 42.23a9.58 9.58 0 01-2.1 13.37z" fill="${color}" transform="scale(0.048)"/>
        <circle cx="20.02" cy="11.33" r="0.47" fill="${color}" transform="scale(0.048) translate(8333.33 4937.5)"/>
        <path d="M458.29 265.6H280.52a9.83 9.83 0 110-19.66h106.22a9.84 9.84 0 000-19.67h-70.2a9.83 9.83 0 110-19.66H422.9a9.84 9.84 0 000-19.67H202.83l33.42 45.61a11.86 11.86 0 01.81 12.75l-42.78 77.3a11.75 11.75 0 01-1.4 2h212.29a9.83 9.83 0 100-19.66h-53.53a9.84 9.84 0 110-19.67h106.65a9.84 9.84 0 100-19.67z" fill="${color}" transform="scale(0.048)"/>
    `,
    sponge: (color = 'currentColor') => `
        <path d="M84.299,35.5c-5.547,-13.776 -19.037,-23.5 -34.799,-23.5c-20.711,0 -37.5,16.789 -37.5,37.5c-0,20.711 16.789,37.5 37.5,37.5c20.711,0 37.5,-16.789 37.5,-37.5c0,-4.949 -0.959,-9.674 -2.701,-14Zm0,0l44.701,-8.5l28,65m0,0l-99,20l-18,47.5l15.5,37l-25,32.5l0,72l222.5,0l2.5,-72l-33.5,-117l-65,-20Zm-60,65l0,15m94,-13.5l0,13.5m-67.5,45l46,0l-12.5,50.5l-14.5,0l-19,-50.5Z" stroke="${color}" fill="none" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.0895)"/>
    `,
    ornithe: (color = 'currentColor') => `
        <path d="M8 7H7.99" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20.6 18H12C9.87827 18 7.84344 17.1572 6.34315 15.6569C4.84285 14.1566 4 12.1217 4 10V7.00001C3.99775 6.14792 4.26766 5.31737 4.7704 4.6294C5.27315 3.94142 5.98245 3.43197 6.79496 3.17527C7.60747 2.91857 8.48072 2.92804 9.28746 3.2023C10.0942 3.47657 10.7923 4.00129 11.28 4.70001L22 20" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 7L2 7.5L4 8" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 18V21" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 17.75V21" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 18C15.7669 18 14.5637 17.62 13.5543 16.9117C12.5448 16.2035 11.7781 15.2014 11.3584 14.0419C10.9388 12.8824 10.8866 11.6218 11.2089 10.4315C11.5313 9.24128 12.2126 8.17927 13.16 7.39001" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    babric: (color = 'currentColor') => `
        <path d="M12.35 5.89001L12.34 5.90001C10.59 7.37001 5.67003 11.13 2.64003 13.76C2.09003 14.23 1.97003 15.38 2.44003 15.93C4.24003 17.97 6.24003 20.2 6.89003 20.97C7.52003 21.69 8.91003 22.39 10 21.49C11.8 20 16.78 16.01 19.62 13.7" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M19.59 13.66C19.34 13.33 18.02 11.53 19.05 10.25C19.52 9.63998 20.61 9.20998 21.3 9.98998C21.87 10.62 22.23 11.55 21.01 12.56C20.66 12.85 20.18 13.24 19.62 13.7C19.61 13.69 19.6 13.67 19.59 13.66Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M19.63 13.71L19.62 13.7C19.61 13.69 19.6 13.67 19.59 13.66C18.65 12.59 14.44 8.13999 12.34 5.89999C11.76 5.28999 11.33 4.83999 11.18 4.66999C10.91 4.36999 9.91004 3.64999 11.63 2.46999C12.98 1.54999 13.48 1.97999 13.88 2.37999L21.3 9.97999" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M10.6352 14.7743C10.7992 14.517 10.8811 14.2194 10.8811 13.8978C10.8811 12 9.2582 12 8.06967 12C7.61886 12 7.25 12.3538 7.25 12.8041V17.1948C7.25 17.637 7.61886 17.9989 8.06967 17.9989C8.1552 17.9965 9.54283 18.0068 9.57789 17.9909C10.3894 17.9668 11.25 17.6531 11.25 15.9886C11.25 15.7232 11.1762 15.1925 10.6352 14.7743ZM9.61886 13.8978C9.61886 14.0506 9.53686 14.1953 9.40574 14.2918H9.39753C9.29097 14.3722 9.15164 14.4205 9.00411 14.4205H8.47951V13.3831C8.56539 13.3831 8.92616 13.3832 9.00411 13.3831C9.34015 13.3831 9.61886 13.6163 9.61886 13.8978ZM9.29918 16.7927H8.47951V15.7554C8.68401 15.7555 9.09478 15.7553 9.29918 15.7554C9.71537 15.7517 10.0548 16.1404 9.85655 16.4871C9.7664 16.6641 9.54507 16.7927 9.29918 16.7927Z" fill="${color}"/>
    `,
    'bta-babric': (color = 'currentColor') => `
        <path d="M12.35 5.89001L12.34 5.90001C10.59 7.37001 5.67003 11.13 2.64003 13.76C2.09003 14.23 1.97003 15.38 2.44003 15.93C4.24003 17.97 6.24003 20.2 6.89003 20.97C7.52003 21.69 8.91003 22.39 10 21.49C11.8 20 16.78 16.01 19.62 13.7" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19.59 13.66C19.34 13.33 18.02 11.53 19.05 10.25C19.52 9.63998 20.61 9.20998 21.3 9.98998C21.87 10.62 22.23 11.55 21.01 12.56C20.66 12.85 20.18 13.24 19.62 13.7C19.61 13.69 19.6 13.67 19.59 13.66Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19.63 13.71L19.62 13.7C19.61 13.69 19.6 13.67 19.59 13.66C18.65 12.59 14.44 8.13999 12.34 5.89999C11.76 5.28999 11.33 4.83999 11.18 4.66999C10.91 4.36999 9.91004 3.64999 11.63 2.46999C12.98 1.54999 13.48 1.97999 13.88 2.37999L21.3 9.97999" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10.6352 14.7743C10.7992 14.517 10.8811 14.2194 10.8811 13.8978C10.8811 12 9.2582 12 8.06967 12C7.61886 12 7.25 12.3538 7.25 12.8041V17.1948C7.25 17.637 7.61886 17.9989 8.06967 17.9989C8.1552 17.9965 9.54283 18.0068 9.57789 17.9909C10.3894 17.9668 11.25 17.6531 11.25 15.9886C11.25 15.7232 11.1762 15.1925 10.6352 14.7743ZM9.61886 13.8978C9.61886 14.0506 9.53686 14.1953 9.40574 14.2918H9.39753C9.29097 14.3722 9.15164 14.4205 9.00411 14.4205H8.47951V13.3831C8.56539 13.3831 8.92616 13.3832 9.00411 13.3831C9.34015 13.3831 9.61886 13.6163 9.61886 13.8978ZM9.29918 16.7927H8.47951V15.7554C8.68401 15.7555 9.09478 15.7553 9.29918 15.7554C9.71537 15.7517 10.0548 16.1404 9.85655 16.4871C9.7664 16.6641 9.54507 16.7927 9.29918 16.7927Z" fill="${color}" stroke="${color}" stroke-width="0.25"/>
        <path d="M13.2991 11V14" stroke="${color}" stroke-linecap="round"/>
        <path d="M12 13.25L14.5981 11.75" stroke="${color}" stroke-linecap="round"/>
        <path d="M14.5981 13.25L12.0001 11.75" stroke="${color}" stroke-linecap="round"/>
    `,
    'legacy-fabric': (color = 'currentColor') => `
        <path d="M21.3022 9.9787L13.8798 2.38379C13.4809 1.9763 12.978 1.55147 11.634 2.47049C9.90847 3.64961 10.9056 4.36921 11.1831 4.67266C11.8941 5.45296 18.4754 12.389 19.6113 13.6895C19.8281 13.9322 17.8511 11.7387 19.0477 10.2475C19.5159 9.64057 20.6085 9.20707 21.3022 9.98737C21.8658 10.6203 22.23 11.548 21.0074 12.5624C18.8656 14.331 12.1629 19.7064 9.99518 21.4925C8.91131 22.3855 7.52395 21.6919 6.89096 20.9723C6.24064 20.2006 4.23764 17.9724 2.44274 15.9263C1.96584 15.3801 2.08723 14.227 2.64218 13.7588C5.67703 11.1318 10.6108 7.36036 12.345 5.88646" stroke="${color}" stroke-width="1.99422" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 13V17H10" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
    nilloader: (color = 'currentColor') => `
        <ellipse cx="12" cy="11" rx="5" ry="8" stroke="${color}" stroke-width="2"/>
        <path d="M16.563 2.72485L6.75577 19.7114L12.3865 22.9624" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `
};

function getLoaderColor(loader) {
    const colors = {
        fabric: '#8a7b71',
        quilt: '#8b61b4',
        forge: '#5b6197',
        neoforge: '#dc895c',
        liteloader: '#4c90de',
        bukkit: '#e78362',
        bungeecord: '#c69e39',
        folia: '#6aa54f',
        paper: '#e67e7e',
        purpur: '#7763a3',
        spigot: '#cd7a21',
        velocity: '#4b98b0',
        waterfall: '#5f83cb',
        sponge: '#c49528',
        ornithe: '#6097ca',
        'bta-babric': '#5ba938',
        'legacy-fabric': '#6879f6',
        nilloader: '#dd5088',
        minecraft: '#62C940'
    };
    return colors[loader.toLowerCase()] || '#8b949e';
}

function getProjectTypeIcon(projectType) {
    const iconMap = {
        mod: 'box',
        modpack: 'package-open',
        resourcepack: 'paintbrush',
        shader: 'glasses',
        plugin: 'plug',
        datapack: 'braces',
        project: 'box'
    };
    return iconMap[projectType?.toLowerCase()] || 'box';
}

export function generateUserCard(data, theme = 'dark')
{
    const { user, stats } = data;
    const isDark = theme === 'dark';

    const bgColor = 'transparent';
    const textColor = isDark ? '#c9d1d9' : '#1e1e2e';
    const accentColor = isDark ? '#1bd96a' : '#1bd96a';
    const secondaryTextColor = isDark ? '#8b949e' : '#4c4f69';
    const borderColor = '#E4E2E2';

    const username = escapeXml(user.username);
    const totalDownloads = formatNumber(stats.totalDownloads);
    const projectCount = stats.projectCount;
    const totalFollowers = formatNumber(stats.totalFollowers);
    const avgDownloads = formatNumber(stats.avgDownloads);

    const topProjects = stats.topProjects.slice(0, 5);
    const hasProjects = topProjects.length > 0;
    const height = hasProjects ? 150 + (topProjects.length * 50) : 110;

    // Calculate max downloads for relative bar sizing
    const maxDownloads = hasProjects ? Math.max(...topProjects.map(p => p.downloads)) : 0;

    // Generate top projects list
    let projectsHtml = '';
    topProjects.forEach((project, index) => {
        const yPos = 160 + (index * 50);
        const projectName = escapeXml(project.title);
        const downloads = formatNumber(project.downloads);
        const followers = formatNumber(project.followers || 0);

        // Calculate relative bar width (max 420px width - 10px padding on each side)
        const barWidth = (project.downloads / maxDownloads) * 400;

        // Get project type icon
        const projectTypeIconName = getProjectTypeIcon(project.project_type);
        const projectTypeIcon = ICONS[projectTypeIconName];

        // Get loaders for this project
        const loaders = project.loaders || [];
        let loaderIconsHtml = '';
        loaders.forEach((loader, loaderIndex) => {
            const loaderName = loader.toLowerCase();
            const iconFunc = ICONS[loaderName];
            const loaderColor = getLoaderColor(loaderName);
            if (iconFunc) {
                loaderIconsHtml += `
    <svg x="${54 + (loaderIndex * 18)}" y="${yPos + 2}" width="16" height="16" viewBox="0 0 24 24">
      ${iconFunc(loaderColor)}
    </svg>`;
            }
        });

        const projectIconUrl = project.icon_url || '';

        projectsHtml += `
  <!-- Project ${index + 1} -->
  <g>
    <defs>
      <clipPath id="project-clip-${index}">
        <rect x="15" y="${yPos - 18}" width="420" height="40" rx="6"/>
      </clipPath>
      <clipPath id="project-icon-clip-${index}">
        <rect x="20" y="${yPos - 12}" width="28" height="28" rx="4"/>
      </clipPath>
    </defs>
    <rect x="15" y="${yPos - 18}" width="420" height="40" fill="none" stroke="${borderColor}" stroke-width="1" rx="6" vector-effect="non-scaling-stroke"/>

    <!-- Relative downloads bar -->
    <rect x="15" y="${yPos - 18}" width="${barWidth}" height="3" fill="${accentColor}" clip-path="url(#project-clip-${index})"/>

    <!-- Project image -->
    ${projectIconUrl ? `<image x="20" y="${yPos - 12}" width="28" height="28" href="${escapeXml(projectIconUrl)}" clip-path="url(#project-icon-clip-${index})"/>` : `<rect x="20" y="${yPos - 12}" width="28" height="28" fill="${borderColor}" rx="4"/>`}

    <text x="54" y="${yPos - 2}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" font-weight="600" fill="${textColor}">
      ${projectName}
    </text>

    <!-- Loaders -->
    ${loaderIconsHtml}

    <!-- Downloads -->
    <text x="380" y="${yPos}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${secondaryTextColor}" text-anchor="end">
      ${downloads}
    </text>
    <svg x="385" y="${yPos - 12}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.download(secondaryTextColor)}
    </svg>

    <!-- Follows -->
    <text x="380" y="${yPos + 18}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${secondaryTextColor}" text-anchor="end">
      ${followers}
    </text>
    <svg x="385" y="${yPos + 6}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.heart(secondaryTextColor)}
    </svg>

    <!-- Project type icon (far right, same size as image) -->
    <svg x="405" y="${yPos - 10}" width="24" height="24" viewBox="0 0 24 24">
      ${projectTypeIcon(textColor)}
    </svg>
  </g>`;
    });

    return `
<svg width="450" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="outer_rectangle_summary">
      <rect width="450" height="${height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#outer_rectangle_summary)">
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="449" height="${height - 1}" vector-effect="non-scaling-stroke"/>

  <!-- Modrinth Icon -->
  <svg x="15" y="15" width="24" height="24" viewBox="0 0 512 514">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M503.16 323.56C514.55 281.47 515.32 235.91 503.2 190.76C466.57 54.2299 326.04 -26.8001 189.33 9.77991C83.8101 38.0199 11.3899 128.07 0.689941 230.47H43.99C54.29 147.33 113.74 74.7298 199.75 51.7098C306.05 23.2598 415.13 80.6699 453.17 181.38L411.03 192.65C391.64 145.8 352.57 111.45 306.3 96.8198L298.56 140.66C335.09 154.13 364.72 184.5 375.56 224.91C391.36 283.8 361.94 344.14 308.56 369.17L320.09 412.16C390.25 383.21 432.4 310.3 422.43 235.14L464.41 223.91C468.91 252.62 467.35 281.16 460.55 308.07L503.16 323.56Z" fill="${accentColor}"/>
    <path d="M321.99 504.22C185.27 540.8 44.7501 459.77 8.11011 323.24C3.84011 307.31 1.17 291.33 0 275.46H43.27C44.36 287.37 46.4699 299.35 49.6799 311.29C53.0399 323.8 57.45 335.75 62.79 347.07L101.38 323.92C98.1299 316.42 95.39 308.6 93.21 300.47C69.17 210.87 122.41 118.77 212.13 94.7601C229.13 90.2101 246.23 88.4401 262.93 89.1501L255.19 133C244.73 133.05 234.11 134.42 223.53 137.25C157.31 154.98 118.01 222.95 135.75 289.09C136.85 293.16 138.13 297.13 139.59 300.99L188.94 271.38L174.07 231.95L220.67 184.08L279.57 171.39L296.62 192.38L269.47 219.88L245.79 227.33L228.87 244.72L237.16 267.79C237.16 267.79 253.95 285.63 253.98 285.64L277.7 279.33L294.58 260.79L331.44 249.12L342.42 273.82L304.39 320.45L240.66 340.63L212.08 308.81L162.26 338.7C187.8 367.78 226.2 383.93 266.01 380.56L277.54 423.55C218.13 431.41 160.1 406.82 124.05 361.64L85.6399 384.68C136.25 451.17 223.84 484.11 309.61 461.16C371.35 444.64 419.4 402.56 445.42 349.38L488.06 364.88C457.17 431.16 398.22 483.82 321.99 504.22Z" fill="${accentColor}"/>
  </svg>

  <!-- Title -->
  <text x="45" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="bold" fill="${textColor}">
    ${username}
  </text>

  <!-- Stats Grid Row 1 -->
  <!-- Total Downloads -->
  <g transform="translate(15, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${totalDownloads}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Total Downloads
    </text>
  </g>

  <!-- Followers -->
  <g transform="translate(155, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${totalFollowers}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Followers
    </text>
  </g>

  <!-- Projects -->
  <g transform="translate(270, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${projectCount}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Projects
    </text>
  </g>

  ${hasProjects ? `<!-- Divider -->
  <line x1="15" y1="110" x2="435" y2="110" stroke="${borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>

  <!-- Top Projects Header -->
  <text x="15" y="130" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" font-weight="600" fill="${secondaryTextColor}">
    Top Projects
  </text>

  ${projectsHtml}` : ''}

  <!-- Bottom right attribution -->
  <text x="445" y="${height - 5}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="8" fill="${secondaryTextColor}" text-anchor="end" opacity="0.6">
    modrinth-readme-stats.creeperkatze.de
  </text>
  </g>
</svg>`.trim();
}

export function generateBadge(label, value, color = '#1bd96a')
{
    const labelWidth = label.length * 7 + 20;
    const valueWidth = value.length * 8 + 20;
    const totalWidth = labelWidth + valueWidth;
    const height = 20;

    const bgColor = 'transparent';
    const labelBgColor = '#8b949e';
    const textColor = '#ffffff';
    const borderColor = '#E4E2E2';

    return `
<svg width="${totalWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="badge_clip">
      <rect width="${totalWidth}" height="${height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#badge_clip)">
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="${totalWidth - 1}" height="${height - 1}" vector-effect="non-scaling-stroke"/>
    <path d="M 5 1H ${labelWidth}V ${height - 1} H 5A 4 4 0 0 1 1 ${height - 5} V 5A 4 4 0 0 1 5 1Z" fill="${labelBgColor}"/>
    <path d="M ${labelWidth - 1} 1 H ${labelWidth + valueWidth - 5} A 4 4 0 0 1 ${labelWidth + valueWidth - 1} 5 V ${height - 5} A 4 4 0 0 1 ${labelWidth + valueWidth - 5} ${height - 1} H ${labelWidth - 1} Z" fill="${color}"/>
  </g>

  <g fill="${textColor}" text-anchor="middle" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" font-weight="500">
    <text x="${labelWidth / 2}" y="14.5">${escapeXml(label)}</text>
    <text x="${labelWidth + (valueWidth / 2)}" y="14.5">${escapeXml(value)}</text>
  </g>
</svg>`.trim();
}
