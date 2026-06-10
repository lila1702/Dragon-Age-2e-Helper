export type SheetTabId = "atributos" | "habilidades" | "talentos" | "magia";

interface SheetTab {
    id: SheetTabId;
    label: string;
    hidden?: boolean;
}

interface SheetTabsProps {
    activeTab: SheetTabId;
    onTabChange: (tab: SheetTabId) => void;
    showMagicTab: boolean;
}

export function SheetTabs({ activeTab, onTabChange, showMagicTab }: SheetTabsProps) {
    const tabs: SheetTab[] = [
        { id: "atributos", label: "Atributos" },
        { id: "habilidades", label: "Habilidades" },
        { id: "talentos", label: "Talentos" },
        { id: "magia", label: "Magia", hidden: !showMagicTab },
    ];

    return (
        <div className="sheet-tabs" role="tablist" aria-label="Seções da ficha">
            {tabs
                .filter((tab) => !tab.hidden)
                .map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`sheet-tabs__tab ${activeTab === tab.id ? "sheet-tabs__tab--active" : ""}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
        </div>
    );
}
