import type { Attribute } from "./characterSheet";

export const ATTRIBUTE_DEFINITIONS: ReadonlyArray<Pick<Attribute, "name" | "abbreviation">> = [
    { name: "Astúcia", abbreviation: "AST" },
    { name: "Comunicação", abbreviation: "COM" },
    { name: "Constituição", abbreviation: "CON" },
    { name: "Destreza", abbreviation: "DES" },
    { name: "Força", abbreviation: "FOR" },
    { name: "Luta", abbreviation: "LUT" },
    { name: "Percepção", abbreviation: "PER" },
    { name: "Precisão", abbreviation: "PRE" },
    { name: "Vontade", abbreviation: "VON" },
] as const;

export const ATTRIBUTE_COUNT = ATTRIBUTE_DEFINITIONS.length;
