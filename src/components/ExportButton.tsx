'use client';

import { useState } from 'react';
import { useItems } from '@/lib/queries';
import { useTranslations } from 'next-intl';
import { Download, FileJson, FileText } from 'lucide-react';
import { saveAs } from 'file-saver';
import { ItemListView } from '@/lib/types';

export default function ExportButton() {
    const { data: items = [] } = useItems({ status: 'unlocked' });
    const t = useTranslations('Settings');
    const [isExporting, setIsExporting] = useState(false);

    const exportAsJSON = () => {
        setIsExporting(true);
        try {
            const exportData = (items as ItemListView[]).map((item: ItemListView) => ({
                id: item.id,
                type: item.type,
                title: item.metadata?.title || `${item.type} item`,
                created_at: new Date(item.created_at).toISOString(),
                decrypt_at: new Date(item.decrypt_at).toISOString(),
                original_name: item.original_name,
                metadata: item.metadata,
            }));

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const filename = `chaster-export-${new Date().toISOString().split('T')[0]}.json`;
            saveAs(blob, filename);
        } finally {
            setIsExporting(false);
        }
    };

    const exportAsMarkdown = () => {
        setIsExporting(true);
        try {
            let markdown = `# Chaster Export\n\n`;
            markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
            markdown += `Total Unlocked Items: ${items.length}\n\n`;
            markdown += `---\n\n`;

            (items as ItemListView[]).forEach((item: ItemListView, index: number) => {
                const title = item.metadata?.title || `${item.type} Item ${index + 1}`;
                markdown += `## ${title}\n\n`;
                markdown += `- **Type**: ${item.type}\n`;
                markdown += `- **Created**: ${new Date(item.created_at).toLocaleString()}\n`;
                markdown += `- **Unlocked**: ${new Date(item.decrypt_at).toLocaleString()}\n`;
                if (item.original_name) {
                    markdown += `- **File**: ${item.original_name}\n`;
                }
                markdown += `\n---\n\n`;
            });

            const blob = new Blob([markdown], { type: 'text/markdown' });
            const filename = `chaster-export-${new Date().toISOString().split('T')[0]}.md`;
            saveAs(blob, filename);
        } finally {
            setIsExporting(false);
        }
    };

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="glass-card p-6 rounded-2xl border border-border space-y-4">
            <div className="flex items-center gap-3">
                <Download size={20} className="text-primary" />
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Export Data</h3>
                    <p className="text-sm text-muted-foreground">Export {items.length} unlocked items</p>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={exportAsJSON}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <FileJson size={18} />
                    Export JSON
                </button>
                <button
                    onClick={exportAsMarkdown}
                    disabled={isExporting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <FileText size={18} />
                    Export Markdown
                </button>
            </div>
        </div>
    );
}
