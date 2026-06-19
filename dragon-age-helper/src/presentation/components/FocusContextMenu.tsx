import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { clampContextMenuPosition } from "../layout/clampContextMenuPosition";

interface FocusContextMenuProps {
    x: number;
    y: number;
    menuRef: React.RefObject<HTMLDivElement | null>;
    children: ReactNode;
}

export function FocusContextMenu({ x, y, menuRef, children }: FocusContextMenuProps) {
    const [position, setPosition] = useState({ left: x, top: y });
    const anchorRef = useRef({ x, y });

    anchorRef.current = { x, y };

    useLayoutEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;

        const { width, height } = menu.getBoundingClientRect();
        const { x: anchorX, y: anchorY } = anchorRef.current;
        setPosition(clampContextMenuPosition(anchorX, anchorY, width, height));
    }, [x, y, menuRef]);

    return (
        <div
            ref={menuRef}
            className="focus-context-menu"
            role="menu"
            style={{
                position: "fixed",
                left: position.left,
                top: position.top,
                zIndex: 1000,
            }}
        >
            {children}
        </div>
    );
}
