interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_WEB_APP_URL?: string;
    readonly VITE_BASE_PATH?: string;
    readonly [key: string]: string | undefined;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
    readonly hot?: {
        readonly accept: (cb?: () => void) => void;
        readonly dispose: (cb: () => void) => void;
    };
}

declare module "*.css" {
    const css: string;
    export default css;
}

declare module "*.svg" {
    const src: string;
    export default src;
}
