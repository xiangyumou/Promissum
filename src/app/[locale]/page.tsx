'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/routing';
import Sidebar from '@/components/Sidebar';
import AddModal from '@/components/AddModal';
import ContentView from '@/components/ContentView';
import { FilterParams } from '@/lib/queries';
import { useItems, useCreateItem, useItem, useDeleteItem } from '@/lib/queries';


export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state management
  const selectedId = searchParams.get('id');

  const updateSelectedId = (id: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) {
      params.set('id', id);
    } else {
      params.delete('id');
    }
    // Using replace to keep history clean, similar to previous local state behavior
    router.replace(`${pathname}?${params.toString()}`);
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({ status: 'all', sort: 'created_desc' });

  const { data: items = [], isLoading: listLoading } = useItems(filters);
  const { data: selectedItemDetail, isLoading: itemLoading } = useItem(selectedId);

  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  const handleAddSubmit = async (formData: FormData) => {
    toast.promise(
      createItem.mutateAsync(formData),
      {
        loading: 'Creating item...',
        success: (result) => {
          if (result.success) {
            // Select the newly created item
            updateSelectedId(result.item.id);
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
            updateSelectedId(null);
          }
          return 'Item deleted';
        },
        error: 'Failed to delete item'
      }
    );
  };

  const handleSelectItem = (id: string) => {
    updateSelectedId(id);
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
