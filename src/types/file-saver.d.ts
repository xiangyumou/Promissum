declare module 'file-saver' {
    interface FileSaverOptions {
        autoBom?: boolean;
    }
    export function saveAs(data: Blob | string, filename?: string, options?: FileSaverOptions): void;
}
