import { CharacterSheetView } from "./presentation/components/CharacterSheetView";
import { useCharacterSheet } from "./presentation/hooks/useCharacterSheet";
import { usePlayerRole } from "./presentation/hooks/usePlayerRole";

import "./index.css";

function App() {
    const {
        characterSheet,
        isObrAvailable,
        isObrReady,
        tokenName,
        selectionError,
        isLoadingSheet,
        needsCreateSheet,
        canCreateSheet,
        canEditSheet,
        canRoll,
        isReadOnlySheet,
        isCreatingSheet,
        createSheetOnToken,
        rollAttribute,
        rollAttack,
        rollDamage,
        setName,
        setHistorico,
        setClassName,
        setLevel,
        setIdade,
        setSexo,
        setCombatStat,
        setAttributeValue,
        setHpCurrent,
        setHpMax,
        setMpCurrent,
        setMpMax,
        setResourceEditing,
        addFocus,
        removeFocus,
        renameFocus,
        reorderFocus,
        setFocusBonus,
        setAttributePrimary,
        addMeleeAttack,
        updateMeleeAttack,
        removeMeleeAttack,
        reorderMeleeAttack,
        addRangedAttack,
        updateRangedAttack,
        removeRangedAttack,
        reorderRangedAttack,
        setWeaponGroups,
        setLutUsesWillpowerForDamage,
        setArcaneWarriorOptionEnabled,
        addClassAbility,
        updateClassAbility,
        removeClassAbility,
    } = useCharacterSheet();

    const { isGM } = usePlayerRole(isObrReady);

    return (
        <CharacterSheetView
            sheet={characterSheet}
            isObrAvailable={isObrAvailable}
            isObrReady={isObrReady}
            isGM={isGM}
            tokenName={tokenName}
            selectionError={selectionError}
            isLoadingSheet={isLoadingSheet}
            needsCreateSheet={needsCreateSheet}
            canCreateSheet={canCreateSheet}
            canEditSheet={canEditSheet}
            canRoll={canRoll}
            isReadOnlySheet={isReadOnlySheet}
            isCreatingSheet={isCreatingSheet}
            onCreateSheet={() => void createSheetOnToken()}
            onRollAttribute={rollAttribute}
            onRollAttack={(attackId, attackKind, options) =>
                void rollAttack(attackId, attackKind, options)
            }
            onRollDamage={(attackId, attackKind, options) =>
                void rollDamage(attackId, attackKind, options)
            }
            onNameChange={setName}
            onHistoricoChange={setHistorico}
            onClassNameChange={setClassName}
            onLevelChange={setLevel}
            onIdadeChange={setIdade}
            onSexoChange={setSexo}
            onCombatStatChange={setCombatStat}
            onAttributeValueChange={setAttributeValue}
            onHpCurrentChange={setHpCurrent}
            onHpMaxChange={setHpMax}
            onMpCurrentChange={setMpCurrent}
            onMpMaxChange={setMpMax}
            onResourceEditingChange={setResourceEditing}
            onAddFocus={addFocus}
            onRemoveFocus={removeFocus}
            onRenameFocus={renameFocus}
            onReorderFocus={reorderFocus}
            onFocusBonusChange={setFocusBonus}
            onPrimaryChange={setAttributePrimary}
            onAddMeleeAttack={addMeleeAttack}
            onUpdateMeleeAttack={updateMeleeAttack}
            onRemoveMeleeAttack={removeMeleeAttack}
            onReorderMeleeAttack={reorderMeleeAttack}
            onAddRangedAttack={addRangedAttack}
            onUpdateRangedAttack={updateRangedAttack}
            onRemoveRangedAttack={removeRangedAttack}
            onReorderRangedAttack={reorderRangedAttack}
            onWeaponGroupsChange={setWeaponGroups}
            onLutUsesWillpowerForDamageChange={setLutUsesWillpowerForDamage}
            onArcaneWarriorOptionEnabledChange={setArcaneWarriorOptionEnabled}
            onAddClassAbility={addClassAbility}
            onUpdateClassAbility={updateClassAbility}
            onRemoveClassAbility={removeClassAbility}
        />
    );
}

export default App;
