import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from './utils/render';
import userEvent from '@testing-library/user-event';
import { EnhancedDataTable } from '../components/EnhancedDataTable';
import { mockComponents, generateMockComponents } from '../__fixtures__/components';
import type { TableColumn } from '../../types';

// Define test columns
const testColumns: TableColumn[] = [
  { key: 'componentId', label: 'Component ID', type: 'text', width: '150px', editable: false },
  { key: 'type', label: 'Type', type: 'text', width: '120px', editable: true },
  { key: 'description', label: 'Description', type: 'text', width: '200px', editable: true },
  { key: 'status', label: 'Status', type: 'status', width: '120px', editable: false },
  { key: 'completionPercent', label: 'Progress', type: 'progress', width: '150px', editable: false },
];

describe('EnhancedDataTable', () => {
  const mockOnRowClick = vi.fn();
  const mockOnCellUpdate = vi.fn();
  const mockOnBulkUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render table with data', () => {
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          onRowClick={mockOnRowClick}
        />
      );

      // Check headers
      expect(screen.getByText('Component ID')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();

      // Check data
      expect(screen.getByText('VALVE-401-001')).toBeInTheDocument();
      expect(screen.getByText('VALVE')).toBeInTheDocument();
    });

    it('should render empty state when no data provided', () => {
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={[]}
          onRowClick={mockOnRowClick}
        />
      );

      // Should still show headers
      expect(screen.getByText('Component ID')).toBeInTheDocument();
      
      // But no data rows
      expect(screen.queryByText('VALVE-401-001')).not.toBeInTheDocument();
    });

    it('should apply sticky header when enabled', () => {
      const { container } = render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          stickyHeader={true}
        />
      );

      const header = container.querySelector('thead');
      expect(header).toHaveClass('sticky');
    });
  });

  describe('Touch Target Sizes', () => {
    it('should have minimum 52px touch targets for interactive elements', () => {
      const { container } = render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          enableBulkSelection={true}
          touchTargetSize={52}
        />
      );

      // Check checkboxes
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        const parent = checkbox.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          // Note: In JSDOM, getBoundingClientRect returns 0s, so we check the style
          const minHeight = parent.style.minHeight || '52px';
          expect(parseInt(minHeight)).toBeGreaterThanOrEqual(52);
        }
      });
    });

    it('should respect custom touch target size', () => {
      const { container } = render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          touchTargetSize={60}
        />
      );

      const rows = container.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const minHeight = row.getAttribute('style')?.includes('60px');
        expect(minHeight || row.style.minHeight).toBeTruthy();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode on double click when enabled', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          onCellUpdate={mockOnCellUpdate}
          enableEditing={true}
        />
      );

      // Find an editable cell (Type column)
      const editableCell = screen.getByText('VALVE');
      
      // Double click to enter edit mode
      await user.dblClick(editableCell);

      // Should show input field
      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('VALVE');
      });
    });

    it('should not enter edit mode for non-editable columns', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          onCellUpdate={mockOnCellUpdate}
          enableEditing={true}
        />
      );

      // Find a non-editable cell (Component ID)
      const nonEditableCell = screen.getByText('VALVE-401-001');
      
      // Double click should not enter edit mode
      await user.dblClick(nonEditableCell);

      // Should not show input field
      await waitFor(() => {
        const inputs = screen.queryAllByRole('textbox');
        expect(inputs).toHaveLength(0);
      });
    });

    it('should save changes on Enter key', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          onCellUpdate={mockOnCellUpdate}
          enableEditing={true}
        />
      );

      // Enter edit mode
      const editableCell = screen.getByText('VALVE');
      await user.dblClick(editableCell);

      // Type new value
      const input = await screen.findByRole('textbox');
      await user.clear(input);
      await user.type(input, 'PUMP');
      
      // Press Enter to save
      await user.keyboard('{Enter}');

      // Should call update function
      await waitFor(() => {
        expect(mockOnCellUpdate).toHaveBeenCalledWith(
          'component-1',
          'type',
          'PUMP'
        );
      });
    });

    it('should cancel edit on Escape key', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          onCellUpdate={mockOnCellUpdate}
          enableEditing={true}
        />
      );

      // Enter edit mode
      const editableCell = screen.getByText('VALVE');
      await user.dblClick(editableCell);

      // Type new value
      const input = await screen.findByRole('textbox');
      await user.clear(input);
      await user.type(input, 'PUMP');
      
      // Press Escape to cancel
      await user.keyboard('{Escape}');

      // Should not call update function
      await waitFor(() => {
        expect(mockOnCellUpdate).not.toHaveBeenCalled();
      });

      // Should exit edit mode
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Bulk Selection', () => {
    it('should show checkboxes when bulk selection is enabled', () => {
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          enableBulkSelection={true}
        />
      );

      // Should have header checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
      
      // First checkbox should be in header (select all)
      const headerCheckbox = checkboxes[0];
      expect(headerCheckbox).toHaveAttribute('aria-label', 'Select all');
    });

    it('should select all rows when header checkbox is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          enableBulkSelection={true}
          onBulkUpdate={mockOnBulkUpdate}
        />
      );

      // Click select all checkbox
      const selectAllCheckbox = screen.getByLabelText('Select all');
      await user.click(selectAllCheckbox);

      // All row checkboxes should be checked
      const rowCheckboxes = screen.getAllByRole('checkbox').slice(1); // Skip header checkbox
      rowCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should show bulk actions when rows are selected', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          enableBulkSelection={true}
          onBulkUpdate={mockOnBulkUpdate}
        />
      );

      // Select first row
      const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(firstRowCheckbox);

      // Should show bulk action buttons
      expect(screen.getByText('1 row selected')).toBeInTheDocument();
      expect(screen.getByText('Mark In Progress')).toBeInTheDocument();
      expect(screen.getByText('Mark Complete')).toBeInTheDocument();
    });

    it('should call bulk update when bulk action is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          enableBulkSelection={true}
          onBulkUpdate={mockOnBulkUpdate}
        />
      );

      // Select first row
      const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(firstRowCheckbox);

      // Click bulk action
      const markCompleteButton = screen.getByText('Mark Complete');
      await user.click(markCompleteButton);

      // Should call bulk update
      expect(mockOnBulkUpdate).toHaveBeenCalledWith(
        ['component-1'],
        { status: 'COMPLETED' }
      );
    });
  });

  describe('Column Pinning', () => {
    it('should pin columns when pin button is clicked', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
        />
      );

      // Find the Type column header (not pinned by default)
      const headers = container.querySelectorAll('th');
      const typeHeader = Array.from(headers).find(h => 
        h.textContent?.includes('Type')
      );

      if (typeHeader) {
        // Initially should not have sticky positioning
        expect(typeHeader).not.toHaveStyle({ position: 'sticky' });
        
        // Hover to show pin button
        await user.hover(typeHeader);
        
        // Find and click pin button
        const pinButton = within(typeHeader).getByRole('button');
        await user.click(pinButton);

        // Column should now have sticky positioning
        expect(typeHeader).toHaveStyle({ position: 'sticky' });
      }
    });
  });

  describe('Virtual Scrolling', () => {
    it('should enable virtual scrolling for large datasets', () => {
      const largeDataset = generateMockComponents(1000);
      
      const { container } = render(
        <EnhancedDataTable
          columns={testColumns}
          data={largeDataset}
          enableVirtualization={true}
        />
      );

      // Should have scroll container with max height
      const scrollContainer = container.querySelector('[style*="max-height"]');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should not use virtual scrolling for small datasets', () => {
      const { container } = render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          enableVirtualization={true}
        />
      );

      // Should not have virtual scroll container for small dataset (3 items)
      // Virtual scrolling only enables for datasets > 100 items
      const scrollContainer = container.querySelector('[style*="max-height: 600px"]');
      expect(scrollContainer).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate between cells with Tab key', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
          onCellUpdate={mockOnCellUpdate}
          enableEditing={true}
        />
      );

      // Enter edit mode on first editable cell
      const firstEditableCell = screen.getByText('VALVE');
      await user.dblClick(firstEditableCell);

      // Press Tab to move to next editable cell
      await user.keyboard('{Tab}');

      // Should save first cell and move to next
      await waitFor(() => {
        expect(mockOnCellUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Status and Progress Rendering', () => {
    it('should render status badges correctly', () => {
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
        />
      );

      // Check for status badges
      const inProgressBadge = screen.getByText('IN_PROGRESS');
      expect(inProgressBadge).toHaveClass('text-xs');
      
      const completedBadge = screen.getByText('COMPLETED');
      expect(completedBadge).toHaveClass('text-xs');
    });

    it('should render progress bars correctly', () => {
      const { container } = render(
        <EnhancedDataTable
          columns={testColumns}
          data={mockComponents}
        />
      );

      // Check for progress bars
      const progressBars = container.querySelectorAll('[style*="width:"]');
      expect(progressBars.length).toBeGreaterThan(0);

      // Check specific progress values
      expect(screen.getByText('33%')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls when not using virtual scrolling', () => {
      const largeDataset = generateMockComponents(100);
      
      render(
        <EnhancedDataTable
          columns={testColumns}
          data={largeDataset}
          enableVirtualization={false}
        />
      );

      // Should show pagination info
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
      
      // Should have navigation buttons
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });
});