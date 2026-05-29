import { ResourceValueMax } from "./ResourceValueMax";

import type { CharacterSheet } from "../../domain/entities/characterSheet";

interface SheetHeaderFormProps {
    sheet: CharacterSheet;
    onHpCurrentChange: (value: number) => void;
    onHpMaxChange: (value: number) => void;
    onMpCurrentChange: (value: number) => void;
    onMpMaxChange: (value: number) => void;
}

function FieldCell({
    label,
    value,
    className = "",
    combatStat = false,
}: {
    label: string;
    value: string;
    className?: string;
    combatStat?: boolean;
}) {
    const combatClass = combatStat ? "sheet-field--combat-stat" : "";
    return (
        <div className={`sheet-field ${combatClass} ${className}`.trim()}>
            <div className="sheet-field__head">{label}</div>
            <div
                className={`sheet-field__body${combatStat ? " sheet-field__body--combat-stat" : ""}`.trim()}
            >
                {value || "—"}
            </div>
        </div>
    );
}

export function SheetHeaderForm({
    sheet,
    onHpCurrentChange,
    onHpMaxChange,
    onMpCurrentChange,
    onMpMaxChange,
}: SheetHeaderFormProps) {
    const combat = sheet.combatStats;

    return (
        <header className="sheet-header-form">
            <div className="sheet-header-form__row sheet-header-form__row--primary">
                <FieldCell label="Nome" value={sheet.name} className="sheet-field--wide" />
                <FieldCell
                    label="Histórico"
                    value={sheet.historico ?? ""}
                    className="sheet-field--medium"
                />
            </div>
            <div className="sheet-header-form__row sheet-header-form__row--secondary">
                <FieldCell
                    label="Classe"
                    value={`${sheet.className} · nível ${sheet.level}`}
                    className="sheet-field--class"
                />
                <FieldCell label="Idade" value={sheet.idade ?? ""} className="sheet-field--narrow" />
                <FieldCell label="Sexo" value={sheet.sexo ?? ""} className="sheet-field--narrow" />
            </div>
            <div className="sheet-header-form__row sheet-header-form__row--combat">
                {combat && (
                    <>
                        <FieldCell label="Velocidade" value={String(combat.speed)} combatStat />
                        <FieldCell label="Defesa" value={String(combat.defense)} combatStat />
                        <FieldCell label="Armadura" value={String(combat.armor)} combatStat />
                        <FieldCell label="Penalidade" value={String(combat.armorPenalty)} combatStat />
                    </>
                )}
                <ResourceValueMax
                    label="Saúde"
                    current={sheet.hpCurrent}
                    max={sheet.hpMax}
                    variant="health"
                    compact
                    onCurrentChange={onHpCurrentChange}
                    onMaxChange={onHpMaxChange}
                />
                {sheet.mpMax > 0 && (
                    <ResourceValueMax
                        label="Mana"
                        current={sheet.mpCurrent}
                        max={sheet.mpMax}
                        variant="mana"
                        compact
                        onCurrentChange={onMpCurrentChange}
                        onMaxChange={onMpMaxChange}
                    />
                )}
            </div>
        </header>
    );
}
