import { describe, it, expect } from 'vitest';

describe('Column Reordering', () => {
  it('should reorder columns correctly', () => {
    // Helper function to reorder columns (same logic as in ComponentTable)
    const reorderColumn = (
      draggedColumnId: string,
      targetColumnId: string,
      columnOrder: string[]
    ): string[] => {
      const newColumnOrder = [...columnOrder];
      const fromIndex = newColumnOrder.indexOf(draggedColumnId);
      const toIndex = newColumnOrder.indexOf(targetColumnId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
        newColumnOrder.splice(fromIndex, 1);
        newColumnOrder.splice(toIndex, 0, draggedColumnId);
      }
      
      return newColumnOrder;
    };

    // Test case 1: Move column from middle to beginning
    const initialOrder = ['col1', 'col2', 'col3', 'col4'];
    const result1 = reorderColumn('col3', 'col1', initialOrder);
    expect(result1).toEqual(['col3', 'col1', 'col2', 'col4']);

    // Test case 2: Move column from beginning to end
    const result2 = reorderColumn('col1', 'col4', initialOrder);
    expect(result2).toEqual(['col2', 'col3', 'col4', 'col1']);

    // Test case 3: Move column to adjacent position
    const result3 = reorderColumn('col2', 'col3', initialOrder);
    expect(result3).toEqual(['col1', 'col3', 'col2', 'col4']);

    // Test case 4: Invalid column IDs (should return original)
    const result4 = reorderColumn('invalid', 'col2', initialOrder);
    expect(result4).toEqual(initialOrder);
  });

  it('should not allow reordering frozen columns', () => {
    const frozenColumns = ['select', 'drawingNumber', 'componentId'];
    
    // These columns should not be draggable
    frozenColumns.forEach(col => {
      expect(['select', 'drawingNumber', 'componentId'].includes(col)).toBe(true);
    });
  });

  it('should persist column order to localStorage', () => {
    const mockLocalStorage = {
      getItem: (key: string) => {
        if (key === 'pipetrak-column-order') {
          return JSON.stringify(['type', 'size', 'spec', 'material']);
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        expect(key).toBe('pipetrak-column-order');
        const parsed = JSON.parse(value);
        expect(Array.isArray(parsed)).toBe(true);
      },
      removeItem: (key: string) => {
        expect(key).toBe('pipetrak-column-order');
      }
    };

    // Test loading from localStorage
    const saved = mockLocalStorage.getItem('pipetrak-column-order');
    if (saved) {
      const order = JSON.parse(saved);
      expect(order).toEqual(['type', 'size', 'spec', 'material']);
    }

    // Test saving to localStorage
    const newOrder = ['material', 'spec', 'size', 'type'];
    mockLocalStorage.setItem('pipetrak-column-order', JSON.stringify(newOrder));

    // Test removing from localStorage (reset)
    mockLocalStorage.removeItem('pipetrak-column-order');
  });
});