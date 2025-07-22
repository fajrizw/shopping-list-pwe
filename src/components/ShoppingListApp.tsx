"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ShoppingCart,
  BarChart3,
  Filter,
  Loader2,
} from "lucide-react";

// Types
interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  category: string;
  completed: boolean;
  created_at: string;
}

interface ItemStats {
  total: number;
  completed: number;
  pending: number;
  byCategory: Record<
    string,
    {
      total: number;
      completed: number;
      pending: number;
    }
  >;
}

type FilterType = "all" | "completed" | "pending";

const api = {
  async getItems(filter?: FilterType): Promise<ShoppingItem[]> {
    const url = filter ? `/api/items?filter=${filter}` : "/api/items";
    const response = await fetch(url);
    const result = await response.json();
    return result.success ? result.data : [];
  },

  async createItem(itemData: {
    name: string;
    quantity: number;
    category: string;
  }): Promise<ShoppingItem | null> {
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    const result = await response.json();
    return result.success ? result.data : null;
  },

  async updateItem(
    id: number,
    updates: Partial<ShoppingItem>
  ): Promise<ShoppingItem | null> {
    const response = await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const result = await response.json();
    return result.success ? result.data : null;
  },

  async deleteItem(id: number): Promise<boolean> {
    const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
    const result = await response.json();
    return result.success;
  },

  async getStats(): Promise<ItemStats | null> {
    const response = await fetch("/api/items/stats");
    const result = await response.json();
    return result.success ? result.data : null;
  },

  async bulkDelete(ids: number[]): Promise<boolean> {
    const response = await fetch("/api/items/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    return result.success;
  },

  async bulkUpdate(
    updates: Array<{ id: number } & Partial<ShoppingItem>>
  ): Promise<ShoppingItem[]> {
    const response = await fetch("/api/items/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    const result = await response.json();
    return result.success ? result.data : [];
  },
};

const ShoppingListApp = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [stats, setStats] = useState<ItemStats | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showStats, setShowStats] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemCategory, setNewItemCategory] = useState("Other");

  const categories = [
    "Food",
    "Drinks",
    "Household",
    "Electronics",
    "Clothing",
    "Health",
    "Other",
  ];

  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.getItems(filter);
      setItems(data);
    } catch (err) {
      setError("Failed to load items");
      console.error("Error loading items:", err);
      const mockItems: ShoppingItem[] = [
        {
          id: 1,
          name: "Apples",
          quantity: 5,
          category: "Food",
          completed: false,
          created_at: "2025-01-20T10:00:00Z",
        },
        {
          id: 2,
          name: "Milk",
          quantity: 2,
          category: "Drinks",
          completed: true,
          created_at: "2025-01-20T10:30:00Z",
        },
      ];
      setItems(mockItems);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
      calculateStatsLocal(items);
    }
  };

  const calculateStatsLocal = (itemList: ShoppingItem[]) => {
    const statsData: ItemStats = {
      total: itemList.length,
      completed: itemList.filter((item) => item.completed).length,
      pending: itemList.filter((item) => !item.completed).length,
      byCategory: {},
    };

    itemList.forEach((item) => {
      if (!statsData.byCategory[item.category]) {
        statsData.byCategory[item.category] = {
          total: 0,
          completed: 0,
          pending: 0,
        };
      }
      statsData.byCategory[item.category].total++;
      if (item.completed) {
        statsData.byCategory[item.category].completed++;
      } else {
        statsData.byCategory[item.category].pending++;
      }
    });

    setStats(statsData);
  };

  useEffect(() => {
    loadItems();
  }, [filter]);

  useEffect(() => {
    if (showStats) {
      loadStats();
    }
  }, [showStats, items]);

  const addItem = async () => {
    if (!newItemName.trim()) return;

    try {
      setLoading(true);
      const newItem = await api.createItem({
        name: newItemName.trim(),
        quantity: newItemQuantity,
        category: newItemCategory,
      });

      if (newItem) {
        setItems((prev) => [newItem, ...prev]);
        setNewItemName("");
        setNewItemQuantity(1);
        setNewItemCategory("Other");
      }
    } catch (err) {
      setError("Failed to add item");
      console.error("Error adding item:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: number, updates: Partial<ShoppingItem>) => {
    try {
      setLoading(true);
      const updatedItem = await api.updateItem(id, updates);

      if (updatedItem) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );
        setEditingItem(null);
      }
    } catch (err) {
      setError("Failed to update item");
      console.error("Error updating item:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: number) => {
    try {
      setLoading(true);
      const success = await api.deleteItem(id);

      if (success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (err) {
      setError("Failed to delete item");
      console.error("Error deleting item:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (id: number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const bulkDelete = async () => {
    try {
      setLoading(true);
      const success = await api.bulkDelete(Array.from(selectedItems));

      if (success) {
        setItems((prev) => prev.filter((item) => !selectedItems.has(item.id)));
        setSelectedItems(new Set());
      }
    } catch (err) {
      setError("Failed to delete items");
      console.error("Error bulk deleting:", err);
    } finally {
      setLoading(false);
    }
  };

  const bulkMarkCompleted = async () => {
    try {
      setLoading(true);
      const updates = Array.from(selectedItems).map((id) => ({
        id,
        completed: true,
      }));

      const updatedItems = await api.bulkUpdate(updates);

      if (updatedItems.length > 0) {
        setItems((prev) =>
          prev.map((item) => {
            const updated = updatedItems.find((u) => u.id === item.id);
            return updated || item;
          })
        );
        setSelectedItems(new Set());
      }
    } catch (err) {
      setError("Failed to mark items as completed");
      console.error("Error bulk updating:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "completed") return item.completed;
    if (filter === "pending") return !item.completed;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-6 rounded-lg from-blue-50 to-indigo-100 text-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShoppingCart className="w-8 h-8 text-foreground-600" />
            <h1 className="text-4xl font-bold text-gray-900">Shopping List</h1>
          </div>
          <p className="text-gray-600">Tugas Web Enterpise</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowStats(!showStats)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 disabled:opacity-50"
          >
            <BarChart3 className="w-4 h-4" />
            {showStats ? "Hide Stats" : "Show Stats"}
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          </button>
        </div>

        {showStats && stats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
                <div className="text-sm text-blue-800">Total Items</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </div>
                <div className="text-sm text-green-800">Completed</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pending}
                </div>
                <div className="text-sm text-orange-800">Pending</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-gray-700">By Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(stats.byCategory).map(
                  ([category, categoryStats]) => (
                    <div key={category} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-900">
                        {category}
                      </div>
                      <div className="text-sm text-gray-600">
                        {categoryStats.total} total, {categoryStats.completed}{" "}
                        done
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Add New Item
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && addItem()}
              disabled={loading}
            />
            <input
              type="number"
              min="1"
              value={newItemQuantity}
              onChange={(e) =>
                setNewItemQuantity(parseInt(e.target.value) || 1)
              }
              className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button
              onClick={addItem}
              disabled={!newItemName.trim() || loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="all">All Items</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {selectedItems.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={bulkMarkCompleted}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark Complete ({selectedItems.size})
              </button>
              <button
                onClick={bulkDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedItems.size})
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Shopping Items ({filteredItems.length})
            </h2>
          </div>

          {loading && items.length === 0 ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-indigo-600" />
              <p className="text-gray-600">Loading items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No items found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                    item.completed ? "bg-green-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                  />

                  {editingItem?.id === item.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editingItem.name}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            name: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        disabled={loading}
                      />
                      <input
                        type="number"
                        min="1"
                        value={editingItem.quantity}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        disabled={loading}
                      />
                      <select
                        value={editingItem.category}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            category: e.target.value,
                          })
                        }
                        className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        disabled={loading}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-lg ${
                            item.completed
                              ? "line-through text-gray-500"
                              : "text-gray-900"
                          }`}
                        >
                          {item.name}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                          {item.quantity}x
                        </span>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                          {item.category}
                        </span>
                        {item.completed && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            ✓ Done
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {editingItem?.id === item.id ? (
                      <>
                        <button
                          onClick={() =>
                            updateItem(item.id, {
                              name: editingItem.name,
                              quantity: editingItem.quantity,
                              category: editingItem.category,
                            })
                          }
                          disabled={loading}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          disabled={loading}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            updateItem(item.id, { completed: !item.completed })
                          }
                          disabled={loading}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            item.completed
                              ? "text-orange-600 hover:bg-orange-100"
                              : "text-green-600 hover:bg-green-100"
                          }`}
                          title={
                            item.completed
                              ? "Mark as pending"
                              : "Mark as completed"
                          }
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingListApp;
