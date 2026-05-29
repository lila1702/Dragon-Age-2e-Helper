interface ResourceTrackerProps {
    label: string;
    current: number;
    max: number;
    onChange: (delta: number) => void;
    hidden?: boolean;
}

const DELTAS = [-5, -1, 1, 5] as const;

export function ResourceTracker({
    label,
    current,
    max,
    onChange,
    hidden = false,
}: ResourceTrackerProps) {
    if (hidden) return null;

    return (
        <div className="resource-tracker">
            <div className="resource-tracker__header">
                <span className="resource-tracker__label">{label}</span>
                <span className="resource-tracker__value">
                    {current} / {max}
                </span>
            </div>
            <div className="resource-tracker__controls">
                {DELTAS.map((delta) => (
                    <button
                        key={delta}
                        type="button"
                        className="resource-tracker__btn"
                        onClick={() => onChange(delta)}
                        aria-label={`${delta > 0 ? "Aumentar" : "Diminuir"} ${label} em ${Math.abs(delta)}`}
                    >
                        {delta > 0 ? `+${delta}` : delta}
                    </button>
                ))}
            </div>
        </div>
    );
}
