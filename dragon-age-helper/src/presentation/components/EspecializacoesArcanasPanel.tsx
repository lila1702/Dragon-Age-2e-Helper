import { AutoResizeTextarea } from "./AutoResizeTextarea";

import {
    SPECIALIZATION_DEGREES,
    type ArcanaSpecialization,
} from "../../domain/entities/especializacoesArcanas";

interface EspecializacoesArcanasPanelProps {
    specializations: ArcanaSpecialization[];
    disabled?: boolean;
    onAddSpecialization: () => void;
    onUpdateSpecialization: (id: string, patch: Partial<ArcanaSpecialization>) => void;
    onRemoveSpecialization: (id: string) => void;
}

export function EspecializacoesArcanasPanel({
    specializations,
    disabled = false,
    onAddSpecialization,
    onUpdateSpecialization,
    onRemoveSpecialization,
}: EspecializacoesArcanasPanelProps) {
    return (
        <section className="magia-spec-section" aria-label="Especializações arcanas">
            <h3 className="magia-spec-section__title">Especializações</h3>

            <div className="magia-spec-table-wrap">
                <table className="magia-spec-table">
                    <thead>
                        <tr>
                            <th scope="col">Especialização</th>
                            {SPECIALIZATION_DEGREES.map((degree) => (
                                <th key={degree} scope="col">
                                    {degree}
                                </th>
                            ))}
                            <th
                                scope="col"
                                className="magia-spec-table__actions-head"
                                aria-label="Ações"
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {specializations.length === 0 ? (
                            <tr className="magia-spec-table__empty-row">
                                <td colSpan={5}>Nenhuma especialização cadastrada.</td>
                            </tr>
                        ) : (
                            specializations.map((entry) => (
                                <tr key={entry.id} className="magia-spec-table__row">
                                    <td>
                                        <input
                                            type="text"
                                            className="magia-spec-table__input magia-spec-table__input--name"
                                            value={entry.name}
                                            disabled={disabled}
                                            aria-label="Nome da especialização"
                                            placeholder="Ex.: Necromancia"
                                            onChange={(event) =>
                                                onUpdateSpecialization(entry.id, {
                                                    name: event.target.value,
                                                })
                                            }
                                        />
                                    </td>
                                    {SPECIALIZATION_DEGREES.map((degree) => (
                                        <td key={degree}>
                                            <AutoResizeTextarea
                                                className="magia-spec-table__textarea"
                                                value={entry.benefits[degree]}
                                                disabled={disabled}
                                                aria-label={`${entry.name || "Especialização"} — ${degree}`}
                                                placeholder={`Descrição do grau ${degree.toLowerCase()}.`}
                                                onChange={(event) =>
                                                    onUpdateSpecialization(entry.id, {
                                                        benefits: {
                                                            ...entry.benefits,
                                                            [degree]: event.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </td>
                                    ))}
                                    <td className="magia-spec-table__actions">
                                        {!disabled && (
                                            <button
                                                type="button"
                                                className="magia-spec-table__remove"
                                                onClick={() => onRemoveSpecialization(entry.id)}
                                            >
                                                Remover
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!disabled && (
                <button
                    type="button"
                    className="magia-spec-section__add"
                    onClick={onAddSpecialization}
                >
                    + Especialização
                </button>
            )}
        </section>
    );
}
