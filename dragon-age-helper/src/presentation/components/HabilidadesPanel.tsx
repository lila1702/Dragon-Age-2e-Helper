import { AttacksSection } from "./AttacksSection";
import { ClassAbilitiesSection } from "./ClassAbilitiesSection";

import type { AttackRollOptions } from "../../domain/entities/attackRoll";
import type { Attribute } from "../../domain/entities/characterSheet";
import type {
    ClassAbility,
    Habilidades,
    MeleeAttack,
    RangedAttack,
} from "../../domain/entities/habilidades";
import { createEmptyHabilidades } from "../../domain/entities/habilidades";

interface HabilidadesPanelProps {
    habilidades?: Habilidades;
    attributes: Attribute[];
    isGM?: boolean;
    disabled?: boolean;
    canRoll?: boolean;
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
}

export function HabilidadesPanel({
    habilidades,
    attributes,
    isGM = false,
    disabled = false,
    canRoll = false,
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
}: HabilidadesPanelProps) {
    const data = habilidades ?? createEmptyHabilidades();

    return (
        <div className="habilidades-panel" aria-label="Habilidades">
            <AttacksSection
                habilidades={data}
                attributes={attributes}
                isGM={isGM}
                disabled={disabled}
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
            />

            <ClassAbilitiesSection
                classAbilities={data.classAbilities}
                disabled={disabled}
                onAddClassAbility={onAddClassAbility}
                onUpdateClassAbility={onUpdateClassAbility}
                onRemoveClassAbility={onRemoveClassAbility}
            />
        </div>
    );
}
