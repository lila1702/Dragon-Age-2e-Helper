export interface MeleeAttack {
    id: string;
    name: string;
    attributeAbbreviation: string;
    /** Atributo somado ao dano; vazio = regra padrão (PRE→PER, LUT→FOR). */
    damageAttributeAbbreviation?: string;
    /** Grupo de armas (treinamento, bônus de foco +2 no ataque). */
    weaponGroup?: string;
    damage: string;
}

export interface RangedAttack {
    id: string;
    name: string;
    attributeAbbreviation: string;
    damageAttributeAbbreviation?: string;
    weaponGroup?: string;
    damage: string;
    shortRange?: string;
    longRange?: string;
    reload?: string;
}

export interface ClassAbility {
    id: string;
    name: string;
    description: string;
}

export interface Habilidades {
    meleeAttacks: MeleeAttack[];
    rangedAttacks: RangedAttack[];
    weaponGroups: string;
    /** Guerreira Arcana: ataques com Luta usam Vontade no dano em vez de Força. */
    lutUsesWillpowerForDamage?: boolean;
    /** GM habilita a opção Modo Guerreira Arcana nesta ficha. */
    arcaneWarriorOptionEnabled?: boolean;
    classAbilities: ClassAbility[];
}

export function createHabilidadeId(): string {
    return crypto.randomUUID();
}

export function createEmptyHabilidades(): Habilidades {
    return {
        meleeAttacks: [],
        rangedAttacks: [],
        weaponGroups: "",
        classAbilities: [],
    };
}

export function createEmptyMeleeAttack(): MeleeAttack {
    return {
        id: createHabilidadeId(),
        name: "",
        attributeAbbreviation: "",
        damage: "",
    };
}

export function createEmptyRangedAttack(): RangedAttack {
    return {
        id: createHabilidadeId(),
        name: "",
        attributeAbbreviation: "",
        damage: "",
        shortRange: "",
        longRange: "",
        reload: "",
    };
}

export function createEmptyClassAbility(): ClassAbility {
    return {
        id: createHabilidadeId(),
        name: "",
        description: "",
    };
}
