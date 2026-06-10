export const SELECTION_ERRORS = {
    NONE: null,
    NO_TOKEN: "Selecione um token no mapa para abrir a ficha.",
    MULTIPLE: "Selecione apenas um token por vez.",
} as const;

export type SelectionError = (typeof SELECTION_ERRORS)[keyof typeof SELECTION_ERRORS];
