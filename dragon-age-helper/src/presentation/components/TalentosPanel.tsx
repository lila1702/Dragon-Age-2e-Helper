import {
    TALENT_DEGREES,
    type Talent,
} from "../../domain/entities/talentos";

interface TalentosPanelProps {
    talents: Talent[];
    disabled?: boolean;
    onAddTalent: () => void;
    onUpdateTalent: (id: string, patch: Partial<Talent>) => void;
    onRemoveTalent: (id: string) => void;
}

export function TalentosPanel({
    talents,
    disabled = false,
    onAddTalent,
    onUpdateTalent,
    onRemoveTalent,
}: TalentosPanelProps) {
    return (
        <div className="talentos-panel" aria-label="Talentos">
            <div className="talentos-table-wrap">
                <table className="talentos-table">
                    <thead>
                        <tr>
                            <th scope="col">Talento</th>
                            {TALENT_DEGREES.map((degree) => (
                                <th key={degree} scope="col">
                                    {degree}
                                </th>
                            ))}
                            <th
                                scope="col"
                                className="talentos-table__actions-head"
                                aria-label="Ações"
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {talents.length === 0 ? (
                            <tr className="talentos-table__empty-row">
                                <td colSpan={5}>Nenhum talento cadastrado.</td>
                            </tr>
                        ) : (
                            talents.map((talent) => (
                                <tr key={talent.id} className="talentos-table__row">
                                    <td>
                                        <input
                                            type="text"
                                            className="talentos-table__input talentos-table__input--name"
                                            value={talent.name}
                                            disabled={disabled}
                                            aria-label="Nome do talento"
                                            placeholder="Ex.: Contatos"
                                            onChange={(event) =>
                                                onUpdateTalent(talent.id, {
                                                    name: event.target.value,
                                                })
                                            }
                                        />
                                    </td>
                                    {TALENT_DEGREES.map((degree) => (
                                        <td key={degree}>
                                            <textarea
                                                className="talentos-table__textarea"
                                                value={talent.benefits[degree]}
                                                disabled={disabled}
                                                aria-label={`${talent.name || "Talento"} — ${degree}`}
                                                placeholder={`Descrição do grau ${degree.toLowerCase()}.`}
                                                rows={3}
                                                onChange={(event) =>
                                                    onUpdateTalent(talent.id, {
                                                        benefits: {
                                                            ...talent.benefits,
                                                            [degree]: event.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </td>
                                    ))}
                                    <td className="talentos-table__actions">
                                        {!disabled && (
                                            <button
                                                type="button"
                                                className="talentos-table__remove"
                                                onClick={() => onRemoveTalent(talent.id)}
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
                <button type="button" className="talentos-panel__add" onClick={onAddTalent}>
                    + Talento
                </button>
            )}
        </div>
    );
}

export type { TalentDegree } from "../../domain/entities/talentos";