import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Plugin } from "vite";

const pluginDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(pluginDir, "..");

function joinBase(base: string, assetPath: string): string {
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;

    if (!normalizedBase || normalizedBase === "/") {
        return normalizedPath;
    }

    return `${normalizedBase}${normalizedPath}`;
}

function popoverPath(base: string): string {
    if (!base || base === "/") return "/";
    return base.endsWith("/") ? base : `${base}/`;
}

interface OwlbearManifest {
    icon: string;
    action: {
        icon: string;
        popover: string;
    };
}

export function owlbearManifestPlugin(base: string): Plugin {
    return {
        name: "owlbear-manifest",
        closeBundle() {
            const manifestPath = resolve(projectRoot, "public/manifest.json");
            const distManifestPath = resolve(projectRoot, "dist/manifest.json");
            const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as OwlbearManifest;

            manifest.icon = joinBase(base, manifest.icon);
            manifest.action.icon = joinBase(base, manifest.action.icon);
            manifest.action.popover = popoverPath(base);

            writeFileSync(distManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
        },
    };
}
