'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import AddModal from '@/components/AddModal';
import ContentView from '@/components/ContentView';
import { ItemListView } from '@/lib/types';
import { FilterParams } from '@/lib/api-client';

export default function Home() {
  const [items, setItems] = useState<ItemListView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastDuration, setLastDuration] = useState(720);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({ status: 'all' });

  const fetchItems = useCallback(async () => {
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      params.set('sort', 'created_desc');

      const queryString = params.toString();
      const url = `/api/items${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      const data = await response.json();
      setItems(data.items || []);
      setLastDuration(data.lastDuration || 720);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchItems();

    // Refresh items periodically to update unlock status
    const interval = setInterval(fetchItems, 30000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  const handleAddSubmit = async (formData: FormData) => {
    const response = await fetch('/api/items', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      // Prepend new item to show at top (list is sorted DESC)
      setItems((prev) => [data.item, ...prev]);
      setSelectedId(data.item.id);

      // Update last duration
      const newDuration = parseInt(formData.get('durationMinutes') as string);
      setLastDuration(newDuration);
    }
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
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
        onItemUpdated={fetchItems}
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
