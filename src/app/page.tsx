'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AddModal from '@/components/AddModal';
import ContentView from '@/components/ContentView';
import { FilterParams } from '@/lib/api-client';
import { useItems, useCreateItem } from '@/lib/queries';

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastDuration, setLastDuration] = useState(720);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({ status: 'all' });

  // Fetch items with automatic caching and refetching
  const { data: items = [], isLoading: loading } = useItems(filters);

  // Create item mutation
  const createItem = useCreateItem();

  const handleAddSubmit = async (formData: FormData) => {
    try {
      const result = await createItem.mutateAsync(formData);

      if (result.success) {
        // Select the newly created item
        setSelectedId(result.item.id);

        // Update last duration
        const newDuration = parseInt(formData.get('durationMinutes') as string);
        if (!isNaN(newDuration)) {
          setLastDuration(newDuration);
        }
      }
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleDelete = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedId(id);
    // Close sidebar on mobile after selecting item
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

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
      />

      <ContentView
        selectedId={selectedId}
        onDelete={handleDelete}
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
