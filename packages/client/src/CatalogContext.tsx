import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { DEFAULT_RULESET_CATALOG, type RulesetCatalog } from "@dragon-age/domain";

import type { ApiClient } from "./apiClient";

const CatalogContext = createContext<RulesetCatalog>(DEFAULT_RULESET_CATALOG);

export function CatalogProvider({
    api,
    rulesetId,
    children,
}: {
    api: ApiClient | null;
    rulesetId: string | null;
    children: ReactNode;
}) {
    const [catalog, setCatalog] = useState<RulesetCatalog>(DEFAULT_RULESET_CATALOG);

    useEffect(() => {
        if (!api || !rulesetId) {
            setCatalog(DEFAULT_RULESET_CATALOG);
            return;
        }
        let cancelled = false;
        void api.getCatalog(rulesetId).then(
            (value) => {
                if (!cancelled) setCatalog(value);
            },
            () => {
                if (!cancelled) setCatalog(DEFAULT_RULESET_CATALOG);
            }
        );
        return () => {
            cancelled = true;
        };
    }, [api, rulesetId]);

    const value = useMemo(() => catalog, [catalog]);
    return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): RulesetCatalog {
    return useContext(CatalogContext);
}

export function useCatalogSchools(): string[] {
    return useCatalog().schools.map((school) => school.name);
}

export function useCatalogArcanasForSchool(schoolName: string): string[] {
    const catalog = useCatalog();
    const school = catalog.schools.find((entry) => entry.name === schoolName);
    if (!school) return [];
    return catalog.arcanas
        .filter((arcana) => arcana.schoolId === school.id)
        .map((arcana) => arcana.name);
}

export function useCatalogWeaponGroups(): string[] {
    return useCatalog().weaponGroups.map((group) => group.name);
}

export function useCatalogDegrees(): string[] {
    return useCatalog().degrees.map((degree) => degree.name);
}
