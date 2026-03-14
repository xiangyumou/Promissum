'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AddModal from '@/components/AddModal';
import ContentView from '@/components/ContentView';
import { FilterParams, Item } from '@/lib/validation';
import { getItemsAction, getItemAction, createItemAction, deleteItemAction } from '@/app/actions/items';

function HomeContent() {
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
    router.replace(`${pathname}?${params.toString()}`);
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({ status: 'all', sort: 'created_desc' });

  // Data state
  const [items, setItems] = useState<Item[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedItemDetail, setSelectedItemDetail] = useState<Item | undefined>();
  const [itemLoading, setItemLoading] = useState(false);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setListLoading(true);
    const result = await getItemsAction(filters);
    if (result.success) {
      setItems(result.data.items);
    }
    setListLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Fetch selected item
  useEffect(() => {
    if (!selectedId) {
      setSelectedItemDetail(undefined);
      return;
    }
    setItemLoading(true);
    getItemAction(selectedId).then((result) => {
      if (result.success) {
        setSelectedItemDetail(result.data);
      }
      setItemLoading(false);
    });
  }, [selectedId]);

  const handleAddSubmit = async (formData: FormData) => {
    const promise = createItemAction(formData);
    toast.promise(promise, {
      loading: '创建中...',
      success: (result) => {
        if (result.success) {
          updateSelectedId(result.data.id);
          fetchItems();
          return '创建成功！';
        }
        throw new Error(result.error);
      },
      error: (err) => err.message || '创建失败',
    });
  };

  const handleDelete = (id: string) => {
    const promise = deleteItemAction(id);
    toast.promise(promise, {
      loading: '删除中...',
      success: (result) => {
        if (result.success) {
          if (selectedId === id) {
            updateSelectedId(null);
          }
          fetchItems();
          return '已删除';
        }
        throw new Error(result.error);
      },
      error: (err) => err.message || '删除失败',
    });
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

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">加载中...</div>}>
      <HomeContent />
    </Suspense>
  );
}
