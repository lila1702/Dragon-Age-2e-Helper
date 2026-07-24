import type { CharacterSheetPayload } from "../schemas/characterSheet.js";

export type TalentDegree = "Novato" | "Experiente" | "Mestre";

export interface CharacterMainRow {
    id: string;
    token_id: string | null;
    name: string;
    historico: string;
    class_name: string;
    level: number;
    idade: string;
    sexo: string;
    speed: number;
    defense: number;
    armor: number;
    armor_penalty: number;
    hp_current: number;
    hp_max: number;
    mp_current: number;
    mp_max: number;
    weapon_groups: string;
    lut_uses_willpower: number;
    arcane_warrior_option: number;
    currency_copper: number;
    currency_silver: number;
    currency_gold: number;
    created_at: Date;
    updated_at: Date;
}

export interface AttributeRow {
    abbreviation: string;
    name: string;
    value: number;
    is_primary: number;
    focus_bonus: number;
    active_focus_name: string | null;
    sort_order: number;
}

export interface FocusRow {
    attribute_abbreviation: string;
    focus_name: string;
    sort_order: number;
}

export interface MeleeAttackRow {
    id: string;
    name: string;
    attribute_abbreviation: string;
    damage_attribute_abbreviation: string | null;
    weapon_group: string | null;
    damage: string;
    sort_order: number;
}

export interface RangedAttackRow {
    id: string;
    name: string;
    attribute_abbreviation: string;
    damage_attribute_abbreviation: string | null;
    weapon_group: string | null;
    damage: string;
    short_range: string | null;
    long_range: string | null;
    reload: string | null;
    sort_order: number;
}

export interface ClassAbilityRow {
    id: string;
    name: string;
    description: string;
    sort_order: number;
}

export interface TalentRow {
    id: string;
    name: string;
    benefit_novato: string;
    benefit_experiente: string;
    benefit_mestre: string;
    sort_order: number;
}

export interface ArcanaSpecializationRow {
    id: string;
    name: string;
    benefit_novato: string;
    benefit_experiente: string;
    benefit_mestre: string;
    sort_order: number;
}

export interface SpellRow {
    id: string;
    degree: TalentDegree;
    name: string;
    school: string;
    arcana: string;
    cost: number;
    spell_time: string;
    tn: number;
    spell_test: string;
    description: string;
    sort_order: number;
}

export interface InventoryItemRow {
    id: string;
    name: string;
    sale_value: string;
    description: string;
    quantity: number | null;
    sort_order: number;
}

export interface CharacterChildren {
    attributes: AttributeRow[];
    focuses: FocusRow[];
    meleeAttacks: MeleeAttackRow[];
    rangedAttacks: RangedAttackRow[];
    classAbilities: ClassAbilityRow[];
    talents: TalentRow[];
    arcanaSpecializations: ArcanaSpecializationRow[];
    spells: SpellRow[];
    inventoryItems: InventoryItemRow[];
}

export interface DisassembledCharacter {
    main: Omit<CharacterMainRow, "created_at" | "updated_at">;
    children: CharacterChildren;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolInt(value: unknown): number {
    return value ? 1 : 0;
}

function parseHabilidades(raw: unknown) {
    if (!isRecord(raw)) {
        return {
            meleeAttacks: [] as Record<string, unknown>[],
            rangedAttacks: [] as Record<string, unknown>[],
            weaponGroups: "",
            lutUsesWillpowerForDamage: false,
            arcaneWarriorOptionEnabled: false,
            classAbilities: [] as Record<string, unknown>[],
        };
    }

    return {
        meleeAttacks: Array.isArray(raw.meleeAttacks)
            ? (raw.meleeAttacks as Record<string, unknown>[])
            : [],
        rangedAttacks: Array.isArray(raw.rangedAttacks)
            ? (raw.rangedAttacks as Record<string, unknown>[])
            : [],
        weaponGroups: asString(raw.weaponGroups),
        lutUsesWillpowerForDamage: Boolean(raw.lutUsesWillpowerForDamage),
        arcaneWarriorOptionEnabled: Boolean(raw.arcaneWarriorOptionEnabled),
        classAbilities: Array.isArray(raw.classAbilities)
            ? (raw.classAbilities as Record<string, unknown>[])
            : [],
    };
}

function parseBenefits(raw: unknown): Record<TalentDegree, string> {
    const benefits = isRecord(raw) ? raw : {};
    return {
        Novato: asString(benefits.Novato),
        Experiente: asString(benefits.Experiente),
        Mestre: asString(benefits.Mestre),
    };
}

function parseDegree(raw: unknown): TalentDegree {
    const value = asString(raw, "Novato");
    if (value === "Experiente" || value === "Mestre") return value;
    return "Novato";
}

export function disassembleCharacterSheet(sheet: CharacterSheetPayload): DisassembledCharacter {
    const combat: Record<string, unknown> = isRecord(sheet.combatStats) ? sheet.combatStats : {};
    const habilidades = parseHabilidades(sheet.habilidades);
    const inventory: Record<string, unknown> = isRecord(sheet.inventory) ? sheet.inventory : {};
    const currency: Record<string, unknown> = isRecord(inventory.currency) ? inventory.currency : {};
    const items = Array.isArray(inventory.items) ? inventory.items : [];

    const attributes = (sheet.attributes ?? []).map((attr, index) => {
        const record: Record<string, unknown> = isRecord(attr) ? attr : {};
        return {
            abbreviation: asString(record.abbreviation),
            name: asString(record.name),
            value: asNumber(record.value),
            is_primary: asBoolInt(record.isPrimary),
            focus_bonus: asNumber(record.focusBonus),
            active_focus_name: asString(record.activeFocusName) || null,
            sort_order: index,
        };
    });

    const focuses: FocusRow[] = [];
    for (const attr of sheet.attributes ?? []) {
        const record: Record<string, unknown> = isRecord(attr) ? attr : {};
        const abbreviation = asString(record.abbreviation);
        const focusNames = Array.isArray(record.focusNames)
            ? record.focusNames.filter((name): name is string => typeof name === "string")
            : [];

        focusNames.forEach((focusName, index) => {
            focuses.push({
                attribute_abbreviation: abbreviation,
                focus_name: focusName,
                sort_order: index,
            });
        });
    }

    return {
        main: {
            id: sheet.id,
            token_id: sheet.tokenId ?? null,
            name: sheet.name,
            historico: sheet.historico ?? "",
            class_name: sheet.className,
            level: sheet.level,
            idade: sheet.idade ?? "",
            sexo: sheet.sexo ?? "",
            speed: asNumber(combat.speed, 10),
            defense: asNumber(combat.defense, 10),
            armor: asNumber(combat.armor, 0),
            armor_penalty: asNumber(combat.armorPenalty, 0),
            hp_current: sheet.hpCurrent,
            hp_max: sheet.hpMax,
            mp_current: sheet.mpCurrent,
            mp_max: sheet.mpMax,
            weapon_groups: habilidades.weaponGroups,
            lut_uses_willpower: asBoolInt(habilidades.lutUsesWillpowerForDamage),
            arcane_warrior_option: asBoolInt(habilidades.arcaneWarriorOptionEnabled),
            currency_copper: asNumber(currency.copper),
            currency_silver: asNumber(currency.silver),
            currency_gold: asNumber(currency.gold),
        },
        children: {
            attributes,
            focuses,
            meleeAttacks: habilidades.meleeAttacks.map((attack, index) => ({
                id: asString(attack.id) || crypto.randomUUID(),
                name: asString(attack.name),
                attribute_abbreviation: asString(attack.attributeAbbreviation),
                damage_attribute_abbreviation:
                    asString(attack.damageAttributeAbbreviation) || null,
                weapon_group: asString(attack.weaponGroup) || null,
                damage: asString(attack.damage),
                sort_order: index,
            })),
            rangedAttacks: habilidades.rangedAttacks.map((attack, index) => ({
                id: asString(attack.id) || crypto.randomUUID(),
                name: asString(attack.name),
                attribute_abbreviation: asString(attack.attributeAbbreviation),
                damage_attribute_abbreviation:
                    asString(attack.damageAttributeAbbreviation) || null,
                weapon_group: asString(attack.weaponGroup) || null,
                damage: asString(attack.damage),
                short_range: asString(attack.shortRange) || null,
                long_range: asString(attack.longRange) || null,
                reload: asString(attack.reload) || null,
                sort_order: index,
            })),
            classAbilities: habilidades.classAbilities.map((ability, index) => ({
                id: asString(ability.id) || crypto.randomUUID(),
                name: asString(ability.name),
                description: asString(ability.description),
                sort_order: index,
            })),
            talents: (Array.isArray(sheet.talents) ? sheet.talents : []).map((talent, index) => {
                const record = isRecord(talent) ? talent : {};
                const benefits = parseBenefits(record.benefits);
                return {
                    id: asString(record.id) || crypto.randomUUID(),
                    name: asString(record.name),
                    benefit_novato: benefits.Novato,
                    benefit_experiente: benefits.Experiente,
                    benefit_mestre: benefits.Mestre,
                    sort_order: index,
                };
            }),
            arcanaSpecializations: (
                Array.isArray(sheet.arcanaSpecializations) ? sheet.arcanaSpecializations : []
            ).map((spec, index) => {
                const record = isRecord(spec) ? spec : {};
                const benefits = parseBenefits(record.benefits);
                return {
                    id: asString(record.id) || crypto.randomUUID(),
                    name: asString(record.name),
                    benefit_novato: benefits.Novato,
                    benefit_experiente: benefits.Experiente,
                    benefit_mestre: benefits.Mestre,
                    sort_order: index,
                };
            }),
            spells: (Array.isArray(sheet.spells) ? sheet.spells : []).map((spell, index) => {
                const record = isRecord(spell) ? spell : {};
                return {
                    id: asString(record.id) || crypto.randomUUID(),
                    degree: parseDegree(record.degree),
                    name: asString(record.name),
                    school: asString(record.school),
                    arcana: asString(record.arcana),
                    cost: asNumber(record.cost),
                    spell_time: asString(record.time),
                    tn: asNumber(record.tn, 10),
                    spell_test: asString(record.test),
                    description: asString(record.description),
                    sort_order: index,
                };
            }),
            inventoryItems: items.map((item: unknown, index: number) => {
                const record: Record<string, unknown> = isRecord(item) ? item : {};
                const quantity = record.quantity;
                return {
                    id: asString(record.id) || crypto.randomUUID(),
                    name: asString(record.name),
                    sale_value: asString(record.saleValue),
                    description: asString(record.description),
                    quantity:
                        quantity === null || quantity === undefined
                            ? null
                            : asNumber(quantity),
                    sort_order: index,
                };
            }),
        },
    };
}

export function assembleCharacterSheet(
    main: CharacterMainRow,
    children: CharacterChildren
): CharacterSheetPayload {
    const focusesByAbbreviation = new Map<string, string[]>();
    for (const focus of [...children.focuses].sort((a, b) => a.sort_order - b.sort_order)) {
        const list = focusesByAbbreviation.get(focus.attribute_abbreviation) ?? [];
        list.push(focus.focus_name);
        focusesByAbbreviation.set(focus.attribute_abbreviation, list);
    }

    const attributes = [...children.attributes]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((attr) => ({
            name: attr.name,
            abbreviation: attr.abbreviation,
            value: attr.value,
            ...(attr.is_primary ? { isPrimary: true } : {}),
            ...(attr.focus_bonus ? { focusBonus: attr.focus_bonus } : {}),
            ...(attr.active_focus_name ? { activeFocusName: attr.active_focus_name } : {}),
            focusNames: focusesByAbbreviation.get(attr.abbreviation) ?? [],
        }));

    const habilidades = {
        meleeAttacks: [...children.meleeAttacks]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((attack) => ({
                id: attack.id,
                name: attack.name,
                attributeAbbreviation: attack.attribute_abbreviation,
                ...(attack.damage_attribute_abbreviation
                    ? { damageAttributeAbbreviation: attack.damage_attribute_abbreviation }
                    : {}),
                ...(attack.weapon_group ? { weaponGroup: attack.weapon_group } : {}),
                damage: attack.damage,
            })),
        rangedAttacks: [...children.rangedAttacks]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((attack) => ({
                id: attack.id,
                name: attack.name,
                attributeAbbreviation: attack.attribute_abbreviation,
                ...(attack.damage_attribute_abbreviation
                    ? { damageAttributeAbbreviation: attack.damage_attribute_abbreviation }
                    : {}),
                ...(attack.weapon_group ? { weaponGroup: attack.weapon_group } : {}),
                damage: attack.damage,
                ...(attack.short_range ? { shortRange: attack.short_range } : {}),
                ...(attack.long_range ? { longRange: attack.long_range } : {}),
                ...(attack.reload ? { reload: attack.reload } : {}),
            })),
        weaponGroups: main.weapon_groups ?? "",
        ...(main.lut_uses_willpower ? { lutUsesWillpowerForDamage: true } : {}),
        ...(main.arcane_warrior_option ? { arcaneWarriorOptionEnabled: true } : {}),
        classAbilities: [...children.classAbilities]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((ability) => ({
                id: ability.id,
                name: ability.name,
                description: ability.description,
            })),
    };

    return {
        id: main.id,
        ...(main.token_id ? { tokenId: main.token_id } : {}),
        name: main.name,
        historico: main.historico ?? "",
        className: main.class_name,
        level: main.level,
        idade: main.idade,
        sexo: main.sexo,
        combatStats: {
            speed: main.speed,
            defense: main.defense,
            armor: main.armor,
            armorPenalty: main.armor_penalty,
        },
        hpCurrent: main.hp_current,
        hpMax: main.hp_max,
        mpCurrent: main.mp_current,
        mpMax: main.mp_max,
        attributes,
        habilidades,
        talents: [...children.talents]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((talent) => ({
                id: talent.id,
                name: talent.name,
                benefits: {
                    Novato: talent.benefit_novato,
                    Experiente: talent.benefit_experiente,
                    Mestre: talent.benefit_mestre,
                },
            })),
        arcanaSpecializations: [...children.arcanaSpecializations]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((spec) => ({
                id: spec.id,
                name: spec.name,
                benefits: {
                    Novato: spec.benefit_novato,
                    Experiente: spec.benefit_experiente,
                    Mestre: spec.benefit_mestre,
                },
            })),
        spells: [...children.spells]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((spell) => ({
                id: spell.id,
                degree: spell.degree,
                name: spell.name,
                school: spell.school,
                arcana: spell.arcana,
                cost: spell.cost,
                time: spell.spell_time,
                tn: spell.tn,
                test: spell.spell_test,
                description: spell.description,
            })),
        inventory: {
            items: [...children.inventoryItems]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item) => ({
                    id: item.id,
                    name: item.name,
                    saleValue: item.sale_value,
                    description: item.description,
                    quantity: item.quantity,
                })),
            currency: {
                copper: main.currency_copper,
                silver: main.currency_silver,
                gold: main.currency_gold,
            },
        },
    };
}
