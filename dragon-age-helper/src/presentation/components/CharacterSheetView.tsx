import { useState } from "react";

import { AttributeStripRow } from "./AttributeStripRow";
import { SheetHeaderForm } from "./SheetHeaderForm";
import { SheetTabs } from "./SheetTabs";
import { TokenSelectionBar } from "./TokenSelectionBar";
import type { SheetTabId } from "./SheetTabs";

import type { CharacterSheet, Attribute, CombatStats } from "../../domain/entities/characterSheet";
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
}

function PlaceholderTab({ label }: { label: string }) {
    return (
        <div className="sheet-placeholder">
            <p>
                Aba <strong>{label}</strong> — em breve.
            </p>
        </div>
    );
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

                    {activeTab === "habilidades" && <PlaceholderTab label="habilidades" />}
                    {activeTab === "talentos" && <PlaceholderTab label="talentos" />}
                    {activeTab === "magia" && <PlaceholderTab label="magia" />}
                </div>
            </div>
        </div>
    );
}
