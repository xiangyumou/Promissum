import { describe, it, expect } from 'vitest';
import { detectContentType } from '@/lib/types';

describe('detectContentType', () => {
    it('returns text for text-only content', () => {
        const result = detectContentType({ version: 1, text: 'hello', files: [] });
        expect(result).toBe('text');
    });

    it('returns file for generic file without text', () => {
        const result = detectContentType({
            version: 1,
            files: [{ id: '1', name: 'doc.txt', mimeType: 'text/plain', size: 100, fileId: 'f1', data: 'abc' }]
        });
        expect(result).toBe('file');
    });

    it('returns pdf for PDF file', () => {
        const result = detectContentType({
            version: 1,
            files: [{ id: '1', name: 'doc.pdf', mimeType: 'application/pdf', size: 100, fileId: 'f1', data: 'abc' }]
        });
        expect(result).toBe('pdf');
    });

    it('returns image for single image file', () => {
        const result = detectContentType({
            version: 1,
            files: [{ id: '1', name: 'pic.jpg', mimeType: 'image/jpeg', size: 100, fileId: 'f1', data: 'abc' }]
        });
        expect(result).toBe('image');
    });

    it('returns video for video file', () => {
        const result = detectContentType({
            version: 1,
            files: [{ id: '1', name: 'vid.mp4', mimeType: 'video/mp4', size: 100, fileId: 'f1', data: 'abc' }]
        });
        expect(result).toBe('video');
    });

    it('returns audio for audio file', () => {
        const result = detectContentType({
            version: 1,
            files: [{ id: '1', name: 'sound.mp3', mimeType: 'audio/mpeg', size: 100, fileId: 'f1', data: 'abc' }]
        });
        expect(result).toBe('audio');
    });

    it('returns archive for zip file', () => {
        const result = detectContentType({
            version: 1,
            files: [{ id: '1', name: 'files.zip', mimeType: 'application/zip', size: 100, fileId: 'f1', data: 'abc' }]
        });
        expect(result).toBe('archive');
    });

    it('returns mixed for text and files', () => {
        const result = detectContentType({
            version: 1,
            text: 'hello',
            files: [{ id: '1', name: 'doc.pdf', mimeType: 'application/pdf', size: 100, fileId: 'f1', data: 'abc' }]
        });
        expect(result).toBe('mixed');
    });

    it('returns file for multiple files', () => {
        const result = detectContentType({
            version: 1,
            files: [
                { id: '1', name: 'a.pdf', mimeType: 'application/pdf', size: 100, fileId: 'f1', data: 'abc' },
                { id: '2', name: 'b.pdf', mimeType: 'application/pdf', size: 100, fileId: 'f2', data: 'def' }
            ]
        });
        expect(result).toBe('file');
    });

    it('handles empty content gracefully', () => {
        const result = detectContentType({ version: 1, files: [] });
        expect(result).toBe('text'); // Default to text for empty
    });
});
