'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import AddModal from '@/components/AddModal';
import ContentView from '@/components/ContentView';
import { FilterParams } from '@/lib/queries';
import { useItems, useCreateItem, useItem, useExtendItem, useDeleteItem } from '@/lib/queries';


export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({ status: 'all', sort: 'created_desc' });

  const { data: items = [], isLoading: listLoading } = useItems(filters);
  const { data: selectedItemDetail, isLoading: itemLoading } = useItem(selectedId);

  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();
  const extendItem = useExtendItem();

  const handleAddSubmit = async (formData: FormData) => {
    toast.promise(
      createItem.mutateAsync(formData),
      {
        loading: 'Creating item...',
        success: (result) => {
          if (result.success) {
            // Select the newly created item
            setSelectedId(result.item.id);
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
    toast.promise(
      extendItem.mutateAsync({ id, minutes }),
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
        defaultDuration={0}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
}
