import { useEffect, useRef, useState } from "react";

import { parseSituationalModifiers } from "../../domain/entities/attributeRoll";

interface RollSituationalModalProps {
    open: boolean;
    rollLabel: string;
    onConfirm: (situationalModifier: number) => void;
    onCancel: () => void;
}

function formatPreviewTotal(modifiers: string): string | null {
    const trimmed = modifiers.trim();
    if (!trimmed) return null;
    const total = parseSituationalModifiers(trimmed);
    return total === 0 ? null : `${total >= 0 ? "+" : ""}${total}`;
}

export function RollSituationalModal({
    open,
    rollLabel,
    onConfirm,
    onCancel,
}: RollSituationalModalProps) {
    const [draft, setDraft] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        setDraft("");
        requestAnimationFrame(() => inputRef.current?.focus());
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onCancel();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onCancel]);

    if (!open) return null;

    const preview = formatPreviewTotal(draft);

    const handleSubmit = () => {
        onConfirm(parseSituationalModifiers(draft));
    };

    return (
        <div className="roll-modal-backdrop" role="presentation" onClick={onCancel}>
            <div
                className="roll-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="roll-situational-title"
                onClick={(event) => event.stopPropagation()}
            >
                <h2 id="roll-situational-title" className="roll-modal__title">
                    Rolagem Situacional
                </h2>
                <p className="roll-modal__subtitle">{rollLabel}</p>
                <p className="roll-modal__hint">
                    Informe bônus ou penalidades da cena (ex.: <code>+2</code>,{" "}
                    <code>-2</code>, <code>+1 -2</code> ou <code>+1, -2</code>).
                </p>
                <label className="roll-modal__field">
                    <span className="roll-modal__label">Modificadores</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="roll-modal__input"
                        value={draft}
                        placeholder="+2, -1 ou +1 -2"
                        aria-describedby="roll-situational-preview"
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") handleSubmit();
                        }}
                    />
                </label>
                {preview && (
                    <p id="roll-situational-preview" className="roll-modal__preview">
                        Total situacional: <strong>{preview}</strong>
                    </p>
                )}
                <div className="roll-modal__actions">
                    <button type="button" className="roll-modal__btn" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="roll-modal__btn roll-modal__btn--primary"
                        onClick={handleSubmit}
                    >
                        Rolar
                    </button>
                </div>
            </div>
        </div>
    );
}
