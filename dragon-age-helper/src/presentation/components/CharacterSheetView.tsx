import { useState } from "react";

import { AttributeStripRow } from "./AttributeStripRow";
import { RollResultBanner } from "./RollResultBanner";
import { SheetHeaderForm } from "./SheetHeaderForm";
import { SheetTabs } from "./SheetTabs";
import type { SheetTabId } from "./SheetTabs";

import type { CharacterSheet, Attribute, CombatStats } from "../../domain/entities/characterSheet";
import type { StuntRollResult } from "../../domain/entities/diceRules";

import "../styles/sheet.css";

export interface CharacterSheetViewProps {
    sheet: CharacterSheet;
    isObrReady: boolean;
    lastRollResult: StuntRollResult | null;
    rollError: string | null;
    onRollAttribute: (attribute: Attribute, focusName?: string) => void;
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
    onAddFocus: (abbreviation: string, focusName: string) => void;
    onRemoveFocus: (abbreviation: string, focusName: string) => void;
    onRenameFocus: (abbreviation: string, oldName: string, newName: string) => void;
    onReorderFocus: (abbreviation: string, fromIndex: number, toIndex: number) => void;
    onFocusBonusChange: (abbreviation: string, bonus: number) => void;
    onAttributeValueChange: (abbreviation: string, value: number) => void;
    onPrimaryChange: (abbreviation: string, isPrimary: boolean) => void;
    onClearRoll?: () => void;
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
    isObrReady,
    lastRollResult,
    rollError,
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
    onAddFocus,
    onRemoveFocus,
    onRenameFocus,
    onReorderFocus,
    onFocusBonusChange,
    onAttributeValueChange,
    onPrimaryChange,
    onClearRoll,
}: CharacterSheetViewProps) {
    const [activeTab, setActiveTab] = useState<SheetTabId>("atributos");
    const [lastRollLabel, setLastRollLabel] = useState<string | undefined>();

    const handleRoll = (attribute: Attribute, focusName?: string) => {
        setLastRollLabel(
            focusName ? `${attribute.abbreviation} (${focusName})` : attribute.abbreviation
        );
        onRollAttribute(attribute, focusName);
    };

    const handleDismissRoll = () => {
        setLastRollLabel(undefined);
        onClearRoll?.();
    };

    const rollsDisabled = !isObrReady;

    return (
        <div className="character-sheet">
            <div className="character-sheet__card">
                <SheetHeaderForm
                    sheet={sheet}
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
                />

                <SheetTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    showMagicTab={sheet.mpMax > 0}
                />

                <div className="character-sheet__panel" role="tabpanel">
                    <RollResultBanner
                        result={lastRollResult}
                        error={rollError}
                        attributeAbbreviation={lastRollLabel}
                        onDismiss={onClearRoll ? handleDismissRoll : undefined}
                    />

                    {activeTab === "atributos" && (
                        <div className="character-sheet__attributes" aria-label="Atributos">
                            {sheet.attributes.map((attribute) => (
                                <AttributeStripRow
                                    key={attribute.abbreviation}
                                    attribute={attribute}
                                    onRoll={handleRoll}
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
