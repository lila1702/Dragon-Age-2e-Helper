/**
 * Aceita o ID curto do SDK (`OBR.room.id`) ou a URL completa da sala.
 * Ex.: https://www.owlbear.rodeo/room/pwWxb1KjXUks/Dragon%20Age%20RPG → pwWxb1KjXUks
 */
export function parseOwlbearRoomId(input: string): string {
    const raw = input.trim();
    if (!raw) return "";

    try {
        const url = new URL(raw);
        const parts = url.pathname.split("/").filter(Boolean);
        const roomIndex = parts.findIndex((part) => part.toLowerCase() === "room");
        if (roomIndex >= 0 && parts[roomIndex + 1]) {
            return decodeURIComponent(parts[roomIndex + 1]);
        }
    } catch {
        // não é URL — tratar como ID puro
    }

    const match = raw.match(/owlbear\.rodeo\/room\/([^/?#]+)/i);
    if (match?.[1]) return decodeURIComponent(match[1]);

    return raw.replace(/\/+$/, "");
}
