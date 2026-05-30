import type { Item } from "@owlbear-rodeo/sdk";

export const OWL_TRACKERS_METADATA_KEY = "com.owl-trackers/trackers";

export const OWL_TRACKER_NAMES = {
    HP: "Saúde",
    MP: "Mana",
} as const;

export const OWL_TRACKER_COLORS = {
    HP: 2,
    MP: 8,
} as const;

export interface OwlTrackerValueMax {
    id: string;
    variant: "value-max";
    color: number;
    name?: string;
    showOnMap?: boolean;
    inlineMath?: boolean;
    value: number;
    max: number;
}

export interface TokenResourceValues {
    hpCurrent: number;
    hpMax: number;
    mpCurrent: number;
    mpMax: number;
}

const HP_NAME_ALIASES = new Set(["saúde", "saude", "hp", "health", "hit points", "vida"]);
const MP_NAME_ALIASES = new Set(["mana", "mp", "magic", "magia"]);

function createTrackerId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function normalizeTrackerName(name?: string): string {
    return (name ?? "").trim().toLowerCase();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isOwlTrackerValueMax(tracker: unknown): tracker is OwlTrackerValueMax {
    if (!isPlainObject(tracker)) return false;
    return (
        tracker.variant === "value-max" &&
        typeof tracker.id === "string" &&
        typeof tracker.color === "number" &&
        typeof tracker.value === "number" &&
        typeof tracker.max === "number"
    );
}

function isHpTracker(tracker: OwlTrackerValueMax): boolean {
    return HP_NAME_ALIASES.has(normalizeTrackerName(tracker.name));
}

function isMpTracker(tracker: OwlTrackerValueMax): boolean {
    return MP_NAME_ALIASES.has(normalizeTrackerName(tracker.name));
}

function getOwlTrackersFromItem(item: Item): unknown[] {
    const raw = item.metadata?.[OWL_TRACKERS_METADATA_KEY];
    return Array.isArray(raw) ? raw : [];
}

export function readHpMpFromOwlTrackers(item: Item): TokenResourceValues | null {
    const trackers = getOwlTrackersFromItem(item);

    let hp: { current: number; max: number } | undefined;
    let mp: { current: number; max: number } | undefined;

    for (const tracker of trackers) {
        if (!isOwlTrackerValueMax(tracker)) continue;
        if (isHpTracker(tracker)) {
            hp = { current: tracker.value, max: tracker.max };
        }
        if (isMpTracker(tracker)) {
            mp = { current: tracker.value, max: tracker.max };
        }
    }

    if (!hp && !mp) return null;

    return {
        hpCurrent: hp?.current ?? 0,
        hpMax: hp?.max ?? 0,
        mpCurrent: mp?.current ?? 0,
        mpMax: mp?.max ?? 0,
    };
}

function upsertResourceTracker(
    trackers: unknown[],
    matcher: (tracker: OwlTrackerValueMax) => boolean,
    build: (existing?: OwlTrackerValueMax) => OwlTrackerValueMax,
    insertIndex: number
): void {
    const index = trackers.findIndex(
        (tracker) => isOwlTrackerValueMax(tracker) && matcher(tracker)
    );

    if (index >= 0) {
        const existing = trackers[index] as OwlTrackerValueMax;
        trackers[index] = { ...existing, ...build(existing) };
        return;
    }

    trackers.splice(Math.max(0, Math.min(insertIndex, trackers.length)), 0, build());
}

export function applyHpMpToOwlTrackers(
    item: Item,
    hpCurrent: number,
    hpMax: number,
    mpCurrent: number,
    mpMax: number
): void {
    const trackers = [...getOwlTrackersFromItem(item)];

    upsertResourceTracker(
        trackers,
        isHpTracker,
        (existing) => ({
            id: existing?.id ?? createTrackerId(),
            variant: "value-max",
            color: existing?.color ?? OWL_TRACKER_COLORS.HP,
            name: OWL_TRACKER_NAMES.HP,
            showOnMap: true,
            inlineMath: existing?.inlineMath,
            value: hpCurrent,
            max: hpMax,
        }),
        0
    );

    const hpIndex = trackers.findIndex(
        (tracker) => isOwlTrackerValueMax(tracker) && isHpTracker(tracker)
    );

    upsertResourceTracker(
        trackers,
        isMpTracker,
        (existing) => ({
            id: existing?.id ?? createTrackerId(),
            variant: "value-max",
            color: existing?.color ?? OWL_TRACKER_COLORS.MP,
            name: OWL_TRACKER_NAMES.MP,
            showOnMap: mpMax > 0,
            inlineMath: existing?.inlineMath,
            value: mpCurrent,
            max: mpMax,
        }),
        hpIndex >= 0 ? hpIndex + 1 : trackers.length
    );

    item.metadata = {
        ...item.metadata,
        [OWL_TRACKERS_METADATA_KEY]: trackers,
    };
}

export function tokenResourcesMatch(
    left: TokenResourceValues,
    right: TokenResourceValues
): boolean {
    return (
        left.hpCurrent === right.hpCurrent &&
        left.hpMax === right.hpMax &&
        left.mpCurrent === right.mpCurrent &&
        left.mpMax === right.mpMax
    );
}
