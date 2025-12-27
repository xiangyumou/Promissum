'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import AddModal from '@/components/AddModal';
import ContentView from '@/components/ContentView';
import { FilterParams } from '@/lib/api-client';
import { useItems, useCreateItem, useItem, useExtendItem, useDeleteItem } from '@/lib/queries';

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastDuration, setLastDuration] = useState(720);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({ status: 'all' });

  // Fetch items with automatic caching and refetching
  const { data: items = [], isLoading: listLoading } = useItems(filters);

  // Fetch selected item detail
  // Note: useItem automatically polls if locked
  const { data: selectedItemDetail, isLoading: itemLoading } = useItem(selectedId);

  // Mutations
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();
  // We need to use extendItem inside the handler because the ID isn't constant
  // Actually, useExtendItem takes an ID. So we can't call it conditionally at top level if ID changes?
  // queries.ts defines: export function useExtendItem(id: string) { ... }
  // This means we need to call it with a specific ID. 
  // But here we might switch IDs.
  // Best practice: component specific hook or pass ID to mutationFn?
  // Checking queries.ts: useExtendItem takes id as argument to the HOOK.
  // This is problematic if we switch items.
  // Ideally useExtendItem should accept ID in mutate.
  // I will check queries.ts again. 
  // If useExtendItem requires ID at hook level, I should use useMutation directly or a modified hook.
  // BUT: selectedId is state. `useExtendItem(selectedId || '')` works if we respect Rules of Hooks (always call it).
  // If selectedId is null, we pass ''. 
  const extendItem = useExtendItem(selectedId || '');

  const handleAddSubmit = async (formData: FormData) => {
    toast.promise(
      createItem.mutateAsync(formData),
      {
        loading: 'Creating item...',
        success: (result) => {
          if (result.success) {
            // Select the newly created item
            setSelectedId(result.item.id);

            // Update last duration
            const newDuration = parseInt(formData.get('durationMinutes') as string);
            if (!isNaN(newDuration)) {
              setLastDuration(newDuration);
            }
          }
          return 'Item created successfully!';
        },
        error: 'Failed to create item',
      }
    );
  };

  const handleDelete = (id: string) => {
    toast.promise(
      deleteItem.mutateAsync(id),
      {
        loading: 'Deleting item...',
        success: () => {
          if (selectedId === id) {
            setSelectedId(null);
          }
          return 'Item deleted';
        },
        error: 'Failed to delete item'
      }
    );
  };

  const handleExtend = (id: string, minutes: number) => {
    // If selectedId is not id (unlikely in this view), this hook might be stale?
    // But ContentView only shows selectedId.
    if (id !== selectedId) return;

    toast.promise(
      extendItem.mutateAsync(minutes),
      {
        loading: 'Extending lock...',
        success: 'Lock extended successfully',
        error: 'Failed to extend lock'
      }
    );
  };

  const handleSelectItem = (id: string) => {
    setSelectedId(id);
    // Close sidebar on mobile after selecting item
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      <Sidebar
        items={items}
        selectedId={selectedId}
        onSelectItem={handleSelectItem}
        onAddClick={() => setShowAddModal(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        isLoading={listLoading}
      />

      <ContentView
        selectedId={selectedId}
        item={selectedItemDetail}
        isLoading={itemLoading}
        onDelete={handleDelete}
        onExtend={handleExtend}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <AddModal
        isOpen={showAddModal}
        defaultDuration={lastDuration}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
}
