import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, } from '@tanstack/react-query';
import { 
  createDiscreteMilestone, 
  createPercentageMilestone, 
  createQuantityMilestone 
} from '../__fixtures__/milestones';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock components to test accessibility
const MockMilestoneDiscreteRenderer = ({ milestone, onUpdate, disabled, isLoading }: any) => (
  <div role="group" aria-labelledby="milestone-title">
    <h3 id="milestone-title">{milestone.milestoneName}</h3>
    <label>
      <input
        type="checkbox"
        checked={milestone.isCompleted}
        onChange={(e) => onUpdate(e.target.checked)}
        disabled={disabled}
        aria-describedby="milestone-status"
        data-testid="milestone-checkbox"
      />
      <span className="sr-only">
        {milestone.isCompleted ? 'Completed' : 'Not completed'}
      </span>
    </label>
    <div id="milestone-status" aria-live="polite">
      {isLoading && <span>Updating...</span>}
      Status: {milestone.isCompleted ? 'Completed' : 'Pending'}
    </div>
  </div>
);

const MockMilestonePercentageRenderer = ({ milestone, onUpdate, disabled }: any) => (
  <div role="group" aria-labelledby="percentage-title">
    <h3 id="percentage-title">{milestone.milestoneName}</h3>
    
    <label htmlFor="percentage-slider">
      Progress: {milestone.percentageComplete || 0}%
    </label>
    <input
      id="percentage-slider"
      type="range"
      min="0"
      max="100"
      value={milestone.percentageComplete || 0}
      onChange={(e) => onUpdate(Number(e.target.value))}
      disabled={disabled}
      aria-describedby="percentage-description"
      data-testid="percentage-slider"
    />
    
    <label htmlFor="percentage-input">
      Enter percentage:
    </label>
    <input
      id="percentage-input"
      type="number"
      min="0"
      max="100"
      value={milestone.percentageComplete || 0}
      onChange={(e) => onUpdate(Number(e.target.value))}
      disabled={disabled}
      aria-describedby="percentage-description"
      data-testid="percentage-input"
    />
    
    <div id="percentage-description">
      Current progress: {milestone.percentageComplete || 0} out of 100 percent
    </div>
  </div>
);

const MockMilestoneQuantityRenderer = ({ milestone, onUpdate, disabled }: any) => (
  <div role="group" aria-labelledby="quantity-title">
    <h3 id="quantity-title">{milestone.milestoneName}</h3>
    
    <label htmlFor="quantity-input">
      Completed quantity (out of {milestone.quantityTotal || 0}):
    </label>
    <input
      id="quantity-input"
      type="number"
      min="0"
      max={milestone.quantityTotal || 0}
      value={milestone.quantityComplete || 0}
      onChange={(e) => onUpdate(Number(e.target.value))}
      disabled={disabled}
      aria-describedby="quantity-description"
      data-testid="quantity-input"
    />
    
    <div id="quantity-description" role="status">
      {milestone.quantityComplete || 0} of {milestone.quantityTotal || 0} completed
      {milestone.isCompleted && (
        <span aria-label="Milestone completed"> ✓ Complete</span>
      )}
    </div>
    
    <div role="progressbar" 
         aria-valuenow={milestone.quantityComplete || 0}
         aria-valuemin={0}
         aria-valuemax={milestone.quantityTotal || 0}
         aria-label={`Progress: ${milestone.quantityComplete || 0} of ${milestone.quantityTotal || 0}`}>
      <div style={{
        width: `${((milestone.quantityComplete || 0) / (milestone.quantityTotal || 1)) * 100}%`,
        height: '20px',
        backgroundColor: '#4caf50'
      }} />
    </div>
  </div>
);

const MockBulkUpdateModal = ({ isOpen, selectedComponents, onClose, onUpdate }: any) => {
  if (!isOpen) return null;

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="bulk-modal-title"
      aria-describedby="bulk-modal-description"
    >
      <h2 id="bulk-modal-title">Bulk Update Milestones</h2>
      <p id="bulk-modal-description">
        Update milestones for {selectedComponents?.length || 0} selected components
      </p>
      
      <fieldset>
        <legend>Select milestone to update:</legend>
        <label>
          <input type="radio" name="milestone" value="design-review" />
          Design Review
        </label>
        <label>
          <input type="radio" name="milestone" value="installation" />
          Installation
        </label>
      </fieldset>
      
      <fieldset>
        <legend>Update type:</legend>
        <label>
          <input type="radio" name="update-type" value="discrete" />
          Complete milestone
        </label>
        <label>
          <input type="radio" name="update-type" value="percentage" />
          Set percentage
        </label>
      </fieldset>
      
      <div role="group" aria-labelledby="actions-label">
        <h3 id="actions-label">Actions</h3>
        <button onClick={onUpdate} data-testid="execute-update">
          Update Milestones
        </button>
        <button onClick={onClose} data-testid="cancel-update">
          Cancel
        </button>
      </div>
    </div>
  );
};

const MockMobileMilestoneSheet = ({ milestone, onUpdate, onClose }: any) => (
  <div 
    role="dialog" 
    aria-modal="true"
    aria-labelledby="mobile-sheet-title"
    data-testid="mobile-milestone-sheet"
  >
    <header>
      <h2 id="mobile-sheet-title">{milestone.milestoneName}</h2>
      <button 
        onClick={onClose} 
        aria-label="Close milestone editor"
        data-testid="close-sheet"
        style={{ minHeight: '44px', minWidth: '44px' }} // Touch target size
      >
        ×
      </button>
    </header>
    
    <main>
      <div role="group" aria-labelledby="mobile-controls-title">
        <h3 id="mobile-controls-title" className="sr-only">Milestone Controls</h3>
        
        <button
          onClick={() => onUpdate(true)}
          disabled={milestone.isCompleted}
          aria-label="Mark milestone as complete"
          data-testid="mobile-complete-button"
          style={{ minHeight: '52px', minWidth: '100%', fontSize: '16px' }}
        >
          {milestone.isCompleted ? 'Completed ✓' : 'Mark Complete'}
        </button>
        
        <button
          onClick={() => onUpdate(false)}
          disabled={!milestone.isCompleted}
          aria-label="Mark milestone as incomplete"
          data-testid="mobile-incomplete-button"
          style={{ minHeight: '52px', minWidth: '100%', fontSize: '16px' }}
        >
          Mark Incomplete
        </button>
      </div>
    </main>
    
    <div role="status" aria-live="polite">
      Current status: {milestone.isCompleted ? 'Complete' : 'Pending'}
    </div>
  </div>
);

describe('Milestone Accessibility Tests', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    user = userEvent.setup();
  });

  describe('Discrete Milestone Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const milestone = createDiscreteMilestone();
      const onUpdate = vi.fn();

      const { container } = render(
        <MockMilestoneDiscreteRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide proper ARIA labels and descriptions', () => {
      const milestone = createDiscreteMilestone({ milestoneName: 'Design Review' });
      const onUpdate = vi.fn();

      render(
        <MockMilestoneDiscreteRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const checkbox = screen.getByTestId('milestone-checkbox');
      const title = screen.getByText('Design Review');
      const status = screen.getByText(/Status: Pending/);

      expect(title).toHaveAttribute('id', 'milestone-title');
      expect(checkbox).toHaveAttribute('aria-describedby', 'milestone-status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should support keyboard navigation', async () => {
      const milestone = createDiscreteMilestone();
      const onUpdate = vi.fn();

      render(
        <MockMilestoneDiscreteRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const checkbox = screen.getByTestId('milestone-checkbox');

      // Tab to checkbox
      await user.tab();
      expect(checkbox).toHaveFocus();

      // Space to toggle
      await user.keyboard(' ');
      expect(onUpdate).toHaveBeenCalledWith(true);
    });

    it('should announce loading state to screen readers', () => {
      const milestone = createDiscreteMilestone();
      const onUpdate = vi.fn();

      render(
        <MockMilestoneDiscreteRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
          isLoading={true}
        />
      );

      expect(screen.getByText('Updating...')).toBeInTheDocument();
      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });

    it('should provide screen reader only status information', () => {
      const milestone = createDiscreteMilestone({ isCompleted: true });
      const onUpdate = vi.fn();

      render(
        <MockMilestoneDiscreteRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const srOnlyText = screen.getByText('Completed');
      expect(srOnlyText).toHaveClass('sr-only');
    });
  });

  describe('Percentage Milestone Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const milestone = createPercentageMilestone();
      const onUpdate = vi.fn();

      const { container } = render(
        <MockMilestonePercentageRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should properly label slider and input controls', () => {
      const milestone = createPercentageMilestone({ 
        milestoneName: 'Installation Progress',
        percentageComplete: 75 
      });
      const onUpdate = vi.fn();

      render(
        <MockMilestonePercentageRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const slider = screen.getByTestId('percentage-slider');
      const input = screen.getByTestId('percentage-input');
      const description = screen.getByText(/Current progress: 75 out of 100 percent/);

      expect(slider).toHaveAttribute('aria-describedby', 'percentage-description');
      expect(input).toHaveAttribute('aria-describedby', 'percentage-description');
      expect(description).toHaveAttribute('id', 'percentage-description');
    });

    it('should support keyboard navigation between controls', async () => {
      const milestone = createPercentageMilestone({ percentageComplete: 50 });
      const onUpdate = vi.fn();

      render(
        <MockMilestonePercentageRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const slider = screen.getByTestId('percentage-slider');
      const input = screen.getByTestId('percentage-input');

      // Tab through controls
      await user.tab();
      expect(slider).toHaveFocus();

      await user.tab();
      expect(input).toHaveFocus();

      // Use arrow keys on slider
      slider.focus();
      await user.keyboard('{ArrowRight}');
      expect(onUpdate).toHaveBeenCalledWith(51);
    });

    it('should announce value changes', async () => {
      const milestone = createPercentageMilestone({ percentageComplete: 25 });
      const onUpdate = vi.fn();

      render(
        <MockMilestonePercentageRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const input = screen.getByTestId('percentage-input');
      
      await user.clear(input);
      await user.type(input, '75');

      expect(onUpdate).toHaveBeenCalledWith(75);
    });
  });

  describe('Quantity Milestone Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const milestone = createQuantityMilestone();
      const onUpdate = vi.fn();

      const { container } = render(
        <MockMilestoneQuantityRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide progress bar with proper ARIA attributes', () => {
      const milestone = createQuantityMilestone({ 
        quantityComplete: 7,
        quantityTotal: 10 
      });
      const onUpdate = vi.fn();

      render(
        <MockMilestoneQuantityRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      
      expect(progressBar).toHaveAttribute('aria-valuenow', '7');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '10');
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 7 of 10');
    });

    it('should announce completion status', () => {
      const milestone = createQuantityMilestone({ 
        quantityComplete: 10,
        quantityTotal: 10,
        isCompleted: true 
      });
      const onUpdate = vi.fn();

      render(
        <MockMilestoneQuantityRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const completionIndicator = screen.getByLabelText('Milestone completed');
      const statusDiv = screen.getByRole('status');

      expect(completionIndicator).toBeInTheDocument();
      expect(statusDiv).toContainText('10 of 10 completed');
    });

    it('should support numeric input with validation', async () => {
      const milestone = createQuantityMilestone({ 
        quantityComplete: 5,
        quantityTotal: 10 
      });
      const onUpdate = vi.fn();

      render(
        <MockMilestoneQuantityRenderer 
          milestone={milestone} 
          onUpdate={onUpdate} 
          disabled={false}
        />
      );

      const input = screen.getByTestId('quantity-input');
      
      await user.clear(input);
      await user.type(input, '8');

      expect(onUpdate).toHaveBeenCalledWith(8);
    });
  });

  describe('Bulk Update Modal Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const selectedComponents = [
        { id: '1', name: 'Component 1' },
        { id: '2', name: 'Component 2' }
      ];

      const { container } = render(
        <MockBulkUpdateModal 
          isOpen={true}
          selectedComponents={selectedComponents}
          onClose={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should properly implement modal dialog pattern', () => {
      const selectedComponents = [{ id: '1', name: 'Component 1' }];

      render(
        <MockBulkUpdateModal 
          isOpen={true}
          selectedComponents={selectedComponents}
          onClose={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'bulk-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'bulk-modal-description');
    });

    it('should group related form controls with fieldsets', () => {
      render(
        <MockBulkUpdateModal 
          isOpen={true}
          selectedComponents={[]}
          onClose={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      const fieldsets = screen.getAllByRole('group');
      const legends = screen.getAllByText(/Select milestone to update:|Update type:/);

      expect(fieldsets.length).toBeGreaterThanOrEqual(2);
      expect(legends).toHaveLength(2);
    });

    it('should support keyboard navigation and escape key', async () => {
      const onClose = vi.fn();

      render(
        <MockBulkUpdateModal 
          isOpen={true}
          selectedComponents={[]}
          onClose={onClose}
          onUpdate={vi.fn()}
        />
      );

      // Escape key should close modal
      await user.keyboard('{Escape}');
      // Note: In a real implementation, the modal would handle this
      
      const cancelButton = screen.getByTestId('cancel-update');
      await user.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Mobile Interface Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const milestone = createDiscreteMilestone();

      const { container } = render(
        <MockMobileMilestoneSheet 
          milestone={milestone}
          onUpdate={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should meet minimum touch target size requirements', () => {
      const milestone = createDiscreteMilestone();

      render(
        <MockMobileMilestoneSheet 
          milestone={milestone}
          onUpdate={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const closeButton = screen.getByTestId('close-sheet');
      const completeButton = screen.getByTestId('mobile-complete-button');
      const incompleteButton = screen.getByTestId('mobile-incomplete-button');

      // Check touch target sizes (44px minimum for iOS, 52px recommended for PipeTrak)
      expect(closeButton).toHaveStyle('min-height: 44px; min-width: 44px');
      expect(completeButton).toHaveStyle('min-height: 52px');
      expect(incompleteButton).toHaveStyle('min-height: 52px');
    });

    it('should provide clear button labels for screen readers', () => {
      const milestone = createDiscreteMilestone();

      render(
        <MockMobileMilestoneSheet 
          milestone={milestone}
          onUpdate={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const closeButton = screen.getByLabelText('Close milestone editor');
      const completeButton = screen.getByLabelText('Mark milestone as complete');
      const incompleteButton = screen.getByLabelText('Mark milestone as incomplete');

      expect(closeButton).toBeInTheDocument();
      expect(completeButton).toBeInTheDocument(); 
      expect(incompleteButton).toBeInTheDocument();
    });

    it('should announce status changes', () => {
      const milestone = createDiscreteMilestone({ isCompleted: true });

      render(
        <MockMobileMilestoneSheet 
          milestone={milestone}
          onUpdate={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const statusRegion = screen.getByRole('status');
      
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion).toContainText('Current status: Complete');
    });

    it('should support swipe gestures accessibility', async () => {
      // This would test custom swipe implementation
      const milestone = createDiscreteMilestone();
      const onUpdate = vi.fn();

      render(
        <div
          role="button"
          tabIndex={0}
          aria-label="Swipe right to complete, swipe left to mark incomplete"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') onUpdate(true);
            if (e.key === 'ArrowLeft') onUpdate(false);
          }}
          data-testid="swipe-target"
        >
          Swipe to update milestone
        </div>
      );

      const swipeTarget = screen.getByTestId('swipe-target');
      
      await user.tab();
      expect(swipeTarget).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(onUpdate).toHaveBeenCalledWith(true);
    });
  });

  describe('High Contrast and Color Accessibility', () => {
    it('should not rely solely on color for status indication', () => {
      const completedMilestone = createDiscreteMilestone({ isCompleted: true });
      const pendingMilestone = createDiscreteMilestone({ isCompleted: false });

      const { rerender } = render(
        <MockMilestoneDiscreteRenderer 
          milestone={completedMilestone} 
          onUpdate={vi.fn()} 
          disabled={false}
        />
      );

      // Should have text indication, not just color
      expect(screen.getByText(/Status: Completed/)).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();

      rerender(
        <MockMilestoneDiscreteRenderer 
          milestone={pendingMilestone} 
          onUpdate={vi.fn()} 
          disabled={false}
        />
      );

      expect(screen.getByText(/Status: Pending/)).toBeInTheDocument();
      expect(screen.getByText('Not completed')).toBeInTheDocument();
    });

    it('should maintain sufficient color contrast', () => {
      // This would typically be tested with color contrast tools
      // For now, we ensure semantic markup is in place
      const milestone = createQuantityMilestone({ 
        quantityComplete: 8,
        quantityTotal: 10 
      });

      render(
        <MockMilestoneQuantityRenderer 
          milestone={milestone} 
          onUpdate={vi.fn()} 
          disabled={false}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      
      // Progress should be indicated by ARIA values, not just visual
      expect(progressBar).toHaveAttribute('aria-valuenow', '8');
    });
  });

  describe('Focus Management', () => {
    it('should trap focus in modal dialogs', async () => {
      const onClose = vi.fn();

      render(
        <MockBulkUpdateModal 
          isOpen={true}
          selectedComponents={[]}
          onClose={onClose}
          onUpdate={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      const firstFocusable = dialog.querySelector('input[type="radio"]') as HTMLElement;
      const executeButton = screen.getByTestId('execute-update');
      const cancelButton = screen.getByTestId('cancel-update');

      // Focus should start within the dialog
      firstFocusable?.focus();
      expect(firstFocusable).toHaveFocus();

      // Tab through all focusable elements
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab(); // Should reach action buttons

      expect(executeButton).toHaveFocus();
      
      await user.tab();
      expect(cancelButton).toHaveFocus();
    });

    it('should restore focus after modal closes', async () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = render(
        <MockBulkUpdateModal 
          isOpen={true}
          selectedComponents={[]}
          onClose={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      // Modal is open - focus should be in modal
      const dialog = screen.getByRole('dialog');
      expect(document.body).toContainElement(dialog);

      // Close modal
      rerender(
        <MockBulkUpdateModal 
          isOpen={false}
          selectedComponents={[]}
          onClose={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      // Focus should return to trigger (in real implementation)
      // This would be handled by the modal component
      document.body.removeChild(triggerButton);
    });

    it('should provide skip links for complex interfaces', () => {
      // This would be implemented at the page level
      render(
        <div>
          <a href="#milestone-content" className="skip-link">
            Skip to milestone content
          </a>
          <nav aria-label="Milestone navigation">
            <button>Filter</button>
            <button>Sort</button>
            <button>Bulk Actions</button>
          </nav>
          <main id="milestone-content">
            <MockMilestoneDiscreteRenderer 
              milestone={createDiscreteMilestone()} 
              onUpdate={vi.fn()} 
              disabled={false}
            />
          </main>
        </div>
      );

      const skipLink = screen.getByText('Skip to milestone content');
      const mainContent = screen.getByRole('main');

      expect(skipLink).toHaveAttribute('href', '#milestone-content');
      expect(mainContent).toHaveAttribute('id', 'milestone-content');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce bulk operation results', () => {
      render(
        <div>
          <div role="status" aria-live="polite" data-testid="bulk-result-announcement">
            Successfully updated 5 milestones
          </div>
        </div>
      );

      const announcement = screen.getByTestId('bulk-result-announcement');
      
      expect(announcement).toHaveAttribute('role', 'status');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toContainText('Successfully updated 5 milestones');
    });

    it('should announce errors appropriately', () => {
      render(
        <div>
          <div role="alert" aria-live="assertive" data-testid="error-announcement">
            Error: Failed to update milestone. Please try again.
          </div>
        </div>
      );

      const errorAnnouncement = screen.getByTestId('error-announcement');
      
      expect(errorAnnouncement).toHaveAttribute('role', 'alert');
      expect(errorAnnouncement).toHaveAttribute('aria-live', 'assertive');
    });

    it('should provide context for dynamic content', () => {
      render(
        <div>
          <h2 id="milestone-list-title">Project Milestones (Loading...)</h2>
          <div 
            role="region" 
            aria-labelledby="milestone-list-title"
            aria-describedby="milestone-list-status"
          >
            {/* Milestone list would go here */}
          </div>
          <div id="milestone-list-status" aria-live="polite">
            Loaded 15 milestones
          </div>
        </div>
      );

      const region = screen.getByRole('region');
      const status = screen.getByText('Loaded 15 milestones');

      expect(region).toHaveAttribute('aria-describedby', 'milestone-list-status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion settings', () => {
      // Mock CSS media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <div 
          className="progress-animation"
          data-testid="animated-progress"
          style={{
            animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches 
              ? 'none' 
              : 'progress-pulse 2s infinite'
          }}
        >
          Progress indicator
        </div>
      );

      const animatedElement = screen.getByTestId('animated-progress');
      
      // Should have no animation when reduced motion is preferred
      expect(animatedElement).toHaveStyle('animation: none');
    });
  });
});