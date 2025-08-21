"use client";

import React, { createContext, useContext, useCallback, useRef, useEffect } from "react";

interface KeyboardNavigationContextValue {
  registerFocusable: (id: string, element: HTMLElement, callbacks?: FocusCallbacks) => void;
  unregisterFocusable: (id: string) => void;
  focusNext: () => boolean;
  focusPrevious: () => boolean;
  focusFirst: () => boolean;
  focusLast: () => boolean;
  getCurrentFocus: () => string | null;
  setCurrentFocus: (id: string) => void;
}

interface FocusCallbacks {
  onFocus?: () => void;
  onBlur?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}

interface FocusableElement {
  element: HTMLElement;
  callbacks?: FocusCallbacks;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextValue | null>(null);

interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
  role?: string;
  ariaLabel?: string;
  className?: string;
}

export function KeyboardNavigationProvider({
  children,
  role = "application",
  ariaLabel = "Milestone interface",
  className
}: KeyboardNavigationProviderProps) {
  const focusableElements = useRef<Map<string, FocusableElement>>(new Map());
  const currentFocusId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const registerFocusable = useCallback((id: string, element: HTMLElement, callbacks?: FocusCallbacks) => {
    focusableElements.current.set(id, { element, callbacks });
    
    // Set initial focus if this is the first element
    if (focusableElements.current.size === 1 && !currentFocusId.current) {
      setCurrentFocus(id);
    }
  }, []);

  const unregisterFocusable = useCallback((id: string) => {
    focusableElements.current.delete(id);
    
    // Clear current focus if this element was focused
    if (currentFocusId.current === id) {
      currentFocusId.current = null;
    }
  }, []);

  const getFocusableIds = useCallback(() => {
    return Array.from(focusableElements.current.keys())
      .filter(id => {
        const element = focusableElements.current.get(id)?.element;
        return element && isElementVisible(element) && !isElementDisabled(element);
      })
      .sort((a, b) => {
        const elementA = focusableElements.current.get(a)?.element;
        const elementB = focusableElements.current.get(b)?.element;
        if (!elementA || !elementB) return 0;
        
        // Sort by tab order and DOM position
        const rectA = elementA.getBoundingClientRect();
        const rectB = elementB.getBoundingClientRect();
        
        if (Math.abs(rectA.top - rectB.top) < 5) {
          // Same row - sort by left position
          return rectA.left - rectB.left;
        }
        
        // Different rows - sort by top position
        return rectA.top - rectB.top;
      });
  }, []);

  const setCurrentFocus = useCallback((id: string) => {
    const element = focusableElements.current.get(id)?.element;
    if (!element) return;

    // Blur previous element
    if (currentFocusId.current) {
      const prevElement = focusableElements.current.get(currentFocusId.current)?.element;
      const prevCallbacks = focusableElements.current.get(currentFocusId.current)?.callbacks;
      if (prevElement) {
        prevElement.blur();
        prevCallbacks?.onBlur?.();
      }
    }

    // Focus new element
    currentFocusId.current = id;
    element.focus();
    
    const callbacks = focusableElements.current.get(id)?.callbacks;
    callbacks?.onFocus?.();

    // Announce focus change to screen readers
    announceToScreenReader(`Focused on ${element.getAttribute('aria-label') || element.textContent || 'element'}`);
  }, []);

  const focusNext = useCallback(() => {
    const ids = getFocusableIds();
    if (ids.length === 0) return false;

    const currentIndex = currentFocusId.current ? ids.indexOf(currentFocusId.current) : -1;
    const nextIndex = (currentIndex + 1) % ids.length;
    
    setCurrentFocus(ids[nextIndex]);
    return true;
  }, [getFocusableIds, setCurrentFocus]);

  const focusPrevious = useCallback(() => {
    const ids = getFocusableIds();
    if (ids.length === 0) return false;

    const currentIndex = currentFocusId.current ? ids.indexOf(currentFocusId.current) : -1;
    const prevIndex = currentIndex <= 0 ? ids.length - 1 : currentIndex - 1;
    
    setCurrentFocus(ids[prevIndex]);
    return true;
  }, [getFocusableIds, setCurrentFocus]);

  const focusFirst = useCallback(() => {
    const ids = getFocusableIds();
    if (ids.length === 0) return false;
    
    setCurrentFocus(ids[0]);
    return true;
  }, [getFocusableIds, setCurrentFocus]);

  const focusLast = useCallback(() => {
    const ids = getFocusableIds();
    if (ids.length === 0) return false;
    
    setCurrentFocus(ids[ids.length - 1]);
    return true;
  }, [getFocusableIds, setCurrentFocus]);

  const getCurrentFocus = useCallback(() => {
    return currentFocusId.current;
  }, []);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) return;
      
      const currentId = currentFocusId.current;
      const callbacks = currentId ? focusableElements.current.get(currentId)?.callbacks : null;

      switch (event.key) {
        case 'Tab':
          event.preventDefault();
          if (event.shiftKey) {
            focusPrevious();
          } else {
            focusNext();
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (callbacks?.onArrowUp) {
            callbacks.onArrowUp();
          } else {
            focusPrevious();
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (callbacks?.onArrowDown) {
            callbacks.onArrowDown();
          } else {
            focusNext();
          }
          break;

        case 'ArrowLeft':
          if (callbacks?.onArrowLeft) {
            event.preventDefault();
            callbacks.onArrowLeft();
          }
          break;

        case 'ArrowRight':
          if (callbacks?.onArrowRight) {
            event.preventDefault();
            callbacks.onArrowRight();
          }
          break;

        case 'Home':
          event.preventDefault();
          focusFirst();
          break;

        case 'End':
          event.preventDefault();
          focusLast();
          break;

        case 'Enter':
          if (callbacks?.onEnter) {
            event.preventDefault();
            callbacks.onEnter();
          }
          break;

        case ' ':
          if (callbacks?.onSpace) {
            event.preventDefault();
            callbacks.onSpace();
          }
          break;

        case 'Escape':
          if (callbacks?.onEscape) {
            event.preventDefault();
            callbacks.onEscape();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusNext, focusPrevious, focusFirst, focusLast]);

  const contextValue: KeyboardNavigationContextValue = {
    registerFocusable,
    unregisterFocusable,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    getCurrentFocus,
    setCurrentFocus
  };

  return (
    <KeyboardNavigationContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        role={role}
        aria-label={ariaLabel}
        className={className}
        tabIndex={-1}
      >
        {children}
      </div>
    </KeyboardNavigationContext.Provider>
  );
}

// Hook to use keyboard navigation
export function useKeyboardNavigation() {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
  }
  return context;
}

// Hook for registering focusable elements
export function useFocusable(id: string, callbacks?: FocusCallbacks) {
  const { registerFocusable, unregisterFocusable } = useKeyboardNavigation();
  const elementRef = useRef<HTMLElement>(null);

  const register = useCallback((element: HTMLElement | null) => {
    if (element) {
      elementRef.current = element;
      registerFocusable(id, element, callbacks);
    }
  }, [id, registerFocusable, callbacks]);

  useEffect(() => {
    return () => {
      unregisterFocusable(id);
    };
  }, [id, unregisterFocusable]);

  return { ref: register };
}

// Utility functions
function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    element.offsetParent !== null
  );
}

function isElementDisabled(element: HTMLElement): boolean {
  return element.hasAttribute('disabled') || 
         element.getAttribute('aria-disabled') === 'true' ||
         element.classList.contains('disabled');
}

function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}