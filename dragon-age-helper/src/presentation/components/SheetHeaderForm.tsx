import { ResourceValueMax } from "./ResourceValueMax";
import { SheetFieldInput } from "./SheetFieldInput";

import type { CharacterSheet, CombatStats } from "../../domain/entities/characterSheet";

const DEFAULT_COMBAT: CombatStats = {
    speed: 0,
    defense: 0,
    armor: 0,
    armorPenalty: 0,
};

interface SheetHeaderFormProps {
    sheet: CharacterSheet;
    disabled?: boolean;
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
}

function parseOptionalInt(value: string, fallback: number): number {
    const trimmed = value.trim();
    if (trimmed === "") return fallback;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

export function SheetHeaderForm({
    sheet,
    disabled = false,
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
}: SheetHeaderFormProps) {
    const combat = { ...DEFAULT_COMBAT, ...sheet.combatStats };

    return (
        <header className="sheet-header-form">
            <div className="sheet-header-form__row sheet-header-form__row--primary">
                <SheetFieldInput
                    label="Nome"
                    value={sheet.name}
                    onChange={onNameChange}
                    className="sheet-field--wide"
                    disabled={disabled}
                />
                <SheetFieldInput
                    label="Histórico"
                    value={sheet.historico ?? ""}
                    onChange={onHistoricoChange}
                    className="sheet-field--medium"
                    disabled={disabled}
                />
            </div>
            <div className="sheet-header-form__row sheet-header-form__row--secondary">
                <SheetFieldInput
                    label="Classe"
                    value={sheet.className}
                    onChange={onClassNameChange}
                    className="sheet-field--class"
                    disabled={disabled}
                />
                <SheetFieldInput
                    label="Nível"
                    value={String(sheet.level)}
                    onChange={(v) => onLevelChange(parseOptionalInt(v, sheet.level))}
                    className="sheet-field--narrow"
                    inputMode="numeric"
                    centered
                    disabled={disabled}
                />
                <SheetFieldInput
                    label="Idade"
                    value={sheet.idade ?? ""}
                    onChange={onIdadeChange}
                    className="sheet-field--narrow"
                    disabled={disabled}
                />
                <SheetFieldInput
                    label="Sexo"
                    value={sheet.sexo ?? ""}
                    onChange={onSexoChange}
                    className="sheet-field--narrow"
                    disabled={disabled}
                />
            </div>
            <div className="sheet-header-form__row sheet-header-form__row--combat">
                <SheetFieldInput
                    label="Velocidade"
                    value={String(combat.speed)}
                    onChange={(v) => onCombatStatChange("speed", parseOptionalInt(v, combat.speed))}
                    combatStat
                    disabled={disabled}
                />
                <SheetFieldInput
                    label="Defesa"
                    value={String(combat.defense)}
                    onChange={(v) => onCombatStatChange("defense", parseOptionalInt(v, combat.defense))}
                    combatStat
                    disabled={disabled}
                />
                <SheetFieldInput
                    label="Armadura"
                    value={String(combat.armor)}
                    onChange={(v) => onCombatStatChange("armor", parseOptionalInt(v, combat.armor))}
                    combatStat
                    disabled={disabled}
                />
                <SheetFieldInput
                    label="Penalidade"
                    value={String(combat.armorPenalty)}
                    onChange={(v) =>
                        onCombatStatChange("armorPenalty", parseOptionalInt(v, combat.armorPenalty))
                    }
                    combatStat
                    disabled={disabled}
                />
                <ResourceValueMax
                    label="Saúde"
                    current={sheet.hpCurrent}
                    max={sheet.hpMax}
                    variant="health"
                    compact
                    disabled={disabled}
                    onCurrentChange={onHpCurrentChange}
                    onMaxChange={onHpMaxChange}
                />
                <ResourceValueMax
                    label="Mana"
                    current={sheet.mpCurrent}
                    max={sheet.mpMax}
                    variant="mana"
                    compact
                    disabled={disabled}
                    onCurrentChange={onMpCurrentChange}
                    onMaxChange={onMpMaxChange}
                />
            </div>
        </header>
    );
}
