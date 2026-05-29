import { useState } from "react";

import { AttributeStripRow } from "./AttributeStripRow";
import { RollResultBanner } from "./RollResultBanner";
import { SheetHeaderForm } from "./SheetHeaderForm";
import { SheetTabs } from "./SheetTabs";
import type { SheetTabId } from "./SheetTabs";

import type { CharacterSheet, Attribute } from "../../domain/entities/characterSheet";
import type { StuntRollResult } from "../../domain/entities/diceRules";

import "../styles/sheet.css";

export interface CharacterSheetViewProps {
    sheet: CharacterSheet;
    isObrReady: boolean;
    lastRollResult: StuntRollResult | null;
    rollError: string | null;
    onRollAttribute: (attribute: Attribute, focusName?: string) => void;
    onHpCurrentChange: (value: number) => void;
    onHpMaxChange: (value: number) => void;
    onMpCurrentChange: (value: number) => void;
    onMpMaxChange: (value: number) => void;
    onAddFocus: (abbreviation: string, focusName: string) => void;
    onRemoveFocus: (abbreviation: string, focusName: string) => void;
    onFocusBonusChange: (abbreviation: string, bonus: number) => void;
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
    onHpCurrentChange,
    onHpMaxChange,
    onMpCurrentChange,
    onMpMaxChange,
    onAddFocus,
    onRemoveFocus,
    onFocusBonusChange,
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
                                    onFocusBonusChange={onFocusBonusChange}
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
