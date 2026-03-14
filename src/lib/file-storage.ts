/**
 * File Storage Module
 *
 * Manages file storage in ./data/files directory.
 * Files are stored with their ID as filename, metadata in database.
 */

import { promises as fs } from 'fs';
import { join } from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const FILES_DIR = join(DATA_DIR, 'files');

/**
 * Ensure the files directory exists
 */
async function ensureFilesDir(): Promise<void> {
    try {
        await fs.access(FILES_DIR);
    } catch {
        await fs.mkdir(FILES_DIR, { recursive: true });
    }
}

/**
 * Get file path for a given file ID
 */
export function getFilePath(fileId: string): string {
    return join(FILES_DIR, fileId);
}

/**
 * Save a file to storage
 * @returns The file ID (which is also the filename)
 */
export async function saveFile(buffer: Buffer, fileId?: string): Promise<string> {
    await ensureFilesDir();
    const id = fileId || crypto.randomUUID();
    const filePath = getFilePath(id);
    await fs.writeFile(filePath, buffer);
    return id;
}

/**
 * Read a file from storage
 */
export async function readFile(fileId: string): Promise<Buffer> {
    const filePath = getFilePath(fileId);
    return fs.readFile(filePath);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileId: string): Promise<void> {
    try {
        const filePath = getFilePath(fileId);
        await fs.unlink(filePath);
    } catch {
        // Ignore errors (file may not exist)
    }
}

/**
 * Delete multiple files from storage
 */
export async function deleteFiles(fileIds: string[]): Promise<void> {
    await Promise.all(fileIds.map(id => deleteFile(id)));
}

/**
 * Check if a file exists
 */
export async function fileExists(fileId: string): Promise<boolean> {
    try {
        await fs.access(getFilePath(fileId));
        return true;
    } catch {
        return false;
    }
}
