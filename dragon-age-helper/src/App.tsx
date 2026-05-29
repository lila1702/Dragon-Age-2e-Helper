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
        setHpCurrent,
        setHpMax,
        setMpCurrent,
        setMpMax,
        addFocus,
        removeFocus,
        setFocusBonus,
    } = useCharacterSheet();

    return (
        <CharacterSheetView
            sheet={characterSheet}
            isObrReady={isObrReady}
            lastRollResult={lastRollResult}
            rollError={rollError}
            onRollAttribute={rollAttribute}
            onHpCurrentChange={setHpCurrent}
            onHpMaxChange={setHpMax}
            onMpCurrentChange={setMpCurrent}
            onMpMaxChange={setMpMax}
            onAddFocus={addFocus}
            onRemoveFocus={removeFocus}
            onFocusBonusChange={setFocusBonus}
            onClearRoll={clearLastRoll}
        />
    );
}

export default App;
