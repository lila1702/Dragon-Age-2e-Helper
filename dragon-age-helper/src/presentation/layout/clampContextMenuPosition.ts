const VIEWPORT_PADDING = 4;

export function clampContextMenuPosition(
    x: number,
    y: number,
    width: number,
    height: number,
    viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight
): { left: number; top: number } {
    let left = x;
    let top = y;

    if (left + width + VIEWPORT_PADDING > viewportWidth) {
        left = x - width;
    }

    if (top + height + VIEWPORT_PADDING > viewportHeight) {
        top = y - height;
    }

    left = Math.max(VIEWPORT_PADDING, Math.min(left, viewportWidth - width - VIEWPORT_PADDING));
    top = Math.max(VIEWPORT_PADDING, Math.min(top, viewportHeight - height - VIEWPORT_PADDING));

    return { left, top };
}
