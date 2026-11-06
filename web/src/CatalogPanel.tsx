import { useCallback, useEffect, useMemo, useState } from "react";

import type { CatalogEntryRecord } from "@dragon-age/client";
import {
    CATALOG_ENTRY_KIND_LABELS,
    CATALOG_ENTRY_KINDS,
    defaultCatalogBody,
    parseTagList,
    type CatalogEntryKind,
} from "@dragon-age/domain";

import { api } from "./api";

interface CatalogPanelProps {
    rulesetId: string;
    canAddToSheet: boolean;
    sheetName?: string | null;
    onAddToSheet: (entry: CatalogEntryRecord) => void;
}

type Draft = {
    kind: CatalogEntryKind;
    name: string;
    summary: string;
    requirementsText: string;
    classTags: string;
    requirementTags: string;
    body: Record<string, unknown>;
};

function emptyDraft(kind: CatalogEntryKind = "item"): Draft {
    return {
        kind,
        name: "",
        summary: "",
        requirementsText: "",
        classTags: "",
        requirementTags: "",
        body: defaultCatalogBody(kind),
    };
}

function entryToDraft(entry: CatalogEntryRecord): Draft {
    return {
        kind: entry.kind,
        name: entry.name,
        summary: entry.summary,
        requirementsText: entry.requirementsText,
        classTags: entry.classTags.join(", "),
        requirementTags: entry.requirementTags.join(", "),
        body: { ...defaultCatalogBody(entry.kind), ...entry.body },
    };
}

export function CatalogPanel({
    rulesetId,
    canAddToSheet,
    sheetName,
    onAddToSheet,
}: CatalogPanelProps) {
    const [entries, setEntries] = useState<CatalogEntryRecord[]>([]);
    const [kindFilter, setKindFilter] = useState<CatalogEntryKind | "all">("all");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<Draft>(() => emptyDraft());
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await api.listCatalogEntries(rulesetId, {
                kind: kindFilter === "all" ? undefined : kindFilter,
            });
            setEntries(list);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao carregar catálogo.");
        } finally {
            setLoading(false);
        }
    }, [rulesetId, kindFilter]);

    useEffect(() => {
        void load();
    }, [load]);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return entries;
        return entries.filter((entry) => {
            const hay = [
                entry.name,
                entry.summary,
                entry.requirementsText,
                ...entry.classTags,
                ...entry.requirementTags,
            ]
                .join(" ")
                .toLowerCase();
            return hay.includes(needle);
        });
    }, [entries, query]);

    const startCreate = () => {
        setEditingId(null);
        setDraft(emptyDraft(kindFilter === "all" ? "item" : kindFilter));
    };

    const startEdit = (entry: CatalogEntryRecord) => {
        setEditingId(entry.id);
        setDraft(entryToDraft(entry));
    };

    const setBodyField = (key: string, value: unknown) => {
        setDraft((prev) => ({ ...prev, body: { ...prev.body, [key]: value } }));
    };

    const setBenefit = (degree: "Novato" | "Experiente" | "Mestre", value: string) => {
        setDraft((prev) => {
            const current =
                prev.body.benefits && typeof prev.body.benefits === "object"
                    ? (prev.body.benefits as Record<string, string>)
                    : {};
            const benefits = {
                Novato: current.Novato ?? "",
                Experiente: current.Experiente ?? "",
                Mestre: current.Mestre ?? "",
                [degree]: value,
            };
            return { ...prev, body: { ...prev.body, benefits } };
        });
    };

    const save = async () => {
        if (!draft.name.trim()) {
            setError("Informe o nome da entrada.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const payload = {
                kind: draft.kind,
                name: draft.name.trim(),
                summary: draft.summary.trim(),
                body: draft.body,
                classTags: parseTagList(draft.classTags),
                requirementTags: parseTagList(draft.requirementTags),
                requirementsText: draft.requirementsText.trim(),
            };
            if (editingId) {
                const updated = await api.updateCatalogEntry(editingId, payload);
                setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
            } else {
                const created = await api.createCatalogEntry(rulesetId, payload);
                setEntries((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
            }
            setEditingId(null);
            setDraft(emptyDraft(draft.kind));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao salvar.");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm("Excluir esta entrada do catálogo?")) return;
        setBusy(true);
        setError(null);
        try {
            await api.deleteCatalogEntry(id);
            setEntries((prev) => prev.filter((entry) => entry.id !== id));
            if (editingId === id) {
                setEditingId(null);
                setDraft(emptyDraft());
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao excluir.");
        } finally {
            setBusy(false);
        }
    };

    const benefits =
        draft.body.benefits && typeof draft.body.benefits === "object"
            ? (draft.body.benefits as Record<string, string>)
            : { Novato: "", Experiente: "", Mestre: "" };

    return (
        <div className="catalog-view">
            <div className="catalog-view__card">
                <header className="catalog-view__banner">
                    <h1 className="catalog-view__title">Catálogo</h1>
                    {canAddToSheet && (
                        <p className="catalog-view__destination">
                            Destino:{" "}
                            <strong>{sheetName?.trim() || "ficha selecionada"}</strong>
                        </p>
                    )}
                </header>

                <p className="catalog-view__lead">
                    Itens, magias, talentos e habilidades reutilizáveis. Tags de classe e
                    requisitos são só exibição. Clique numa ficha na lateral para voltar.
                </p>

                <div className="catalog-panel">
                    <section className="catalog-block">
                        <div className="catalog-block__head">Filtros</div>
                        <div className="catalog-block__body catalog-panel__toolbar">
                            <label className="catalog-field">
                                <span className="catalog-field__label">Tipo</span>
                                <select
                                    value={kindFilter}
                                    onChange={(e) =>
                                        setKindFilter(
                                            e.target.value === "all"
                                                ? "all"
                                                : (e.target.value as CatalogEntryKind)
                                        )
                                    }
                                >
                                    <option value="all">Todos</option>
                                    {CATALOG_ENTRY_KINDS.map((kind) => (
                                        <option key={kind} value={kind}>
                                            {CATALOG_ENTRY_KIND_LABELS[kind]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="catalog-field">
                                <span className="catalog-field__label">Buscar</span>
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Nome, tag…"
                                />
                            </label>
                            <div className="catalog-panel__toolbar-actions">
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={startCreate}
                                    disabled={busy}
                                >
                                    Nova entrada
                                </button>
                            </div>
                        </div>
                    </section>

                    {error && <p className="error-text">{error}</p>}
                    {loading && <p className="hint">Carregando…</p>}

                    <section className="catalog-block catalog-block--list">
                        <div className="catalog-block__head">
                            Entradas
                            <span className="catalog-block__count">{visible.length}</span>
                        </div>
                        <div className="catalog-block__body catalog-panel__list">
                            {visible.map((entry) => (
                                <article
                                    key={entry.id}
                                    className={`catalog-panel__row${
                                        editingId === entry.id ? " is-editing" : ""
                                    }`}
                                >
                                    <div className="catalog-panel__row-head">
                                        <strong>{entry.name}</strong>
                                        <span className="catalog-panel__kind">
                                            {CATALOG_ENTRY_KIND_LABELS[entry.kind]}
                                        </span>
                                    </div>
                                    <div className="catalog-panel__row-main">
                                        {entry.classTags.length > 0 ? (
                                            <span className="hint">
                                                Classes: {entry.classTags.join(", ")}
                                            </span>
                                        ) : null}
                                        {entry.summary ? (
                                            <span className="hint">{entry.summary}</span>
                                        ) : null}
                                        {entry.requirementsText ? (
                                            <span className="hint">
                                                Req.: {entry.requirementsText}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="catalog-panel__row-actions">
                                        {canAddToSheet && (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => onAddToSheet(entry)}
                                            >
                                                + Ficha
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="secondary"
                                            disabled={busy}
                                            onClick={() => startEdit(entry)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            className="secondary"
                                            disabled={busy}
                                            onClick={() => void remove(entry.id)}
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </article>
                            ))}
                            {!loading && visible.length === 0 && (
                                <p className="hint catalog-panel__empty">
                                    Nenhuma entrada neste filtro.
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="catalog-block catalog-block--editor">
                        <div className="catalog-block__head">
                            {editingId ? "Editar entrada" : "Nova entrada"}
                        </div>
                        <div className="catalog-block__body catalog-panel__editor">
                <label className="catalog-field">
                    <span className="catalog-field__label">Tipo</span>
                    <select
                        value={draft.kind}
                        disabled={Boolean(editingId)}
                        onChange={(e) => {
                            const kind = e.target.value as CatalogEntryKind;
                            setDraft((prev) => ({
                                ...prev,
                                kind,
                                body: defaultCatalogBody(kind),
                            }));
                        }}
                    >
                        {CATALOG_ENTRY_KINDS.map((kind) => (
                            <option key={kind} value={kind}>
                                {CATALOG_ENTRY_KIND_LABELS[kind]}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="catalog-field">
                    <span className="catalog-field__label">Nome</span>
                    <input
                        value={draft.name}
                        onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                    />
                </label>
                <label className="catalog-field">
                    <span className="catalog-field__label">Resumo</span>
                    <input
                        value={draft.summary}
                        onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
                    />
                </label>
                <label className="catalog-field">
                    <span className="catalog-field__label">Classes (tags)</span>
                    <input
                        value={draft.classTags}
                        onChange={(e) =>
                            setDraft((prev) => ({ ...prev, classTags: e.target.value }))
                        }
                        placeholder="Mago, Ladino"
                    />
                </label>
                <label className="catalog-field">
                    <span className="catalog-field__label">Requisitos (texto)</span>
                    <input
                        value={draft.requirementsText}
                        onChange={(e) =>
                            setDraft((prev) => ({ ...prev, requirementsText: e.target.value }))
                        }
                    />
                </label>
                <label className="catalog-field">
                    <span className="catalog-field__label">Tags de requisito</span>
                    <input
                        value={draft.requirementTags}
                        onChange={(e) =>
                            setDraft((prev) => ({ ...prev, requirementTags: e.target.value }))
                        }
                        placeholder="nível 3, VON 3"
                    />
                </label>

                {draft.kind === "item" && (
                    <>
                        <label className="catalog-field">
                            <span className="catalog-field__label">Valor de venda</span>
                            <input
                                value={String(draft.body.saleValue ?? "")}
                                onChange={(e) => setBodyField("saleValue", e.target.value)}
                            />
                        </label>
                        <label className="catalog-field catalog-field--wide">
                            <span className="catalog-field__label">Descrição</span>
                            <textarea
                                rows={3}
                                value={String(draft.body.description ?? "")}
                                onChange={(e) => setBodyField("description", e.target.value)}
                            />
                        </label>
                        <label className="catalog-field">
                            <span className="catalog-field__label">Quantidade padrão</span>
                            <input
                                type="number"
                                value={
                                    draft.body.quantity === null
                                        ? ""
                                        : String(draft.body.quantity ?? 1)
                                }
                                onChange={(e) =>
                                    setBodyField(
                                        "quantity",
                                        e.target.value === "" ? null : Number(e.target.value)
                                    )
                                }
                            />
                        </label>
                    </>
                )}

                {draft.kind === "spell" && (
                    <>
                        <label className="catalog-field">
                            <span className="catalog-field__label">Grau</span>
                            <select
                                value={String(draft.body.degree ?? "Novato")}
                                onChange={(e) => setBodyField("degree", e.target.value)}
                            >
                                <option value="Novato">Novato</option>
                                <option value="Experiente">Experiente</option>
                                <option value="Mestre">Mestre</option>
                            </select>
                        </label>
                        <label className="catalog-field">
                            <span className="catalog-field__label">Escola</span>
                            <input
                                value={String(draft.body.school ?? "")}
                                onChange={(e) => setBodyField("school", e.target.value)}
                            />
                        </label>
                        <label className="catalog-field">
                            <span className="catalog-field__label">Arcana</span>
                            <input
                                value={String(draft.body.arcana ?? "")}
                                onChange={(e) => setBodyField("arcana", e.target.value)}
                            />
                        </label>
                        <label className="catalog-field">
                            <span className="catalog-field__label">Custo</span>
                            <input
                                type="number"
                                value={String(draft.body.cost ?? 0)}
                                onChange={(e) => setBodyField("cost", Number(e.target.value))}
                            />
                        </label>
                        <label className="catalog-field">
                            <span className="catalog-field__label">Tempo</span>
                            <input
                                value={String(draft.body.time ?? "")}
                                onChange={(e) => setBodyField("time", e.target.value)}
                            />
                        </label>
                        <label className="catalog-field">
                            <span className="catalog-field__label">ND</span>
                            <input
                                type="number"
                                value={String(draft.body.tn ?? 10)}
                                onChange={(e) => setBodyField("tn", Number(e.target.value))}
                            />
                        </label>
                        <label className="catalog-field">
                            <span className="catalog-field__label">Teste</span>
                            <input
                                value={String(draft.body.test ?? "")}
                                onChange={(e) => setBodyField("test", e.target.value)}
                            />
                        </label>
                        <label className="catalog-field catalog-field--wide">
                            <span className="catalog-field__label">Descrição</span>
                            <textarea
                                rows={3}
                                value={String(draft.body.description ?? "")}
                                onChange={(e) => setBodyField("description", e.target.value)}
                            />
                        </label>
                    </>
                )}

                {draft.kind === "class_ability" && (
                    <label className="catalog-field catalog-field--wide">
                        <span className="catalog-field__label">Descrição</span>
                        <textarea
                            rows={3}
                            value={String(draft.body.description ?? "")}
                            onChange={(e) => setBodyField("description", e.target.value)}
                        />
                    </label>
                )}

                {(draft.kind === "talent" || draft.kind === "class_specialization") && (
                    <>
                        {(["Novato", "Experiente", "Mestre"] as const).map((degree) => (
                            <label key={degree} className="catalog-field catalog-field--wide">
                                <span className="catalog-field__label">{degree}</span>
                                <textarea
                                    rows={2}
                                    value={benefits[degree] ?? ""}
                                    onChange={(e) => setBenefit(degree, e.target.value)}
                                />
                            </label>
                        ))}
                    </>
                )}

                <div className="catalog-panel__editor-actions">
                    <button type="button" onClick={() => void save()} disabled={busy}>
                        {editingId ? "Salvar" : "Criar"}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            className="secondary"
                            disabled={busy}
                            onClick={startCreate}
                        >
                            Cancelar edição
                        </button>
                    )}
                </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
