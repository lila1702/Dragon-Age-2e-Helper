import {
    SPELL_DEGREES,
    SPELL_DEGREE_LABELS,
    computeSpellpower,
    type Spell,
    type SpellDegree,
} from "../../domain/entities/magias";

import type { Attribute } from "../../domain/entities/characterSheet";
import type { ArcanaSpecialization } from "../../domain/entities/especializacoesArcanas";

import { EspecializacoesArcanasPanel } from "./EspecializacoesArcanasPanel";
import { SpellsDegreeTable } from "./SpellsDegreeTable";

interface MagiaPanelProps {
    spells: Spell[];
    specializations: ArcanaSpecialization[];
    attributes: Attribute[];
    disabled?: boolean;
    onAddSpell: (degree: SpellDegree) => void;
    onUpdateSpell: (id: string, patch: Partial<Spell>) => void;
    onRemoveSpell: (id: string) => void;
    onAddSpecialization: () => void;
    onUpdateSpecialization: (id: string, patch: Partial<ArcanaSpecialization>) => void;
    onRemoveSpecialization: (id: string) => void;
}

export function MagiaPanel({
    spells,
    specializations,
    attributes,
    disabled = false,
    onAddSpell,
    onUpdateSpell,
    onRemoveSpell,
    onAddSpecialization,
    onUpdateSpecialization,
    onRemoveSpecialization,
}: MagiaPanelProps) {
    const spellpower = computeSpellpower(attributes);

    return (
        <div className="magia-panel" aria-label="Magias">
            <div className="magia-panel__summary">
                <span className="magia-panel__spellpower-label">Poder Arcano</span>
                <span className="magia-panel__spellpower-value">
                    {spellpower !== null ? spellpower : "—"}
                </span>
                <span className="magia-panel__spellpower-note">10 + VON</span>
            </div>

            {SPELL_DEGREES.map((degree) => (
                <SpellsDegreeTable
                    key={degree}
                    title={SPELL_DEGREE_LABELS[degree]}
                    spells={spells.filter((spell) => spell.degree === degree)}
                    disabled={disabled}
                    onAddSpell={() => onAddSpell(degree)}
                    onUpdateSpell={onUpdateSpell}
                    onRemoveSpell={onRemoveSpell}
                />
            ))}

            <EspecializacoesArcanasPanel
                specializations={specializations}
                disabled={disabled}
                onAddSpecialization={onAddSpecialization}
                onUpdateSpecialization={onUpdateSpecialization}
                onRemoveSpecialization={onRemoveSpecialization}
            />
        </div>
    );
}
