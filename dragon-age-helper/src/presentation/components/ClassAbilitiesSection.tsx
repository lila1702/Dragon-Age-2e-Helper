import type { ClassAbility } from "../../domain/entities/habilidades";

interface ClassAbilitiesSectionProps {
    classAbilities: ClassAbility[];
    disabled?: boolean;
    onAddClassAbility: () => void;
    onUpdateClassAbility: (id: string, patch: Partial<ClassAbility>) => void;
    onRemoveClassAbility: (id: string) => void;
}

export function ClassAbilitiesSection({
    classAbilities,
    disabled = false,
    onAddClassAbility,
    onUpdateClassAbility,
    onRemoveClassAbility,
}: ClassAbilitiesSectionProps) {
    return (
        <section className="habilidades-class" aria-label="Habilidades de classe">
            <div className="habilidades-class__header">Habilidades de Classe</div>

            <div className="habilidades-class__body">
                {classAbilities.length === 0 ? (
                    <p className="habilidades-class__empty">
                        Nenhuma habilidade de classe cadastrada.
                    </p>
                ) : (
                    <ul className="habilidades-class__list">
                        {classAbilities.map((ability) => (
                            <li key={ability.id} className="habilidades-class__item">
                                <div className="habilidades-class__item-head">
                                    <input
                                        type="text"
                                        className="habilidades-class__name"
                                        value={ability.name}
                                        disabled={disabled}
                                        aria-label="Nome da habilidade de classe"
                                        placeholder="Ex.: Ataque Certeiro"
                                        onChange={(event) =>
                                            onUpdateClassAbility(ability.id, {
                                                name: event.target.value,
                                            })
                                        }
                                    />
                                    {!disabled && (
                                        <button
                                            type="button"
                                            className="habilidades-class__remove"
                                            onClick={() => onRemoveClassAbility(ability.id)}
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    className="habilidades-class__description"
                                    value={ability.description}
                                    disabled={disabled}
                                    aria-label={`Descrição de ${ability.name || "habilidade"}`}
                                    placeholder="Descrição completa da habilidade."
                                    rows={3}
                                    onChange={(event) =>
                                        onUpdateClassAbility(ability.id, {
                                            description: event.target.value,
                                        })
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                )}

                {!disabled && (
                    <button
                        type="button"
                        className="habilidades-section__add"
                        onClick={onAddClassAbility}
                    >
                        + Habilidade de classe
                    </button>
                )}
            </div>
        </section>
    );
}
