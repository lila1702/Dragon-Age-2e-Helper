declare module "node:path" {
    const path: {
        resolve: (...paths: string[]) => string;
        dirname: (path: string) => string;
    };
    export default path;
    export function resolve(...paths: string[]): string;
    export function dirname(path: string): string;
}

declare module "node:url" {
    export function fileURLToPath(url: string | URL): string;
}
