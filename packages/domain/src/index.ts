export type { Attribute, CombatStats, CharacterSheet } from "./entities/characterSheet";

export {
    ATTRIBUTE_DEFINITIONS,
    ATTRIBUTE_COUNT,
} from "./entities/attributeDefinitions";

export {
    ARCANA_SCHOOLS,
    ARCANAS_BY_SCHOOL,
    isArcanaSchool,
    getArcanasForSchool,
    resolveSchoolForArcana,
} from "./entities/arcanaDefinitions";
export type { ArcanaSchool } from "./entities/arcanaDefinitions";

export {
    WEAPON_GROUP_SUGGESTIONS,
} from "./entities/weaponGroupDefinitions";

export {
    TALENT_DEGREES,
    createEmptyTalentBenefits,
    createTalentId,
    createEmptyTalent,
    isTalentDegree,
    hasAnyTalentContent,
} from "./entities/talentos";
export type { TalentDegree, TalentBenefits, Talent } from "./entities/talentos";

export {
    SPECIALIZATION_DEGREES,
    createArcanaSpecializationId,
    createEmptyArcanaSpecialization,
} from "./entities/especializacoesArcanas";
export type {
    SpecializationDegree,
    SpecializationBenefits,
    ArcanaSpecialization,
} from "./entities/especializacoesArcanas";

export {
    SPELL_DEGREES,
    SPELL_DEGREE_LABELS,
    createSpellId,
    createEmptySpell,
    isSpellDegree,
    computeSpellpower,
} from "./entities/magias";
export type { Spell, SpellDegree } from "./entities/magias";

export {
    createHabilidadeId,
    createEmptyHabilidades,
    createEmptyMeleeAttack,
    createEmptyRangedAttack,
    createEmptyClassAbility,
} from "./entities/habilidades";
export type {
    MeleeAttack,
    RangedAttack,
    ClassAbility,
    Habilidades,
} from "./entities/habilidades";

export {
    createInventoryItemId,
    createEmptyCurrency,
    createEmptyInventoryItem,
    createEmptyInventory,
    normalizeCurrency,
} from "./entities/inventario";
export type { InventoryItem, Currency, Inventory } from "./entities/inventario";

export {
    createSheetId,
    createEmptySheet,
} from "./entities/createEmptySheet";

export { normalizeCharacterSheet } from "./entities/normalizeCharacterSheet";

export { calculateDicePlusStunt } from "./entities/diceRules";
export type { RollModifiers, StuntRollResult } from "./entities/diceRules";

export {
    DEFAULT_FOCUS_BONUS,
    MAX_FOCUS_BONUS,
    FOCUS_IMPROVEMENT_LEVEL,
    resolveFocusBonus,
    canImproveFocusBonus,
    canReduceFocusBonus,
    nextFocusBonus,
    previousFocusBonus,
    parseSituationalModifiers,
    getAttributeRollBreakdown,
    buildAttributeTestDiceNotation,
} from "./entities/attributeRoll";
export type { AttributeRollOptions } from "./entities/attributeRoll";

export {
    computeAttackBonus,
    computeDamageWithAttribute,
    isAttackUntrained,
    parseWeaponGroups,
    getAttributeValue,
    hasWeaponFocus,
    formatAttackBonus,
    formatEffectiveDamage,
    resolveDamageAttributeAbbreviation,
    isWeaponGroupTrained,
} from "./entities/attackBonus";

export {
    buildAttackRollModifiers,
    buildAttackTestDiceNotation,
    buildDamageRollNotation,
    buildDamageRollNotationForDicePlus,
    computeDamageRawTotal,
    halveDamageTotal,
    parseHalvedDiceNotation,
} from "./entities/attackRoll";
export type { AttackRollOptions, DamageRollResult } from "./entities/attackRoll";

export { RELOAD_ACTION_OPTIONS } from "./entities/weaponReload";

export {
    sanitizeRelativeNumericInput,
    parseNumericExpression,
} from "./entities/numericExpression";

export type {
    SheetPatch,
    SheetSnapshot,
    FieldPresence,
    CampaignEvent,
} from "./realtime/sheetPatch";
export {
    applySheetPatch,
    createOpId,
    LONG_TEXT_PATHS,
    isLongTextPath,
} from "./realtime/sheetPatch";

export type {
    RolledDie,
    RollRequest,
    DiceRoller,
} from "./ports/diceRoller";
export type { Ruleset } from "./ports/ruleset";
export type {
    TabletopPlayer,
    ResourcePair,
    TabletopBridge,
} from "./ports/tabletopBridge";
export type {
    InitiativeEntry,
    InitiativeBoard,
} from "./ports/initiativeBoard";

export { LocalRoller } from "./ports/localRoller";
export { NoTabletop } from "./ports/noTabletop";
export { ApiInitiativeBoard } from "./ports/apiInitiativeBoard";
export type { InitiativeApi } from "./ports/apiInitiativeBoard";

export { AgeRuleset, AGE_RULESET_ID } from "./rulesets/ageRuleset";
export type { RulesetCatalog, CatalogAttribute, CatalogSchool, CatalogArcana } from "./catalog/types";
export { DEFAULT_RULESET_CATALOG, DEFAULT_RULESET_ID } from "./catalog/defaultCatalog";
export type { CatalogEntry, CatalogEntryKind } from "./catalog/catalogEntries";
export {
    CATALOG_ENTRY_KINDS,
    CATALOG_ENTRY_KIND_LABELS,
    isCatalogEntryKind,
    applyCatalogEntryToSheet,
    catalogEntryToInventoryItem,
    catalogEntryToSpell,
    catalogEntryToTalent,
    catalogEntryToClassAbility,
    catalogEntryToSpecialization,
    defaultCatalogBody,
    parseTagList,
} from "./catalog/catalogEntries";
export { registerDiceRoller, getDiceRoller, getRuleset } from "./registry";

export { parseOwlbearRoomId } from "./owlbear/roomId";
