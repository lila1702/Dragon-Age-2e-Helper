export const RELOAD_ACTION_OPTIONS = [
    "Ação Principal",
    "Ação Menor",
    "Ação Livre",
] as const;

export type ReloadAction = (typeof RELOAD_ACTION_OPTIONS)[number];

export function normalizeReloadAction(value: string | undefined): string {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return "";

    const match = RELOAD_ACTION_OPTIONS.find(
        (option) => option.toLocaleLowerCase("pt-BR") === trimmed.toLocaleLowerCase("pt-BR")
    );
    return match ?? trimmed;
}
