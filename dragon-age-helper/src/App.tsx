import { CharacterSheetView } from "./presentation/components/CharacterSheetView";
import { useCharacterSheet } from "./presentation/hooks/useCharacterSheet";

import "./index.css";

function App() {
    const {
        characterSheet,
        isObrReady,
        lastRollResult,
        rollError,
        rollAttribute,
        clearLastRoll,
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
        addFocus,
        removeFocus,
        renameFocus,
        reorderFocus,
        setFocusBonus,
        setAttributePrimary,
    } = useCharacterSheet();

    return (
        <CharacterSheetView
            sheet={characterSheet}
            isObrReady={isObrReady}
            lastRollResult={lastRollResult}
            rollError={rollError}
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
            onAddFocus={addFocus}
            onRemoveFocus={removeFocus}
            onRenameFocus={renameFocus}
            onReorderFocus={reorderFocus}
            onFocusBonusChange={setFocusBonus}
            onPrimaryChange={setAttributePrimary}
            onClearRoll={clearLastRoll}
        />
    );
}

export default App;
