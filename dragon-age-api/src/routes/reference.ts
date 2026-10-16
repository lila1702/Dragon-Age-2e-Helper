import { Router } from "express";
import { ZodError } from "zod";

import {
    getItemById,
    getMaterialById,
    getQualityById,
    getRarityById,
    getReferenceCatalog,
    getSpellById,
    listItems,
    listSpells,
} from "../repositories/referenceRepository.js";
import { calculateItemBodySchema } from "../schemas/reference.js";
import { computeItemVariant } from "../services/itemCalculator.js";

export const referenceRouter = Router();

function formatZodError(error: ZodError): string {
    return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}

referenceRouter.get("/", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json({
            version: catalog.version,
            updatedAt: catalog.updatedAt.toISOString(),
            tables: [
                "items",
                "materials",
                "qualities",
                "rarities",
                "spells",
                "attributes",
                "weapon-groups",
                "arcanas",
                "currency-rules",
                "general-stunts",
                "spell-degrees",
                "talent-degrees",
            ],
            endpoints: {
                items: "/reference/items",
                calculateItem: "POST /reference/items/calculate",
                spells: "/reference/spells",
                materials: "/reference/materials",
                qualities: "/reference/qualities",
                rarities: "/reference/rarities",
            },
        });
    } catch (error) {
        console.error("GET /reference failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/items", async (req, res) => {
    try {
        const items = await listItems({
            category: typeof req.query.category === "string" ? req.query.category : undefined,
            weaponGroup: typeof req.query.weaponGroup === "string" ? req.query.weaponGroup : undefined,
            tag: typeof req.query.tag === "string" ? req.query.tag : undefined,
        });
        res.json({ count: items.length, items });
    } catch (error) {
        console.error("GET /reference/items failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

async function resolveItemVariant(
    itemId: string,
    materialId?: string,
    qualityId?: string,
    rarityId?: string
) {
    const catalog = await getReferenceCatalog();
    const item = await getItemById(itemId);
    if (!item) {
        return { error: "item_not_found" as const, itemId };
    }

    const resolvedMaterialId = materialId ?? catalog.defaultModifierIds.materialId;
    const resolvedQualityId = qualityId ?? catalog.defaultModifierIds.qualityId;
    const resolvedRarityId = rarityId ?? catalog.defaultModifierIds.rarityId;

    const material = await getMaterialById(resolvedMaterialId);
    const quality = await getQualityById(resolvedQualityId);
    const rarity = await getRarityById(resolvedRarityId);

    if (!material) return { error: "unknown_material" as const, materialId: resolvedMaterialId };
    if (!quality) return { error: "unknown_quality" as const, qualityId: resolvedQualityId };
    if (!rarity) return { error: "unknown_rarity" as const, rarityId: resolvedRarityId };

    return {
        variant: computeItemVariant({ item, material, quality, rarity }),
    };
}

referenceRouter.post("/items/calculate", async (req, res) => {
    try {
        const parsed = calculateItemBodySchema.parse(req.body);
        const result = await resolveItemVariant(
            parsed.itemId,
            parsed.materialId,
            parsed.qualityId,
            parsed.rarityId
        );

        if ("error" in result) {
            if (result.error === "item_not_found") {
                res.status(404).json({ error: "Item not found.", itemId: result.itemId });
                return;
            }
            if (result.error === "unknown_material") {
                res.status(400).json({ error: "Unknown material.", materialId: result.materialId });
                return;
            }
            if (result.error === "unknown_quality") {
                res.status(400).json({ error: "Unknown quality.", qualityId: result.qualityId });
                return;
            }
            res.status(400).json({ error: "Unknown rarity.", rarityId: result.rarityId });
            return;
        }

        res.json(result.variant);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: formatZodError(error) });
            return;
        }
        console.error("POST /reference/items/calculate failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/items/:id/calculate", async (req, res) => {
    try {
        const result = await resolveItemVariant(
            req.params.id,
            typeof req.query.materialId === "string" ? req.query.materialId : undefined,
            typeof req.query.qualityId === "string" ? req.query.qualityId : undefined,
            typeof req.query.rarityId === "string" ? req.query.rarityId : undefined
        );

        if ("error" in result) {
            if (result.error === "item_not_found") {
                res.status(404).json({ error: "Item not found.", itemId: result.itemId });
                return;
            }
            if (result.error === "unknown_material") {
                res.status(400).json({ error: "Unknown material.", materialId: result.materialId });
                return;
            }
            if (result.error === "unknown_quality") {
                res.status(400).json({ error: "Unknown quality.", qualityId: result.qualityId });
                return;
            }
            res.status(400).json({ error: "Unknown rarity.", rarityId: result.rarityId });
            return;
        }

        res.json(result.variant);
    } catch (error) {
        console.error("GET /reference/items/:id/calculate failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/items/:id", async (req, res) => {
    try {
        const item = await getItemById(req.params.id);
        if (!item) {
            res.status(404).json({ error: "Item not found." });
            return;
        }
        res.json(item);
    } catch (error) {
        console.error("GET /reference/items/:id failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/materials", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json({ count: catalog.materials.length, materials: catalog.materials });
    } catch (error) {
        console.error("GET /reference/materials failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/qualities", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json({ count: catalog.qualities.length, qualities: catalog.qualities });
    } catch (error) {
        console.error("GET /reference/qualities failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/rarities", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json({ count: catalog.rarities.length, rarities: catalog.rarities });
    } catch (error) {
        console.error("GET /reference/rarities failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/spells", async (req, res) => {
    try {
        const spells = await listSpells({
            school: typeof req.query.school === "string" ? req.query.school : undefined,
            arcana: typeof req.query.arcana === "string" ? req.query.arcana : undefined,
            degree: typeof req.query.degree === "string" ? req.query.degree : undefined,
            q: typeof req.query.q === "string" ? req.query.q : undefined,
        });
        res.json({ count: spells.length, spells });
    } catch (error) {
        console.error("GET /reference/spells failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/spells/:id", async (req, res) => {
    try {
        const spell = await getSpellById(req.params.id);
        if (!spell) {
            res.status(404).json({ error: "Spell not found." });
            return;
        }
        res.json(spell);
    } catch (error) {
        console.error("GET /reference/spells/:id failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/attributes", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json({ attributes: catalog.attributes });
    } catch (error) {
        console.error("GET /reference/attributes failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/weapon-groups", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json({ weaponGroups: catalog.weaponGroups });
    } catch (error) {
        console.error("GET /reference/weapon-groups failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/arcanas", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json({
            schools: catalog.arcanaSchools,
            bySchool: catalog.arcanasBySchool,
            extra: catalog.extraArcanas,
        });
    } catch (error) {
        console.error("GET /reference/arcanas failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/currency-rules", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json(catalog.currencyRules);
    } catch (error) {
        console.error("GET /reference/currency-rules failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/general-stunts", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json({ stunts: catalog.generalStunts });
    } catch (error) {
        console.error("GET /reference/general-stunts failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/spell-degrees", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json({
            degrees: catalog.talentDegrees,
            labels: catalog.spellDegreeLabels,
        });
    } catch (error) {
        console.error("GET /reference/spell-degrees failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

referenceRouter.get("/talent-degrees", async (_req, res) => {
    try {
        const catalog = await getReferenceCatalog();
        res.json({ degrees: catalog.talentDegrees });
    } catch (error) {
        console.error("GET /reference/talent-degrees failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});
