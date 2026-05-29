import { FocusBonusInput } from "./FocusBonusInput";
import { FocusListEditor } from "./FocusListEditor";

import type { Attribute } from "../../domain/entities/characterSheet";

export interface AttributeStripRowProps {
    attribute: Attribute;
    onRoll: (attribute: Attribute, focusName?: string) => void;
    onAddFocus: (abbreviation: string, focusName: string) => void;
    onRemoveFocus: (abbreviation: string, focusName: string) => void;
    onFocusBonusChange: (abbreviation: string, bonus: number) => void;
    disabled?: boolean;
}

export function AttributeStripRow({
    attribute,
    onRoll,
    onAddFocus,
    onRemoveFocus,
    onFocusBonusChange,
    disabled = false,
}: AttributeStripRowProps) {
    const focusNames = attribute.focusNames ?? [];

    return (
        <div className="attribute-strip">
            <div className="attribute-strip__attr sheet-field">
                <div className="sheet-field__head sheet-field__head--abbr">
                    {attribute.abbreviation.toUpperCase()}
                </div>
                <div className="sheet-field__body sheet-field__body--attr">
                    <button
                        type="button"
                        className="attribute-strip__attr-btn"
                        title={attribute.name}
                        disabled={disabled}
                        aria-label={`Rolar ${attribute.name}`}
                        onClick={() => onRoll(attribute)}
                    >
                        <span className="attribute-strip__attr-value">{attribute.value}</span>
                    </button>
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
                        onRollFocus={(name) => onRoll(attribute, name)}
                        onAddFocus={(name) => onAddFocus(attribute.abbreviation, name)}
                        onRemoveFocus={(name) => onRemoveFocus(attribute.abbreviation, name)}
                    />
                </div>
            </div>
        </div>
    );
}
