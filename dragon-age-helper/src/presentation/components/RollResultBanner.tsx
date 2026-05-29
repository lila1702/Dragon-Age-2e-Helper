import type { StuntRollResult } from "../../domain/entities/diceRules";

interface RollResultBannerProps {
    result: StuntRollResult | null;
    error: string | null;
    attributeAbbreviation?: string;
    onDismiss?: () => void;
}

export function RollResultBanner({
    result,
    error,
    attributeAbbreviation,
    onDismiss,
}: RollResultBannerProps) {
    if (!result && !error) return null;

    if (error) {
        return (
            <div className="roll-banner roll-banner--error" role="alert">
                <p className="roll-banner__text">{error}</p>
                {onDismiss && (
                    <button type="button" className="roll-banner__dismiss" onClick={onDismiss}>
                        Fechar
                    </button>
                )}
            </div>
        );
    }

    if (!result) return null;

    const diceLabel = result.diceValues.join(" · ");
    const prefix = attributeAbbreviation ? `${attributeAbbreviation}: ` : "";

    return (
        <div
            className={`roll-banner ${result.hasStunts ? "roll-banner--stunt" : ""}`}
            role="status"
        >
            <p className="roll-banner__dice">
                {prefix}
                <span className="roll-banner__values">{diceLabel}</span>
            </p>
            <p className="roll-banner__total">
                Total <strong>{result.finalResult}</strong>
                {result.hasStunts && (
                    <span className="roll-banner__stunt">
                        {" "}
                        · <strong>{result.stuntPoints} PF</strong>
                    </span>
                )}
            </p>
            {onDismiss && (
                <button type="button" className="roll-banner__dismiss" onClick={onDismiss}>
                    Fechar
                </button>
            )}
        </div>
    );
}
