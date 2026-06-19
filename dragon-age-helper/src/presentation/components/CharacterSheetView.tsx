import { useState } from "react";

import { AttributeStripRow } from "./AttributeStripRow";
import { HabilidadesPanel } from "./HabilidadesPanel";
import { InventarioPanel } from "./InventarioPanel";
import { MagiaPanel } from "./MagiaPanel";
import { SheetHeaderForm } from "./SheetHeaderForm";
import { SheetTabs } from "./SheetTabs";
import { TalentosPanel } from "./TalentosPanel";
import { TokenSelectionBar } from "./TokenSelectionBar";
import type { SheetTabId } from "./SheetTabs";

import type { CharacterSheet, Attribute, CombatStats } from "../../domain/entities/characterSheet";
import type { ClassAbility, MeleeAttack, RangedAttack } from "../../domain/entities/habilidades";
import type { Spell, SpellDegree } from "../../domain/entities/magias";
import type { Talent } from "../../domain/entities/talentos";
import type { Currency, InventoryItem } from "../../domain/entities/inventario";
import type { ArcanaSpecialization } from "../../domain/entities/especializacoesArcanas";
import type { AttackRollOptions } from "../../domain/entities/attackRoll";
import type { AttributeRollOptions } from "../../domain/entities/attributeRoll";

import "../styles/sheet.css";

export interface CharacterSheetViewProps {
    sheet: CharacterSheet;
    isObrAvailable: boolean;
    isObrReady: boolean;
    tokenName: string | null;
    selectionError: string | null;
    isLoadingSheet: boolean;
    needsCreateSheet: boolean;
    canCreateSheet: boolean;
    canEditSheet: boolean;
    canRoll: boolean;
    isGM?: boolean;
    isReadOnlySheet: boolean;
    isCreatingSheet: boolean;
    onCreateSheet: () => void;
    onRollAttribute: (attribute: Attribute, options?: AttributeRollOptions) => void;
    onNameChange: (value: string) => void;
    onHistoricoChange: (value: string) => void;
    onClassNameChange: (value: string) => void;
    onLevelChange: (value: number) => void;
    onIdadeChange: (value: string) => void;
    onSexoChange: (value: string) => void;
    onCombatStatChange: (stat: keyof CombatStats, value: number) => void;
    onHpCurrentChange: (value: number) => void;
    onHpMaxChange: (value: number) => void;
    onMpCurrentChange: (value: number) => void;
    onMpMaxChange: (value: number) => void;
    onResourceEditingChange?: (isEditing: boolean) => void;
    onAddFocus: (abbreviation: string, focusName: string) => void;
    onRemoveFocus: (abbreviation: string, focusName: string) => void;
    onRenameFocus: (abbreviation: string, oldName: string, newName: string) => void;
    onReorderFocus: (abbreviation: string, fromIndex: number, toIndex: number) => void;
    onFocusBonusChange: (abbreviation: string, bonus: number) => void;
    onAttributeValueChange: (abbreviation: string, value: number) => void;
    onPrimaryChange: (abbreviation: string, isPrimary: boolean) => void;
    onAddMeleeAttack: () => void;
    onUpdateMeleeAttack: (id: string, patch: Partial<MeleeAttack>) => void;
    onRemoveMeleeAttack: (id: string) => void;
    onReorderMeleeAttack: (fromIndex: number, toIndex: number) => void;
    onAddRangedAttack: () => void;
    onUpdateRangedAttack: (id: string, patch: Partial<RangedAttack>) => void;
    onRemoveRangedAttack: (id: string) => void;
    onReorderRangedAttack: (fromIndex: number, toIndex: number) => void;
    onWeaponGroupsChange: (value: string) => void;
    onLutUsesWillpowerForDamageChange: (enabled: boolean) => void;
    onArcaneWarriorOptionEnabledChange: (enabled: boolean) => void;
    onRollAttack: (
        attackId: string,
        attackKind: "melee" | "ranged",
        options?: AttackRollOptions
    ) => void;
    onRollDamage: (
        attackId: string,
        attackKind: "melee" | "ranged",
        options?: AttackRollOptions
    ) => void;
    onAddClassAbility: () => void;
    onUpdateClassAbility: (id: string, patch: Partial<ClassAbility>) => void;
    onRemoveClassAbility: (id: string) => void;
    onAddTalent: () => void;
    onUpdateTalent: (id: string, patch: Partial<Talent>) => void;
    onRemoveTalent: (id: string) => void;
    onAddArcanaSpecialization: () => void;
    onUpdateArcanaSpecialization: (id: string, patch: Partial<ArcanaSpecialization>) => void;
    onRemoveArcanaSpecialization: (id: string) => void;
    onAddSpell: (degree: SpellDegree) => void;
    onUpdateSpell: (id: string, patch: Partial<Spell>) => void;
    onRemoveSpell: (id: string) => void;
    onAddInventoryItem: () => void;
    onUpdateInventoryItem: (id: string, patch: Partial<InventoryItem>) => void;
    onRemoveInventoryItem: (id: string) => void;
    onUpdateCurrency: (patch: Partial<Currency>) => void;
}

export function CharacterSheetView({
    sheet,
    isObrAvailable,
    tokenName,
    selectionError,
    isLoadingSheet,
    needsCreateSheet,
    canCreateSheet,
    canEditSheet,
    canRoll,
    isGM = false,
    isReadOnlySheet,
    isCreatingSheet,
    onCreateSheet,
    onRollAttribute,
    onNameChange,
    onHistoricoChange,
    onClassNameChange,
    onLevelChange,
    onIdadeChange,
    onSexoChange,
    onCombatStatChange,
    onHpCurrentChange,
    onHpMaxChange,
    onMpCurrentChange,
    onMpMaxChange,
    onResourceEditingChange,
    onAddFocus,
    onRemoveFocus,
    onRenameFocus,
    onReorderFocus,
    onFocusBonusChange,
    onAttributeValueChange,
    onPrimaryChange,
    onAddMeleeAttack,
    onUpdateMeleeAttack,
    onRemoveMeleeAttack,
    onReorderMeleeAttack,
    onAddRangedAttack,
    onUpdateRangedAttack,
    onRemoveRangedAttack,
    onReorderRangedAttack,
    onWeaponGroupsChange,
    onLutUsesWillpowerForDamageChange,
    onArcaneWarriorOptionEnabledChange,
    onRollAttack,
    onRollDamage,
    onAddClassAbility,
    onUpdateClassAbility,
    onRemoveClassAbility,
    onAddTalent,
    onUpdateTalent,
    onRemoveTalent,
    onAddArcanaSpecialization,
    onUpdateArcanaSpecialization,
    onRemoveArcanaSpecialization,
    onAddSpell,
    onUpdateSpell,
    onRemoveSpell,
    onAddInventoryItem,
    onUpdateInventoryItem,
    onRemoveInventoryItem,
    onUpdateCurrency,
}: CharacterSheetViewProps) {
    const [activeTab, setActiveTab] = useState<SheetTabId>("atributos");

    const rollsDisabled = !canRoll;
    const formDisabled = !canEditSheet;

    return (
        <div className="character-sheet">
            <div className="character-sheet__card">
                <TokenSelectionBar
                    isObrAvailable={isObrAvailable}
                    isLoading={isLoadingSheet}
                    tokenName={tokenName}
                    selectionError={selectionError}
                    needsCreateSheet={needsCreateSheet}
                    canCreateSheet={canCreateSheet}
                    isReadOnlySheet={isReadOnlySheet}
                    isCreating={isCreatingSheet}
                    onCreateSheet={onCreateSheet}
                />

                <SheetHeaderForm
                    sheet={sheet}
                    disabled={formDisabled}
                    onNameChange={onNameChange}
                    onHistoricoChange={onHistoricoChange}
                    onClassNameChange={onClassNameChange}
                    onLevelChange={onLevelChange}
                    onIdadeChange={onIdadeChange}
                    onSexoChange={onSexoChange}
                    onCombatStatChange={onCombatStatChange}
                    onHpCurrentChange={onHpCurrentChange}
                    onHpMaxChange={onHpMaxChange}
                    onMpCurrentChange={onMpCurrentChange}
                    onMpMaxChange={onMpMaxChange}
                    onResourceEditingChange={onResourceEditingChange}
                />

                <SheetTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    showMagicTab={sheet.mpMax > 0}
                />

                <div className="character-sheet__panel" role="tabpanel">
                    {activeTab === "atributos" && (
                        <div className="character-sheet__attributes" aria-label="Atributos">
                            {sheet.attributes.map((attribute) => (
                                <AttributeStripRow
                                    key={attribute.abbreviation}
                                    attribute={attribute}
                                    onRoll={onRollAttribute}
                                    onAddFocus={onAddFocus}
                                    onRemoveFocus={onRemoveFocus}
                                    onRenameFocus={onRenameFocus}
                                    onReorderFocus={onReorderFocus}
                                    onFocusBonusChange={onFocusBonusChange}
                                    onAttributeValueChange={onAttributeValueChange}
                                    onPrimaryChange={onPrimaryChange}
                                    disabled={rollsDisabled}
                                />
                            ))}
                        </div>
                    )}

                    {activeTab === "habilidades" && (
                        <HabilidadesPanel
                            habilidades={sheet.habilidades}
                            attributes={sheet.attributes}
                            isGM={isGM}
                            disabled={formDisabled}
                            canRoll={canRoll}
                            onAddMeleeAttack={onAddMeleeAttack}
                            onUpdateMeleeAttack={onUpdateMeleeAttack}
                            onRemoveMeleeAttack={onRemoveMeleeAttack}
                            onReorderMeleeAttack={onReorderMeleeAttack}
                            onAddRangedAttack={onAddRangedAttack}
                            onUpdateRangedAttack={onUpdateRangedAttack}
                            onRemoveRangedAttack={onRemoveRangedAttack}
                            onReorderRangedAttack={onReorderRangedAttack}
                            onWeaponGroupsChange={onWeaponGroupsChange}
                            onLutUsesWillpowerForDamageChange={onLutUsesWillpowerForDamageChange}
                            onArcaneWarriorOptionEnabledChange={onArcaneWarriorOptionEnabledChange}
                            onRollAttack={onRollAttack}
                            onRollDamage={onRollDamage}
                            onAddClassAbility={onAddClassAbility}
                            onUpdateClassAbility={onUpdateClassAbility}
                            onRemoveClassAbility={onRemoveClassAbility}
                        />
                    )}
                    {activeTab === "talentos" && (
                        <TalentosPanel
                            talents={sheet.talents}
                            specializations={sheet.arcanaSpecializations}
                            disabled={formDisabled}
                            onAddTalent={onAddTalent}
                            onUpdateTalent={onUpdateTalent}
                            onRemoveTalent={onRemoveTalent}
                            onAddSpecialization={onAddArcanaSpecialization}
                            onUpdateSpecialization={onUpdateArcanaSpecialization}
                            onRemoveSpecialization={onRemoveArcanaSpecialization}
                        />
                    )}
                    {activeTab === "magia" && (
                        <MagiaPanel
                            spells={sheet.spells}
                            attributes={sheet.attributes}
                            disabled={formDisabled}
                            onAddSpell={onAddSpell}
                            onUpdateSpell={onUpdateSpell}
                            onRemoveSpell={onRemoveSpell}
                        />
                    )}
                    {activeTab === "inventario" && (
                        <InventarioPanel
                            items={sheet.inventory.items}
                            currency={sheet.inventory.currency}
                            disabled={formDisabled}
                            onAddItem={onAddInventoryItem}
                            onUpdateItem={onUpdateInventoryItem}
                            onRemoveItem={onRemoveInventoryItem}
                            onUpdateCurrency={onUpdateCurrency}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
