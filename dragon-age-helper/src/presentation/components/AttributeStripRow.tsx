import { useState } from "react";

import { AttributeValueInput } from "./AttributeValueInput";
import { FocusBonusInput } from "./FocusBonusInput";
import { FocusListEditor } from "./FocusListEditor";
import { RollSituationalModal } from "./RollSituationalModal";

import type { AttributeRollOptions } from "../../domain/entities/attributeRoll";
import type { Attribute } from "../../domain/entities/characterSheet";

export interface AttributeStripRowProps {
    attribute: Attribute;
    onRoll: (attribute: Attribute, options?: AttributeRollOptions) => void;
    onAddFocus: (abbreviation: string, focusName: string) => void;
    onRemoveFocus: (abbreviation: string, focusName: string) => void;
    onRenameFocus: (abbreviation: string, oldName: string, newName: string) => void;
    onReorderFocus: (abbreviation: string, fromIndex: number, toIndex: number) => void;
    onFocusBonusChange: (abbreviation: string, bonus: number) => void;
    onAttributeValueChange: (abbreviation: string, value: number) => void;
    onPrimaryChange: (abbreviation: string, isPrimary: boolean) => void;
    disabled?: boolean;
}

interface PendingSituationalRoll {
    focusName?: string;
}

function buildRollLabel(attribute: Attribute, focusName?: string): string {
    return focusName
        ? `${attribute.abbreviation} (${focusName})`
        : attribute.abbreviation;
}

export function AttributeStripRow({
    attribute,
    onRoll,
    onAddFocus,
    onRemoveFocus,
    onRenameFocus,
    onReorderFocus,
    onFocusBonusChange,
    onAttributeValueChange,
    onPrimaryChange,
    disabled = false,
}: AttributeStripRowProps) {
    const focusNames = attribute.focusNames ?? [];
    const [pendingSituationalRoll, setPendingSituationalRoll] =
        useState<PendingSituationalRoll | null>(null);

    const openSituationalRoll = (focusName?: string) => {
        setPendingSituationalRoll({ focusName });
    };

    const handleSituationalConfirm = (situationalModifier: number) => {
        onRoll(attribute, {
            focusName: pendingSituationalRoll?.focusName,
            situationalModifier,
        });
        setPendingSituationalRoll(null);
    };

    return (
        <>
            <div className="attribute-strip">
                <div className="attribute-strip__attr sheet-field">
                    <div className="sheet-field__head sheet-field__head--abbr sheet-field__head--with-check">
                        <input
                            type="checkbox"
                            className="attribute-strip__primary-check"
                            checked={attribute.isPrimary ?? false}
                            aria-label={`${attribute.name} é atributo primário`}
                            onChange={(e) =>
                                onPrimaryChange(attribute.abbreviation, e.target.checked)
                            }
                            onClick={(e) => e.stopPropagation()}
                        />
                        <span className="sheet-field__head__abbr">
                            {attribute.abbreviation.toUpperCase()}
                        </span>
                    </div>
                    <div className="sheet-field__body sheet-field__body--attr">
                        <AttributeValueInput
                            attribute={attribute}
                            disabled={disabled}
                            onValueChange={onAttributeValueChange}
                            onRoll={(attr) => onRoll(attr)}
                            onOpenSituationalRoll={() => openSituationalRoll()}
                        />
                    </div>
                </div>

                <div className="attribute-strip__foco-mod sheet-field sheet-field--narrow">
                    <div className="sheet-field__head">Foco</div>
                    <div className="sheet-field__body sheet-field__body--foco-mod">
                        <FocusBonusInput
                            attribute={attribute}
                            onFocusBonusChange={onFocusBonusChange}
                        />
                    </div>
                </div>

                <div className="attribute-strip__focos sheet-field sheet-field--wide">
                    <div className="sheet-field__head">Focos</div>
                    <div className="sheet-field__body sheet-field__body--focos-list">
                        <FocusListEditor
                            focusNames={focusNames}
                            disabled={disabled}
                            onRollFocus={(name) => onRoll(attribute, { focusName: name })}
                            onOpenSituationalRoll={(name) => openSituationalRoll(name)}
                            onAddFocus={(name) => onAddFocus(attribute.abbreviation, name)}
                            onRemoveFocus={(name) => onRemoveFocus(attribute.abbreviation, name)}
                            onRenameFocus={(oldName, newName) =>
                                onRenameFocus(attribute.abbreviation, oldName, newName)
                            }
                            onReorderFocus={(from, to) =>
                                onReorderFocus(attribute.abbreviation, from, to)
                            }
                        />
                    </div>
                </div>
            </div>

            <RollSituationalModal
                open={pendingSituationalRoll !== null}
                rollLabel={buildRollLabel(attribute, pendingSituationalRoll?.focusName)}
                onConfirm={handleSituationalConfirm}
                onCancel={() => setPendingSituationalRoll(null)}
            />
        </>
    );
}
