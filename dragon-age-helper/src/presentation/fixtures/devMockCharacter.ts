import type { CharacterSheet } from "../../domain/entities/characterSheet";

export const DEV_MOCK_CHARACTER: CharacterSheet = {
    id: "sheet_dev_mock",
    tokenId: undefined,
    name: "Loghain Mac Tir",
    historico: "Soldado de Ferelden",
    className: "Guerreiro",
    level: 5,
    idade: "42",
    sexo: "Masculino",
    combatStats: {
        speed: 12,
        defense: 14,
        armor: 6,
        armorPenalty: 2,
    },
    hpCurrent: 45,
    hpMax: 45,
    mpCurrent: 10,
    mpMax: 10,
    attributes: [
        { name: "Astúcia", abbreviation: "AST", value: 1, focusNames: [] },
        { name: "Comunicação", abbreviation: "COM", value: 2, focusNames: [] },
        {
            name: "Constituição",
            abbreviation: "CON",
            value: 3,
            focusNames: ["Vigor"],
        },
        { name: "Destreza", abbreviation: "DES", value: 3, focusNames: [] },
        {
            name: "Força",
            abbreviation: "FOR",
            value: 4,
            isPrimary: true,
            focusNames: ["Espadas"],
        },
        { name: "Luta", abbreviation: "LUT", value: 3, isPrimary: true, focusNames: ["Espadas"] },
        {
            name: "Percepção",
            abbreviation: "PER",
            value: 1,
            focusNames: ["Audição"],
        },
        {
            name: "Precisão",
            abbreviation: "PRE",
            value: 1,
            focusNames: ["Arcos"],
        },
        { name: "Vontade", abbreviation: "VON", value: 2, focusNames: [] },
    ],
    habilidades: {
        meleeAttacks: [
            {
                id: "melee_dev_sword",
                name: "Espada Longa",
                attributeAbbreviation: "LUT",
                weaponGroup: "Espadas",
                damage: "2d6",
            },
            {
                id: "melee_dev_staff",
                name: "Lança Arcana",
                attributeAbbreviation: "PRE",
                damageAttributeAbbreviation: "VON",
                weaponGroup: "Cajados",
                damage: "1d6",
            },
        ],
        rangedAttacks: [],
        weaponGroups: "Espadas; Escudos; Cajados",
        classAbilities: [
            {
                id: "class_dev_shield",
                name: "Escudo",
                description: "Bônus de defesa +2 quando equipado.",
            },
        ],
    },
};
