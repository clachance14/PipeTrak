# Accessibility Guidelines - Reporting Module

Comprehensive accessibility implementation for PipeTrak's reporting module, ensuring WCAG 2.1 AA compliance and inclusive design for all users.

## Accessibility Principles

### WCAG 2.1 AA Compliance
- **Perceivable**: Information must be presentable in ways users can perceive
- **Operable**: User interface components must be operable
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for various assistive technologies

### Field-Specific Considerations
- **Visual impairments**: High contrast for outdoor viewing conditions
- **Motor impairments**: Large touch targets for gloved hands
- **Cognitive considerations**: Clear information hierarchy and simple navigation
- **Temporary disabilities**: Accounts for injuries common in construction work

### Assistive Technology Support
- Screen readers (JAWS, NVDA, VoiceOver)
- Voice recognition software (Dragon)
- Switch navigation devices
- Keyboard-only navigation
- High contrast displays
- Screen magnification software

---

## Semantic HTML Structure

### Proper Document Outline
```html
<!-- Clear document structure with semantic elements -->
<main role="main" aria-label="Reports Dashboard">
  <header>
    <h1>Progress Summary Report</h1>
    <p>ROC-weighted progress with area and system breakdown</p>
  </header>
  
  <section aria-labelledby="metrics-heading">
    <h2 id="metrics-heading">Project Metrics</h2>
    <!-- Metrics content -->
  </section>
  
  <section aria-labelledby="breakdown-heading">
    <h2 id="breakdown-heading">Area Breakdown</h2>
    <!-- Breakdown content -->
  </section>
</main>
```

### Table Accessibility
```typescript
// apps/web/modules/pipetrak/reports/components/AccessibleDataTable.tsx
import { useTranslations } from 'next-intl';

interface AccessibleDataTableProps {
  data: ComponentData[];
  columns: TableColumn[];
  caption: string;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortConfig?: { column: string; direction: 'asc' | 'desc' };
}

export function AccessibleDataTable({
  data,
  columns,
  caption,
  onSort,
  sortConfig,
}: AccessibleDataTableProps) {
  const t = useTranslations('reports.accessibility');
  
  return (
    <div className="overflow-x-auto">
      <table 
        className="w-full border-collapse border border-gray-300"
        role="table"
        aria-label={caption}
      >
        <caption className="sr-only">
          {caption}. {t('tableInstructions')}
        </caption>
        
        <thead>
          <tr role="row">
            {columns.map((column, index) => (
              <th
                key={column.key}
                role="columnheader"
                scope="col"
                aria-colindex={index + 1}
                aria-sort={
                  sortConfig?.column === column.key
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : column.sortable ? 'none' : undefined
                }
                className="px-4 py-2 bg-muted font-medium text-left border border-gray-300"
              >
                {column.sortable ? (
                  <button
                    className="flex items-center space-x-1 hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1 -mx-2 -my-1"
                    onClick={() => {
                      const direction = 
                        sortConfig?.column === column.key && sortConfig.direction === 'asc'
                          ? 'desc'
                          : 'asc';
                      onSort?.(column.key, direction);
                    }}
                    aria-label={t('sortColumn', { column: column.label })}
                  >
                    <span>{column.label}</span>
                    <SortIcon 
                      direction={sortConfig?.column === column.key ? sortConfig.direction : 'none'}
                      className="h-4 w-4"
                    />
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={row.id}
              role="row"
              aria-rowindex={rowIndex + 2} // +2 for 1-based index and header
              className="hover:bg-muted/30 focus-within:bg-muted/50"
            >
              {columns.map((column, colIndex) => (
                <td
                  key={`${row.id}-${column.key}`}
                  role="cell"
                  aria-colindex={colIndex + 1}
                  className="px-4 py-2 border border-gray-300"
                  {...getCellAttributes(row, column)}
                >
                  {renderCellContent(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getCellAttributes(row: ComponentData, column: TableColumn) {
  const attributes: React.TdHTMLAttributes<HTMLTableCellElement> = {};
  
  // Add describedby for complex cells
  if (column.key === 'progress') {
    attributes['aria-describedby'] = `progress-${row.id}`;
  }
  
  // Add live region for status changes
  if (column.key === 'status') {
    attributes['aria-live'] = 'polite';
  }
  
  return attributes;
}
```

### Form Accessibility
```typescript
// apps/web/modules/pipetrak/reports/components/AccessibleFilterForm.tsx
export function AccessibleFilterForm({ onFiltersChange }: FilterFormProps) {
  const t = useTranslations('reports.components.filters');
  const [announceText, setAnnounceText] = useState('');
  
  const announceFilterChange = (filterCount: number) => {
    setAnnounceText(t('filtersApplied', { count: filterCount }));
    setTimeout(() => setAnnounceText(''), 1000);
  };
  
  return (
    <form 
      role="search" 
      aria-label={t('advancedFilters')}
      className="space-y-4"
    >
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announceText}
      </div>
      
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          {t('filterBy')}
        </legend>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="area-filter">
              {t('area')}
              <span className="text-muted-foreground ml-1">(optional)</span>
            </Label>
            <Select 
              name="area"
              onValueChange={(value) => {
                onFiltersChange({ area: value });
                announceFilterChange(getActiveFilterCount() + (value ? 1 : 0));
              }}
            >
              <SelectTrigger 
                id="area-filter"
                aria-describedby="area-help"
                className="w-full"
              >
                <SelectValue placeholder={t('selectArea')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allAreas')}</SelectItem>
                {areas.map(area => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div id="area-help" className="text-xs text-muted-foreground">
              {t('areaFilterHelp')}
            </div>
          </div>
          
          {/* Additional filter fields */}
        </div>
        
        <div className="flex items-center space-x-2 pt-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => {
              clearAllFilters();
              announceFilterChange(0);
            }}
          >
            {t('clearAll')}
          </Button>
          <Button type="submit">
            {t('applyFilters')}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
```

---

## Screen Reader Support

### Live Regions for Dynamic Content
```typescript
// apps/web/modules/pipetrak/reports/hooks/useScreenReaderAnnouncements.ts
import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

export function useScreenReaderAnnouncements() {
  const [announceText, setAnnounceText] = useState('');
  const t = useTranslations('reports.accessibility');
  
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnounceText(message);
    
    // Clear after screen reader has had time to announce
    const delay = priority === 'assertive' ? 200 : 1000;
    setTimeout(() => setAnnounceText(''), delay);
  }, []);
  
  const announceDataUpdate = useCallback((count: number, type: string) => {
    const message = t('dataUpdated', { count, type });
    announce(message);
  }, [announce, t]);
  
  const announcePageChange = useCallback((page: number, total: number) => {
    const message = t('pageChanged', { page, total });
    announce(message);
  }, [announce, t]);
  
  const announceSelectionChange = useCallback((selectedCount: number, totalCount: number) => {
    const message = selectedCount === 0 
      ? t('selectionCleared')
      : t('selectionChanged', { selected: selectedCount, total: totalCount });
    announce(message);
  }, [announce, t]);
  
  return {
    announceText,
    announce,
    announceDataUpdate,
    announcePageChange,
    announceSelectionChange,
  };
}

// Usage in components
export function AccessibleProgressReport() {
  const { announceText, announceDataUpdate } = useScreenReaderAnnouncements();
  const { data } = useProgressReport();
  
  useEffect(() => {
    if (data) {
      announceDataUpdate(data.totalComponents, 'components');
    }
  }, [data, announceDataUpdate]);
  
  return (
    <div>
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announceText}
      </div>
      
      {/* Report content */}
      <ProgressDashboard data={data} />
    </div>
  );
}
```

### Descriptive Labels and Help Text
```typescript
// apps/web/modules/pipetrak/reports/components/AccessibleChart.tsx
import { useId } from 'react';

interface AccessibleChartProps {
  data: ChartData[];
  title: string;
  description: string;
  type: 'line' | 'bar' | 'area';
}

export function AccessibleChart({
  data,
  title,
  description,
  type,
}: AccessibleChartProps) {
  const chartId = useId();
  const descriptionId = useId();
  const tableId = useId();
  const t = useTranslations('reports.accessibility');
  
  return (
    <div className="space-y-4">
      <div>
        <h3 id={chartId} className="text-lg font-semibold">
          {title}
        </h3>
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      
      {/* Visual chart */}
      <div 
        role="img" 
        aria-labelledby={chartId}
        aria-describedby={`${descriptionId} ${tableId}`}
        className="relative"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            {/* Chart configuration */}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Fallback message for screen readers */}
        <div className="sr-only">
          {t('chartDescription', { type, title })}
          {t('chartDataTable')}
        </div>
      </div>
      
      {/* Data table alternative for screen readers */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded">
          {t('viewChartData')}
        </summary>
        
        <table 
          id={tableId}
          className="mt-2 w-full text-sm border-collapse border border-gray-300"
          role="table"
          aria-label={t('chartDataTableLabel', { title })}
        >
          <thead>
            <tr>
              <th scope="col" className="px-2 py-1 border border-gray-300 bg-muted">
                {t('date')}
              </th>
              <th scope="col" className="px-2 py-1 border border-gray-300 bg-muted">
                {t('value')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((point, index) => (
              <tr key={index}>
                <td className="px-2 py-1 border border-gray-300">
                  {formatDate(point.date)}
                </td>
                <td className="px-2 py-1 border border-gray-300">
                  {point.value}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
```

---

## Keyboard Navigation

### Focus Management
```typescript
// apps/web/modules/pipetrak/reports/hooks/useFocusManagement.ts
import { useRef, useCallback, useEffect } from 'react';

interface FocusableElement {
  element: HTMLElement;
  index: number;
}

export function useFocusManagement(containerRef: React.RefObject<HTMLElement>) {
  const currentFocusIndex = useRef(-1);
  
  const getFocusableElements = useCallback((): FocusableElement[] => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="menuitem"]:not([aria-disabled="true"])',
    ].join(', ');
    
    const elements = Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
    
    return elements
      .filter(el => !el.hidden && el.offsetParent !== null)
      .map((element, index) => ({ element, index }));
  }, [containerRef]);
  
  const focusElement = useCallback((index: number) => {
    const focusableElements = getFocusableElements();
    const targetElement = focusableElements[index];
    
    if (targetElement) {
      targetElement.element.focus();
      currentFocusIndex.current = index;
    }
  }, [getFocusableElements]);
  
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements();
    const nextIndex = (currentFocusIndex.current + 1) % focusableElements.length;
    focusElement(nextIndex);
  }, [focusElement, getFocusableElements]);
  
  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements();
    const prevIndex = 
      currentFocusIndex.current <= 0 
        ? focusableElements.length - 1 
        : currentFocusIndex.current - 1;
    focusElement(prevIndex);
  }, [focusElement, getFocusableElements]);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Tab':
        // Let default tab behavior work, but update our tracking
        setTimeout(() => {
          const focusableElements = getFocusableElements();
          const activeElement = document.activeElement as HTMLElement;
          const currentIndex = focusableElements.findIndex(
            ({ element }) => element === activeElement
          );
          currentFocusIndex.current = currentIndex;
        }, 0);
        break;
        
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusNext();
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusPrevious();
        break;
        
      case 'Home':
        event.preventDefault();
        focusElement(0);
        break;
        
      case 'End':
        event.preventDefault();
        const focusableElements = getFocusableElements();
        focusElement(focusableElements.length - 1);
        break;
    }
  }, [focusNext, focusPrevious, focusElement, getFocusableElements]);
  
  return {
    handleKeyDown,
    focusElement,
    focusNext,
    focusPrevious,
    getFocusableElements,
  };
}

// Usage in components
export function AccessibleReportGrid({ data }: ReportGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { handleKeyDown, focusElement } = useFocusManagement(containerRef);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return (
    <div 
      ref={containerRef}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      role="grid"
      aria-label="Report type selection"
    >
      {data.map((item, index) => (
        <ReportCard
          key={item.id}
          data={item}
          onFocus={() => focusElement(index)}
          tabIndex={index === 0 ? 0 : -1}
        />
      ))}
    </div>
  );
}
```

### Skip Links and Navigation Aids
```typescript
// apps/web/modules/pipetrak/reports/components/AccessibleLayout.tsx
export function AccessibleReportLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('reports.accessibility');
  
  return (
    <>
      {/* Skip links for keyboard users */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
        <a 
          href="#main-content" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-foreground"
        >
          {t('skipToContent')}
        </a>
        <a 
          href="#filter-controls" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded ml-2 focus:outline-none focus:ring-2 focus:ring-primary-foreground"
        >
          {t('skipToFilters')}
        </a>
        <a 
          href="#export-controls" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded ml-2 focus:outline-none focus:ring-2 focus:ring-primary-foreground"
        >
          {t('skipToExport')}
        </a>
      </div>
      
      {/* Breadcrumb navigation */}
      <nav aria-label={t('breadcrumb')} className="mb-4">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <a 
              href="/app" 
              className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              {t('dashboard')}
            </a>
          </li>
          <li className="text-muted-foreground">/</li>
          <li>
            <a 
              href="/app/pipetrak" 
              className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              {t('pipetrak')}
            </a>
          </li>
          <li className="text-muted-foreground">/</li>
          <li>
            <span className="font-medium" aria-current="page">
              {t('reports')}
            </span>
          </li>
        </ol>
      </nav>
      
      {/* Main content area */}
      <main id="main-content" className="focus:outline-none" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
```

---

## Color and Contrast

### High Contrast Mode
```css
/* apps/web/styles/accessibility.css */

/* High contrast mode styles */
@media (prefers-contrast: high) {
  .report-card {
    border: 2px solid;
    background: white;
    color: black;
  }
  
  .report-card:hover {
    background: black;
    color: white;
  }
  
  .progress-bar {
    background: white;
    border: 2px solid black;
  }
  
  .progress-bar-fill {
    background: black;
  }
  
  .chart-line {
    stroke: black;
    stroke-width: 3px;
  }
  
  .chart-grid {
    stroke: black;
    stroke-width: 1px;
  }
}

/* Forced colors mode (Windows High Contrast) */
@media (forced-colors: active) {
  .report-card {
    border: 1px solid ButtonText;
    background: ButtonFace;
    color: ButtonText;
  }
  
  .report-card:hover {
    background: Highlight;
    color: HighlightText;
  }
  
  .progress-bar {
    background: Field;
    border: 1px solid ButtonText;
  }
  
  .progress-bar-fill {
    background: Highlight;
  }
}

/* Ensure sufficient color contrast */
.text-success {
  color: #15803d; /* WCAG AA compliant green */
}

.text-warning {
  color: #a16207; /* WCAG AA compliant yellow */
}

.text-destructive {
  color: #dc2626; /* WCAG AA compliant red */
}

.bg-success {
  background-color: #15803d;
  color: white;
}

.bg-warning {
  background-color: #a16207;
  color: white;
}

.bg-destructive {
  background-color: #dc2626;
  color: white;
}
```

### Color-Blind Accessible Charts
```typescript
// apps/web/modules/pipetrak/reports/lib/accessible-colors.ts

// Color palette optimized for color-blind accessibility
export const accessibleColors = {
  // Primary data series
  blue: '#1f77b4',
  orange: '#ff7f0e', 
  green: '#2ca02c',
  red: '#d62728',
  purple: '#9467bd',
  brown: '#8c564b',
  pink: '#e377c2',
  gray: '#7f7f7f',
  olive: '#bcbd22',
  cyan: '#17becf',
};

// Status colors with patterns as backup
export const statusColors = {
  complete: {
    color: accessibleColors.green,
    pattern: 'solid',
    symbol: '✓',
  },
  inProgress: {
    color: accessibleColors.blue,
    pattern: 'diagonal-lines',
    symbol: '◐',
  },
  blocked: {
    color: accessibleColors.red,
    pattern: 'dots',
    symbol: '✗',
  },
  notStarted: {
    color: accessibleColors.gray,
    pattern: 'none',
    symbol: '○',
  },
};

export function getAccessibleChartConfig() {
  return {
    colors: Object.values(accessibleColors),
    patterns: {
      // SVG patterns for additional differentiation
      diagonalLines: (
        <pattern id="diagonal" patternUnits="userSpaceOnUse" width="4" height="4">
          <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke="currentColor" strokeWidth="1" />
        </pattern>
      ),
      dots: (
        <pattern id="dots" patternUnits="userSpaceOnUse" width="4" height="4">
          <circle cx="2" cy="2" r="1" fill="currentColor" />
        </pattern>
      ),
    },
  };
}
```

---

## Mobile Accessibility

### Touch Target Sizing
```typescript
// apps/web/modules/pipetrak/reports/components/AccessibleMobileCard.tsx
interface AccessibleMobileCardProps {
  title: string;
  description: string;
  value: string;
  onTap: () => void;
  isSelected?: boolean;
}

export function AccessibleMobileCard({
  title,
  description,
  value,
  onTap,
  isSelected = false,
}: AccessibleMobileCardProps) {
  const t = useTranslations('reports.accessibility');
  
  return (
    <button
      className={cn(
        // Minimum 44px touch target
        "min-h-[44px] w-full p-4",
        "flex items-center justify-between",
        "border rounded-lg transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "active:scale-[0.98] transition-transform",
        isSelected 
          ? "border-primary bg-primary/10" 
          : "border-border bg-card hover:bg-muted/50"
      )}
      onClick={onTap}
      aria-pressed={isSelected}
      aria-describedby={`${title.replace(/\s+/g, '-').toLowerCase()}-description`}
    >
      <div className="flex-1 text-left min-w-0">
        <h3 className="font-medium text-base truncate">
          {title}
        </h3>
        <p 
          id={`${title.replace(/\s+/g, '-').toLowerCase()}-description`}
          className="text-sm text-muted-foreground truncate mt-1"
        >
          {description}
        </p>
      </div>
      
      <div className="ml-4 text-right">
        <div className="text-lg font-semibold">
          {value}
        </div>
      </div>
      
      {/* Screen reader feedback */}
      <span className="sr-only">
        {isSelected ? t('selected') : t('tapToSelect')}
      </span>
    </button>
  );
}
```

### Voice Control Support
```typescript
// apps/web/modules/pipetrak/reports/hooks/useVoiceControl.ts
import { useEffect, useCallback } from 'react';

interface VoiceCommand {
  phrase: string;
  action: () => void;
  description: string;
}

export function useVoiceControl(commands: VoiceCommand[]) {
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef<SpeechRecognition | null>(null);
  
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();
    
    recognition.current.continuous = true;
    recognition.current.interimResults = false;
    recognition.current.lang = 'en-US';
    
    recognition.current.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      
      const matchedCommand = commands.find(command => 
        transcript.includes(command.phrase.toLowerCase())
      );
      
      if (matchedCommand) {
        matchedCommand.action();
        // Provide audio feedback
        speakResponse(`Executed ${matchedCommand.description}`);
      }
    };
    
    recognition.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition.current.onend = () => {
      setIsListening(false);
    };
    
    recognition.current.start();
    setIsListening(true);
  }, [commands]);
  
  const stopListening = useCallback(() => {
    if (recognition.current) {
      recognition.current.stop();
    }
    setIsListening(false);
  }, []);
  
  const speakResponse = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, []);
  
  return {
    isListening,
    startListening,
    stopListening,
    speakResponse,
  };
}

// Usage in reports
export function VoiceControlledReportInterface() {
  const { isListening, startListening, stopListening } = useVoiceControl([
    {
      phrase: 'export progress report',
      action: () => exportProgressReport(),
      description: 'progress report export',
    },
    {
      phrase: 'show components',
      action: () => navigateToComponents(),
      description: 'component report navigation',
    },
    {
      phrase: 'refresh data',
      action: () => refreshReportData(),
      description: 'data refresh',
    },
  ]);
  
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={isListening ? "destructive" : "outline"}
        onClick={isListening ? stopListening : startListening}
        aria-label={isListening ? 'Stop voice control' : 'Start voice control'}
      >
        <Mic className={cn("h-4 w-4 mr-2", isListening && "animate-pulse")} />
        {isListening ? 'Stop Listening' : 'Voice Control'}
      </Button>
      
      {isListening && (
        <div className="text-sm text-muted-foreground">
          Say: "export progress report", "show components", or "refresh data"
        </div>
      )}
    </div>
  );
}
```

---

## Testing and Validation

### Automated Accessibility Testing
```typescript
// apps/web/tests/accessibility/reports.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReportsLandingPage } from '../modules/pipetrak/reports/components/landing/ReportsLandingPage';

expect.extend(toHaveNoViolations);

describe('Reports Accessibility', () => {
  it('should have no accessibility violations on landing page', async () => {
    const { container } = render(
      <ReportsLandingPage 
        projectId="test-project"
        organizationId="test-org"
        quickMetrics={mockQuickMetrics}
        userRole="admin"
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper heading structure', () => {
    render(<ReportsLandingPage {...mockProps} />);
    
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Reports');
    
    const h2Elements = screen.getAllByRole('heading', { level: 2 });
    expect(h2Elements.length).toBeGreaterThan(0);
  });
  
  it('should have accessible form labels', () => {
    render(<AdvancedFilterPanel {...mockFilterProps} />);
    
    const areaFilter = screen.getByLabelText(/area/i);
    expect(areaFilter).toBeInTheDocument();
    expect(areaFilter).toHaveAttribute('aria-describedby');
  });
  
  it('should announce data updates to screen readers', async () => {
    render(<ProgressDashboard {...mockProps} />);
    
    const liveRegion = screen.getByLabelText(/updated/i);
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
  
  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<ComponentReportInterface {...mockProps} />);
    
    // Tab through interactive elements
    await user.tab();
    expect(screen.getByRole('button', { name: /filter/i })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('button', { name: /export/i })).toHaveFocus();
  });
});
```

### Manual Testing Checklist
```markdown
# Accessibility Testing Checklist

## Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows) 
- [ ] Test with VoiceOver (macOS)
- [ ] Test with TalkBack (Android)
- [ ] Test with VoiceOver (iOS)

## Keyboard Navigation
- [ ] All interactive elements reachable by keyboard
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps
- [ ] Skip links work correctly
- [ ] Arrow keys work in data tables and grids

## Visual Testing
- [ ] Text has sufficient color contrast (4.5:1 minimum)
- [ ] UI works at 200% zoom
- [ ] UI works at 400% zoom (mobile)
- [ ] High contrast mode support
- [ ] Focus indicators visible in high contrast
- [ ] Charts readable without color

## Motor Accessibility
- [ ] Touch targets minimum 44px
- [ ] No hover-only functionality
- [ ] Reasonable timeouts for interactions
- [ ] Error recovery mechanisms

## Cognitive Accessibility
- [ ] Clear heading hierarchy
- [ ] Consistent navigation patterns
- [ ] Error messages are clear and actionable
- [ ] Help text available where needed
- [ ] Progress indicators for long operations

## Mobile Accessibility
- [ ] Screen reader gestures work
- [ ] Voice control commands recognized
- [ ] Orientation changes handled gracefully
- [ ] Reduced motion preferences respected
```

### Accessibility Monitoring
```typescript
// apps/web/lib/accessibility-monitor.ts
interface AccessibilityError {
  type: 'contrast' | 'aria' | 'focus' | 'structure';
  element: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  timestamp: Date;
}

class AccessibilityMonitor {
  private errors: AccessibilityError[] = [];
  private observer: MutationObserver | null = null;
  
  start() {
    // Monitor DOM changes for accessibility issues
    this.observer = new MutationObserver(this.checkAccessibility.bind(this));
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-*', 'role', 'tabindex'],
    });
    
    // Initial scan
    this.checkAccessibility();
  }
  
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
  
  private checkAccessibility() {
    // Check for missing alt text
    this.checkImages();
    // Check for missing form labels
    this.checkFormLabels();
    // Check focus management
    this.checkFocusManagement();
    // Check color contrast
    this.checkColorContrast();
  }
  
  private checkImages() {
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      this.addError({
        type: 'aria',
        element: img.outerHTML,
        description: 'Image missing alt attribute',
        impact: 'serious',
        timestamp: new Date(),
      });
    });
  }
  
  private checkFormLabels() {
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])'
    );
    
    inputs.forEach(input => {
      const associatedLabel = document.querySelector(`label[for="${input.id}"]`);
      if (!associatedLabel && !input.closest('label')) {
        this.addError({
          type: 'aria',
          element: input.outerHTML,
          description: 'Form input missing label',
          impact: 'critical',
          timestamp: new Date(),
        });
      }
    });
  }
  
  private addError(error: AccessibilityError) {
    this.errors.push(error);
    
    // Report to analytics in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Accessibility Issue:', error);
    }
  }
  
  getErrors(): AccessibilityError[] {
    return [...this.errors];
  }
  
  clearErrors() {
    this.errors = [];
  }
}

// Initialize in development
if (process.env.NODE_ENV === 'development') {
  const monitor = new AccessibilityMonitor();
  monitor.start();
  
  // Expose to window for debugging
  (window as any).accessibilityMonitor = monitor;
}
```

This comprehensive accessibility implementation ensures that PipeTrak's reporting module meets WCAG 2.1 AA standards and provides an inclusive experience for all users, including those with disabilities and users in challenging field environments.
