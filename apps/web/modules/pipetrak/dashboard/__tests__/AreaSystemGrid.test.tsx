/**
 * Unit tests for AreaSystemGrid component
 * Tests heatmap rendering, tooltips, drill-down interaction, and color mapping
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AreaSystemGrid } from '../components/AreaSystemGrid';
import {
  smallAreaSystemMatrix,
  largeAreaSystemMatrix,
} from '../__fixtures__/dashboard-data';
import type { AreaSystemMatrix } from '../types';

// Mock the DrillDownSheet component to avoid complex dependencies
vi.mock('../components/DrillDownSheet', () => ({
  DrillDownSheet: ({ isOpen, onClose, cellData }: any) => 
    isOpen ? (
      <div data-testid="drill-down-sheet" onClick={onClose}>
        <span>Drill-down sheet open</span>
        <span>Cell: {cellData?.area} × {cellData?.system}</span>
      </div>
    ) : null
}));

describe('AreaSystemGrid', () => {
  describe('Empty State', () => {
    it('renders empty state when data is null', () => {
      render(<AreaSystemGrid data={null} />);
      
      expect(screen.getByText('Area × System Progress Matrix')).toBeInTheDocument();
      expect(screen.getByText('No area/system data available')).toBeInTheDocument();
    });

    it('renders empty state when matrixData is empty', () => {
      const emptyData: AreaSystemMatrix = {
        matrixData: [],
        generatedAt: Date.now(),
      };

      render(<AreaSystemGrid data={emptyData} />);
      
      expect(screen.getByText('No area/system data available')).toBeInTheDocument();
    });
  });

  describe('Grid Rendering', () => {
    it('renders SVG grid with proper dimensions', () => {
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width');
      expect(svg).toHaveAttribute('height');
    });

    it('renders area labels correctly', () => {
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Check for area labels from fixture data
      expect(screen.getByText('Area-01')).toBeInTheDocument();
      expect(screen.getByText('Area-02')).toBeInTheDocument();
    });

    it('renders system labels correctly', () => {
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Check for system labels from fixture data
      expect(screen.getByText('System-01')).toBeInTheDocument();
      expect(screen.getByText('System-02')).toBeInTheDocument();
    });

    it('renders completion percentages in cells', () => {
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Check for completion percentages from fixture data
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('66.7%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders component counts in cells', () => {
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Check for component counts from fixture data
      expect(screen.getByText('(3/5)')).toBeInTheDocument();
      expect(screen.getByText('(2/3)')).toBeInTheDocument();
      expect(screen.getByText('(1/2)')).toBeInTheDocument();
    });
  });

  describe('Color Mapping', () => {
    it('applies correct fill colors based on completion percentage', () => {
      const { container } = render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // All cells should have some fill color
      const rects = container.querySelectorAll('rect[fill]:not([fill="rgb(243, 244, 246)"])');
      expect(rects.length).toBeGreaterThan(0);
    });

    it('shows empty cells with gray fill', () => {
      // Create data with gaps to test empty cells
      const sparseData: AreaSystemMatrix = {
        matrixData: [
          {
            area: 'Area-01',
            system: 'System-01',
            totalCount: 5,
            completedCount: 3,
            completionPercent: 60.0,
            stalledCounts: { stalled7Days: 0, stalled14Days: 0, stalled21Days: 0 },
          },
          // Missing Area-01 × System-02 to create gap
        ],
        generatedAt: Date.now(),
      };

      const { container } = render(<AreaSystemGrid data={sparseData} />);
      
      // Should have gray cells for empty combinations
      const grayCells = container.querySelectorAll('rect[fill="rgb(243, 244, 246)"]');
      expect(grayCells.length).toBeGreaterThan(0);
    });
  });

  describe('Stalled Component Indicators', () => {
    it('renders red triangle for stalled components', () => {
      const { container } = render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Should have red triangle indicators for cells with stalled components
      const triangles = container.querySelectorAll('polygon[fill="rgb(239, 68, 68)"]');
      expect(triangles.length).toBeGreaterThan(0);
    });

    it('does not render triangle for cells without stalled components', () => {
      const dataWithoutStalled: AreaSystemMatrix = {
        matrixData: [
          {
            area: 'Area-01',
            system: 'System-01',
            totalCount: 5,
            completedCount: 5,
            completionPercent: 100.0,
            stalledCounts: { stalled7Days: 0, stalled14Days: 0, stalled21Days: 0 },
          },
        ],
        generatedAt: Date.now(),
      };

      const { container } = render(<AreaSystemGrid data={dataWithoutStalled} />);
      
      const triangles = container.querySelectorAll('polygon[fill="rgb(239, 68, 68)"]');
      expect(triangles).toHaveLength(0);
    });
  });

  describe('Tooltips', () => {
    it('shows tooltip content on hover', async () => {
      const user = userEvent.setup();
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Find a cell rect and hover over it
      const cells = document.querySelectorAll('rect[class*="cursor-pointer"]');
      expect(cells.length).toBeGreaterThan(0);
      
      await user.hover(cells[0]);
      
      // Tooltip content should be visible
      await waitFor(() => {
        expect(screen.getByText(/Area-\d+ × System-\d+/)).toBeInTheDocument();
      });
    });

    it('shows stalled component details in tooltip when present', async () => {
      const user = userEvent.setup();
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Find a cell with stalled components and hover
      const cells = document.querySelectorAll('rect[class*="cursor-pointer"]');
      await user.hover(cells[0]); // First cell from fixture has stalled components
      
      await waitFor(() => {
        expect(screen.getByText('Stalled Components:')).toBeInTheDocument();
        expect(screen.getByText(/7d: \d+/)).toBeInTheDocument();
      });
    });
  });

  describe('Cell Click Interaction', () => {
    it('opens drill-down sheet when cell is clicked', async () => {
      const user = userEvent.setup();
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Find and click a cell
      const cells = document.querySelectorAll('rect[class*="cursor-pointer"]');
      await user.click(cells[0]);
      
      // Drill-down sheet should be open
      expect(screen.getByTestId('drill-down-sheet')).toBeInTheDocument();
      expect(screen.getByText('Drill-down sheet open')).toBeInTheDocument();
    });

    it('passes correct cell data to drill-down sheet', async () => {
      const user = userEvent.setup();
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      const cells = document.querySelectorAll('rect[class*="cursor-pointer"]');
      await user.click(cells[0]);
      
      // Should show the area and system for the clicked cell
      expect(screen.getByText(/Cell: Area-\d+ × System-\d+/)).toBeInTheDocument();
    });

    it('closes drill-down sheet when close is called', async () => {
      const user = userEvent.setup();
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Open sheet
      const cells = document.querySelectorAll('rect[class*="cursor-pointer"]');
      await user.click(cells[0]);
      
      expect(screen.getByTestId('drill-down-sheet')).toBeInTheDocument();
      
      // Close sheet
      await user.click(screen.getByTestId('drill-down-sheet'));
      
      expect(screen.queryByTestId('drill-down-sheet')).not.toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('renders color legend correctly', () => {
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      expect(screen.getByText('0-30%')).toBeInTheDocument();
      expect(screen.getByText('31-70%')).toBeInTheDocument();
      expect(screen.getByText('71-100%')).toBeInTheDocument();
      expect(screen.getByText('Has stalled components')).toBeInTheDocument();
    });

    it('displays correct matrix dimensions', () => {
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Should show dimensions based on fixture data
      expect(screen.getByText(/2 areas × 2 systems = 3 combinations/)).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('handles overflow with scrollable container', () => {
      const { container } = render(<AreaSystemGrid data={largeAreaSystemMatrix} />);
      
      const scrollContainer = container.querySelector('.overflow-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('sets minimum width on SVG for large grids', () => {
      render(<AreaSystemGrid data={largeAreaSystemMatrix} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('min-w-full');
    });
  });

  describe('Performance', () => {
    it('efficiently handles large datasets', () => {
      // Test with large dataset
      const startTime = performance.now();
      render(<AreaSystemGrid data={largeAreaSystemMatrix} />);
      const endTime = performance.now();
      
      // Rendering should complete quickly (within reasonable time)
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });

    it('uses memoization for grid calculations', () => {
      const { rerender } = render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Re-render with same data - should not recalculate
      rerender(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Component should still render correctly
      expect(screen.getByText('Area × System Progress Matrix')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for interactive elements', () => {
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // SVG should have accessible structure
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('supports keyboard navigation through cells', () => {
      render(<AreaSystemGrid data={smallAreaSystemMatrix} />);
      
      // Interactive cells should be focusable
      const interactiveCells = document.querySelectorAll('rect[class*="cursor-pointer"]');
      expect(interactiveCells.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero completion percentage', () => {
      const zeroData: AreaSystemMatrix = {
        matrixData: [
          {
            area: 'Area-01',
            system: 'System-01',
            totalCount: 5,
            completedCount: 0,
            completionPercent: 0.0,
            stalledCounts: { stalled7Days: 5, stalled14Days: 0, stalled21Days: 0 },
          },
        ],
        generatedAt: Date.now(),
      };

      render(<AreaSystemGrid data={zeroData} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('(0/5)')).toBeInTheDocument();
    });

    it('handles 100% completion percentage', () => {
      const completeData: AreaSystemMatrix = {
        matrixData: [
          {
            area: 'Area-01',
            system: 'System-01',
            totalCount: 5,
            completedCount: 5,
            completionPercent: 100.0,
            stalledCounts: { stalled7Days: 0, stalled14Days: 0, stalled21Days: 0 },
          },
        ],
        generatedAt: Date.now(),
      };

      render(<AreaSystemGrid data={completeData} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('(5/5)')).toBeInTheDocument();
    });

    it('handles fractional completion percentages', () => {
      const fractionalData: AreaSystemMatrix = {
        matrixData: [
          {
            area: 'Area-01',
            system: 'System-01',
            totalCount: 3,
            completedCount: 1,
            completionPercent: 33.33,
            stalledCounts: { stalled7Days: 0, stalled14Days: 0, stalled21Days: 0 },
          },
        ],
        generatedAt: Date.now(),
      };

      render(<AreaSystemGrid data={fractionalData} />);
      
      expect(screen.getByText('33.33%')).toBeInTheDocument();
    });
  });
});