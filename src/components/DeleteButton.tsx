'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteButtonProps {
    id: string;
    onDelete: (id: string) => void;
}

export function DeleteButton({ id, onDelete }: DeleteButtonProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleClick = () => {
        if (isConfirming) {
            onDelete(id);
            setIsConfirming(false);
        } else {
            setIsConfirming(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setIsConfirming(false), 3000);
        }
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <button
            onClick={handleClick}
            className={cn(
                "btn",
                isConfirming
                    ? "btn-destructive"
                    : "btn-ghost text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            )}
            title={isConfirming ? "确认删除" : "删除"}
        >
            <Trash2 size={16} />
            {isConfirming && (
                <span className="ml-1">确认</span>
            )}
        </button>
    );
}
