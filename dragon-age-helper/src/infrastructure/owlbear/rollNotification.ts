import OBR from "@owlbear-rodeo/sdk";

import type { StuntRollResult } from "../../domain/entities/diceRules";

export type OwlbearNotificationVariant = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

const NOTIFICATION_DEDUPE_MS = 2500;
const recentNotifications = new Map<string, number>();

function notificationKey(message: string, variant: OwlbearNotificationVariant): string {
    return `${variant}:${message}`;
}

function isDuplicateNotification(message: string, variant: OwlbearNotificationVariant): boolean {
    const lastShown = recentNotifications.get(notificationKey(message, variant));
    if (lastShown === undefined) return false;
    return Date.now() - lastShown < NOTIFICATION_DEDUPE_MS;
}

function markNotificationShown(message: string, variant: OwlbearNotificationVariant): void {
    const key = notificationKey(message, variant);
    const now = Date.now();
    recentNotifications.set(key, now);

    if (recentNotifications.size > 32) {
        for (const [entryKey, timestamp] of recentNotifications) {
            if (now - timestamp >= NOTIFICATION_DEDUPE_MS) {
                recentNotifications.delete(entryKey);
            }
        }
    }
}

export async function showOwlbearNotification(
    message: string,
    variant: OwlbearNotificationVariant = "INFO"
): Promise<void> {
    if (isDuplicateNotification(message, variant)) return;

    if (!OBR.isAvailable) {
        console.warn(message);
        return;
    }

    try {
        await OBR.notification.show(message, variant);
        markNotificationShown(message, variant);
    } catch (error) {
        console.warn("Não foi possível exibir notificação Owlbear:", error);
    }
}

function formatSigned(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
}

function formatModifierTerms(result: StuntRollResult): string {
    const { attribute, focus, situational } = result.modifiers;
    const parts: string[] = [];

    parts.push(formatSigned(attribute));

    if (focus !== 0) {
        parts.push(formatSigned(focus));
    }

    if (situational !== 0) {
        parts.push(formatSigned(situational));
    }

    return parts.join(" ");
}

export function formatRollNotificationMessage(
    attributeLabel: string,
    result: StuntRollResult
): string {
    const dice = result.diceValues.join("+");
    const modifiers = formatModifierTerms(result);
    const pf = result.hasStunts ? ` (PF ${result.stuntPoints})` : "";
    return `${attributeLabel}: ${dice} ${modifiers} = ${result.finalResult}${pf}`;
}

export async function showRollNotification(
    attributeLabel: string,
    result: StuntRollResult
): Promise<void> {
    const message = formatRollNotificationMessage(attributeLabel, result);
    const variant = result.hasStunts ? "SUCCESS" : "INFO";
    await showOwlbearNotification(message, variant);
}
