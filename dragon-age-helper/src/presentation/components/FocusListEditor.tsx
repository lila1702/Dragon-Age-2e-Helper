import { useState } from "react";

interface FocusListEditorProps {
    focusNames: string[];
    disabled?: boolean;
    onRollFocus: (focusName: string) => void;
    onAddFocus: (name: string) => void;
    onRemoveFocus: (name: string) => void;
}

export function FocusListEditor({
    focusNames,
    disabled = false,
    onRollFocus,
    onAddFocus,
    onRemoveFocus,
}: FocusListEditorProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [draft, setDraft] = useState("");

    const submitNewFocus = () => {
        const trimmed = draft.trim();
        if (!trimmed) {
            setIsAdding(false);
            setDraft("");
            return;
        }
        if (!focusNames.includes(trimmed)) {
            onAddFocus(trimmed);
        }
        setDraft("");
        setIsAdding(false);
    };

    return (
        <div className="focus-list">
            <ul className="focus-list__items" aria-label="Focos do atributo">
                {focusNames.map((name) => (
                    <li key={name} className="focus-list__item">
                        <button
                            type="button"
                            className="focus-list__focus-btn"
                            disabled={disabled}
                            title={`Rolar com foco: ${name} (clique direito para remover)`}
                            onClick={() => onRollFocus(name)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                onRemoveFocus(name);
                            }}
                        >
                            {name}
                        </button>
                    </li>
                ))}
            </ul>

            {isAdding ? (
                <div className="focus-list__add-row">
                    <input
                        type="text"
                        className="focus-list__input"
                        value={draft}
                        placeholder="Nome do foco"
                        autoFocus
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") submitNewFocus();
                            if (e.key === "Escape") {
                                setIsAdding(false);
                                setDraft("");
                            }
                        }}
                        onBlur={submitNewFocus}
                    />
                </div>
            ) : (
                <button
                    type="button"
                    className="focus-list__add-btn"
                    disabled={disabled}
                    aria-label="Adicionar foco"
                    onClick={() => setIsAdding(true)}
                >
                    +
                </button>
            )}
        </div>
    );
}
