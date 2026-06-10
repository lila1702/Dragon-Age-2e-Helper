import { resolveFocusBonus } from "../../domain/entities/attributeRoll";

import type { Attribute } from "../../domain/entities/characterSheet";

export interface AttributeRowProps {
    attribute: Attribute;
    onRoll: (attr: Attribute) => void;
    disabled?: boolean;
}

export function AttributeRow({ attribute, onRoll, disabled = false }: AttributeRowProps) {
    const bonus = resolveFocusBonus(attribute);
    const focusLabel = attribute.activeFocusName
        ? `+${bonus} (${attribute.activeFocusName})`
        : `+${bonus}`;

    return (
        <div className="attribute-row">
            <div className="attribute-row__info">
                <span className="attribute-row__abbr" title={attribute.name}>
                    {attribute.abbreviation}
                </span>
                <span className="attribute-row__value">{attribute.value}</span>
                {focusLabel && <span className="attribute-row__focus">{focusLabel}</span>}
            </div>
            <button
                type="button"
                className="attribute-row__roll"
                onClick={() => onRoll(attribute)}
                disabled={disabled}
                aria-label={`Rolar teste de ${attribute.name}`}
            >
                Rolar
            </button>
        </div>
    );
}
