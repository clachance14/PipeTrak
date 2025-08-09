import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockPrefetch = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    pathname: '/app/pipetrak/test-project-id/components',
    query: {},
  }),
  usePathname: () => '/app/pipetrak/test-project-id/components',
  useSearchParams: () => new URLSearchParams(),
}));

// Custom providers wrapper
interface ProvidersProps {
  children: React.ReactNode;
}

function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}

// Custom render function
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, { wrapper: Providers, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, mockPush, mockReplace, mockPrefetch };

// Utility to wait for virtual scrolling
export const waitForVirtualItems = () => 
  new Promise(resolve => setTimeout(resolve, 100));

// Utility to simulate double-tap
export const simulateDoubleTap = (element: HTMLElement) => {
  const touchStart = new TouchEvent('touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [{ clientX: 0, clientY: 0 } as Touch],
  });
  
  const touchEnd = new TouchEvent('touchend', {
    bubbles: true,
    cancelable: true,
  });

  element.dispatchEvent(touchStart);
  element.dispatchEvent(touchEnd);
  element.dispatchEvent(touchStart);
  element.dispatchEvent(touchEnd);
};

// Utility to check touch target size
export const getTouchTargetSize = (element: HTMLElement) => {
  const styles = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  // Consider padding in touch target
  const paddingTop = parseFloat(styles.paddingTop) || 0;
  const paddingBottom = parseFloat(styles.paddingBottom) || 0;
  const paddingLeft = parseFloat(styles.paddingLeft) || 0;
  const paddingRight = parseFloat(styles.paddingRight) || 0;
  
  return {
    width: rect.width || (paddingLeft + paddingRight),
    height: rect.height || (paddingTop + paddingBottom),
  };
};

// Utility for testing keyboard navigation
export const testKeyboardNavigation = async (
  element: HTMLElement,
  key: string,
  expectedFocusId?: string
) => {
  element.focus();
  const keyEvent = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(keyEvent);
  
  if (expectedFocusId) {
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(document.activeElement?.id).toBe(expectedFocusId);
  }
};

// Utility for testing accessibility
export const checkAccessibility = (container: HTMLElement) => {
  // Check for proper ARIA labels
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    expect(
      button.getAttribute('aria-label') || 
      button.textContent?.trim()
    ).toBeTruthy();
  });

  // Check for proper heading hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1]);
    expect(level - lastLevel).toBeLessThanOrEqual(1);
    lastLevel = level;
  });

  // Check for alt text on images
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    expect(img.getAttribute('alt')).toBeTruthy();
  });
};

// Mock data generator for testing
export const generateTestComponents = (count: number) => {
  const components = [];
  for (let i = 0; i < count; i++) {
    components.push({
      id: `component-${i}`,
      projectId: 'test-project',
      componentId: `COMP-${String(i).padStart(4, '0')}`,
      type: ['VALVE', 'PIPE', 'GASKET'][i % 3],
      status: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'][i % 3],
      completionPercent: (i % 3) * 50,
      area: `40${(i % 5) + 1}`,
      system: ['Cooling', 'Process', 'Steam'][i % 3],
      workflowType: 'MILESTONE_DISCRETE',
      drawingNumber: `P-35F${String(Math.floor(i / 10)).padStart(2, '0')}`,
      description: `Test Component ${i}`,
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return components;
};