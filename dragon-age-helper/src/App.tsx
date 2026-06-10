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
    } = useCharacterSheet();

    usePlayerRole(isObrReady);

    return (
        <CharacterSheetView
            sheet={characterSheet}
            isObrAvailable={isObrAvailable}
            isObrReady={isObrReady}
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
        />
    );
}

export default App;
