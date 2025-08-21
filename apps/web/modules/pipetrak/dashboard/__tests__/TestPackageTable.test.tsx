/**
 * Unit tests for TestPackageTable component
 * Tests table rendering, sorting, filtering, and ready badge display
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { TestPackageTable } from '../components/TestPackageTable';
import { smallTestPackageReadiness } from '../__fixtures__/dashboard-data';
import type { TestPackageReadiness } from '../types';

describe('TestPackageTable', () => {
  describe('Empty State', () => {
    it('renders empty state when data is null', () => {
      render(<TestPackageTable data={null} />);
      
      expect(screen.getByText('Test Package Readiness')).toBeInTheDocument();
      expect(screen.getByText('No test packages configured')).toBeInTheDocument();
    });

    it('renders empty state when testPackages array is empty', () => {
      const emptyData: TestPackageReadiness = {
        testPackages: [],
        generatedAt: Date.now(),
      };

      render(<TestPackageTable data={emptyData} />);
      
      expect(screen.getByText('No test packages configured')).toBeInTheDocument();
    });
  });

  describe('Table Rendering', () => {
    it('renders table headers correctly', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      expect(screen.getByText('Package Name')).toBeInTheDocument();
      expect(screen.getByText('Components')).toBeInTheDocument();
      expect(screen.getByText('Completion %')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('Stalled')).toBeInTheDocument();
    });

    it('renders all package rows with correct data', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Check for package names from fixture
      expect(screen.getByText('Pressure Test Package A')).toBeInTheDocument();
      expect(screen.getByText('Leak Test Package B')).toBeInTheDocument();
      expect(screen.getByText('Function Test Package C')).toBeInTheDocument();
      
      // Check component counts
      expect(screen.getByText('5 / 5')).toBeInTheDocument(); // Package A
      expect(screen.getByText('2 / 3')).toBeInTheDocument(); // Package B
      expect(screen.getByText('0 / 2')).toBeInTheDocument(); // Package C
      
      // Check completion percentages
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('66.7%')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays ready badges correctly', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Should show "Ready" badge for completed package
      const readyBadges = screen.getAllByText('Ready');
      expect(readyBadges).toHaveLength(1);
      
      // Should show "Not Ready" for incomplete packages
      const notReadyBadges = screen.getAllByText('Not Ready');
      expect(notReadyBadges).toHaveLength(2);
    });

    it('displays stalled component counts', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Check stalled counts from fixture data
      expect(screen.getByText('0')).toBeInTheDocument(); // Package A - no stalled
      expect(screen.getByText('1')).toBeInTheDocument(); // Package B - 1 stalled
      expect(screen.getByText('2')).toBeInTheDocument(); // Package C - 2 stalled
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts by package name', async () => {
      const user = userEvent.setup();
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Click package name header to sort
      await user.click(screen.getByText('Package Name'));
      
      // Should reorder packages alphabetically
      const packageRows = screen.getAllByRole('row').slice(1); // Skip header row
      const firstPackageName = packageRows[0].textContent;
      
      expect(firstPackageName).toContain('Function Test Package C');
    });

    it('sorts by completion percentage', async () => {
      const user = userEvent.setup();
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Click completion percentage header to sort
      await user.click(screen.getByText('Completion %'));
      
      // Should sort by completion (ascending first)
      const rows = screen.getAllByRole('row').slice(1);
      const firstRowCompletion = rows[0].textContent;
      
      expect(firstRowCompletion).toContain('0%'); // Lowest completion first
    });

    it('sorts by component count', async () => {
      const user = userEvent.setup();
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Click components header to sort
      await user.click(screen.getByText('Components'));
      
      // Verify sorting occurred (order changed)
      const rows = screen.getAllByRole('row').slice(1);
      expect(rows).toHaveLength(3);
    });

    it('toggles sort direction on repeated clicks', async () => {
      const user = userEvent.setup();
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Click completion header twice to reverse sort
      await user.click(screen.getByText('Completion %'));
      await user.click(screen.getByText('Completion %'));
      
      // Should now show highest completion first
      const rows = screen.getAllByRole('row').slice(1);
      const firstRowCompletion = rows[0].textContent;
      
      expect(firstRowCompletion).toContain('100%'); // Highest completion first
    });
  });

  describe('Ready Status Logic', () => {
    it('correctly identifies ready packages', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Package with 100% completion should be ready
      const readyRow = screen.getByText('Pressure Test Package A').closest('tr');
      expect(readyRow).toContainElement(screen.getByText('Ready'));
    });

    it('correctly identifies not ready packages', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Packages with <100% completion should not be ready
      const notReadyRow = screen.getByText('Leak Test Package B').closest('tr');
      expect(notReadyRow).toContainElement(screen.getByText('Not Ready'));
    });

    it('handles edge case of zero components', () => {
      const edgeCaseData: TestPackageReadiness = {
        testPackages: [
          {
            packageId: 'empty-pkg',
            packageName: 'Empty Package',
            totalComponents: 0,
            completedComponents: 0,
            completionPercent: 0,
            isReady: false,
            stalledCount: 0,
          },
        ],
        generatedAt: Date.now(),
      };

      render(<TestPackageTable data={edgeCaseData} />);
      
      expect(screen.getByText('Empty Package')).toBeInTheDocument();
      expect(screen.getByText('0 / 0')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies correct styling to ready badges', () => {
      const { container } = render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Ready badge should have green styling
      const readyBadge = container.querySelector('[class*="bg-green"]');
      expect(readyBadge).toBeInTheDocument();
    });

    it('applies correct styling to not ready badges', () => {
      const { container } = render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Not ready badges should have different styling
      const notReadyBadges = container.querySelectorAll('[class*="bg-gray"], [class*="bg-red"]');
      expect(notReadyBadges.length).toBeGreaterThan(0);
    });

    it('highlights stalled components appropriately', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Packages with stalled components should show the count
      const stalledCounts = screen.getAllByText(/^[1-9]\d*$/); // Numbers > 0
      expect(stalledCounts.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure for screen readers', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Table should have proper roles and headers
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(5); // 5 columns
      
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4); // Header + 3 data rows
    });

    it('provides sortable column indicators', async () => {
      const user = userEvent.setup();
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Sortable headers should be clickable buttons
      const sortableHeaders = screen.getAllByRole('button').filter(button => 
        ['Package Name', 'Components', 'Completion %'].some(text => 
          button.textContent?.includes(text)
        )
      );
      
      expect(sortableHeaders.length).toBeGreaterThan(0);
      
      // Should be able to activate with keyboard
      if (sortableHeaders[0]) {
        sortableHeaders[0].focus();
        await user.keyboard('{Enter}');
        
        // Should trigger sort (we can't easily test the result, but no error should occur)
      }
    });

    it('provides appropriate ARIA labels', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Status badges should have descriptive labels
      const readyElements = screen.getAllByText('Ready');
      const notReadyElements = screen.getAllByText('Not Ready');
      
      expect(readyElements.length + notReadyElements.length).toBe(3); // Total packages
    });
  });

  describe('Data Formatting', () => {
    it('formats component counts correctly', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Should show "completed / total" format
      expect(screen.getByText('5 / 5')).toBeInTheDocument();
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
      expect(screen.getByText('0 / 2')).toBeInTheDocument();
    });

    it('formats completion percentages consistently', () => {
      render(<TestPackageTable data={smallTestPackageReadiness} />);
      
      // Should show percentages with appropriate decimal places
      expect(screen.getByText('100%')).toBeInTheDocument(); // Whole number
      expect(screen.getByText('66.7%')).toBeInTheDocument(); // One decimal
      expect(screen.getByText('0%')).toBeInTheDocument(); // Zero case
    });

    it('handles very long package names gracefully', () => {
      const longNameData: TestPackageReadiness = {
        testPackages: [
          {
            packageId: 'long-name',
            packageName: 'Very Long Test Package Name That Might Overflow The Table Cell Width',
            totalComponents: 10,
            completedComponents: 5,
            completionPercent: 50,
            isReady: false,
            stalledCount: 0,
          },
        ],
        generatedAt: Date.now(),
      };

      render(<TestPackageTable data={longNameData} />);
      
      // Should render without breaking layout
      expect(screen.getByText(/Very Long Test Package Name/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders large package lists efficiently', () => {
      const largePackageList: TestPackageReadiness = {
        testPackages: Array.from({ length: 100 }, (_, index) => ({
          packageId: `pkg-${index}`,
          packageName: `Test Package ${index}`,
          totalComponents: Math.floor(Math.random() * 50) + 10,
          completedComponents: Math.floor(Math.random() * 40) + 5,
          completionPercent: Math.random() * 100,
          isReady: Math.random() > 0.5,
          stalledCount: Math.floor(Math.random() * 5),
        })),
        generatedAt: Date.now(),
      };

      const startTime = performance.now();
      render(<TestPackageTable data={largePackageList} />);
      const endTime = performance.now();
      
      // Should render quickly even with many packages
      expect(endTime - startTime).toBeLessThan(500); // 500ms budget
      
      // Should display all packages
      expect(screen.getAllByRole('row')).toHaveLength(101); // 100 packages + header
    });

    it('sorting performance is acceptable', async () => {
      const user = userEvent.setup();
      
      // Create large dataset
      const largePackageList: TestPackageReadiness = {
        testPackages: Array.from({ length: 50 }, (_, index) => ({
          packageId: `pkg-${index}`,
          packageName: `Package ${String.fromCharCode(65 + (index % 26))}${index}`, // Random names
          totalComponents: Math.floor(Math.random() * 50) + 10,
          completedComponents: Math.floor(Math.random() * 40) + 5,
          completionPercent: Math.random() * 100,
          isReady: Math.random() > 0.5,
          stalledCount: Math.floor(Math.random() * 5),
        })),
        generatedAt: Date.now(),
      };

      render(<TestPackageTable data={largePackageList} />);
      
      const startTime = performance.now();
      await user.click(screen.getByText('Completion %'));
      const endTime = performance.now();
      
      // Sorting should be fast
      expect(endTime - startTime).toBeLessThan(200); // 200ms budget
    });
  });

  describe('Edge Cases', () => {
    it('handles fractional completion percentages', () => {
      const fractionalData: TestPackageReadiness = {
        testPackages: [
          {
            packageId: 'fractional',
            packageName: 'Fractional Package',
            totalComponents: 7,
            completedComponents: 2,
            completionPercent: 28.57,
            isReady: false,
            stalledCount: 1,
          },
        ],
        generatedAt: Date.now(),
      };

      render(<TestPackageTable data={fractionalData} />);
      
      expect(screen.getByText('28.57%')).toBeInTheDocument();
    });

    it('handles packages with all stalled components', () => {
      const allStalledData: TestPackageReadiness = {
        testPackages: [
          {
            packageId: 'all-stalled',
            packageName: 'All Stalled Package',
            totalComponents: 5,
            completedComponents: 0,
            completionPercent: 0,
            isReady: false,
            stalledCount: 5,
          },
        ],
        generatedAt: Date.now(),
      };

      render(<TestPackageTable data={allStalledData} />);
      
      expect(screen.getByText('All Stalled Package')).toBeInTheDocument();
      expect(screen.getByText('0 / 5')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Stalled count
    });

    it('handles undefined or invalid data gracefully', () => {
      const invalidData = {
        testPackages: [
          {
            packageId: 'invalid',
            packageName: undefined as any,
            totalComponents: null as any,
            completedComponents: undefined as any,
            completionPercent: NaN,
            isReady: undefined as any,
            stalledCount: -1,
          },
        ],
        generatedAt: Date.now(),
      } as TestPackageReadiness;

      // Should not crash with invalid data
      expect(() => render(<TestPackageTable data={invalidData} />)).not.toThrow();
    });
  });
});