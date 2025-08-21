# Paint & Insulation UI/UX Requirements Specification

## Overview

This document defines the complete user interface and user experience requirements for Paint and Insulation tracking in PipeTrak. The design emphasizes mobile-first development, role-based interfaces, and efficient workflows for field crews and project managers.

**Design Principles:**
- **Mobile-First**: All interfaces optimized for tablets and smartphones
- **Role-Based**: Different interfaces for different user types and scopes
- **Efficiency-Focused**: Minimize taps/clicks for common operations
- **Visual Clarity**: Clear indicators for scope requirements and progress
- **Offline Capable**: Core functionality works without internet connection

## Design System Integration

### 1. Enhanced Component Library

**New components extending existing shadcn/ui components:**

```typescript
// Enhanced progress indicators for multiple scopes
interface MultiScopeProgressBar {
  scopes: {
    name: 'piping' | 'paint' | 'insulation';
    progress: number; // 0-100
    color: string;
    icon: React.ReactNode;
    required: boolean; // Only show if components require this scope
  }[];
  
  layout: 'stacked' | 'side-by-side' | 'circular';
  showLabels: boolean;
  showPercentages: boolean;
  size: 'sm' | 'md' | 'lg';
}

// Component specification badges
interface SpecificationBadge {
  type: 'paint' | 'insulation';
  specification: string;
  status: 'required' | 'in_progress' | 'complete';
  variant: 'default' | 'outline' | 'secondary';
  onClick?: () => void;
}

// Scope-filtered data tables
interface ScopedComponentTable extends DataTableProps {
  scope: 'all' | 'piping' | 'paint' | 'insulation';
  userRole: SubcontractorRole;
  
  // Enhanced column configuration
  columns: {
    specifications: boolean; // Show paint/insulation spec columns
    progress: 'single' | 'multi'; // Single or multi-scope progress
    actions: ScopeAction[]; // Role-based action buttons
  };
  
  // Mobile optimizations
  mobile: {
    cardView: boolean; // Switch to card view on mobile
    swipeActions: SwipeAction[]; // Swipe-to-action on mobile
    bulkSelect: boolean; // Enable bulk selection mode
  };
}
```

### 2. Color Scheme and Visual Identity

**Scope-specific color coding:**

```css
/* Scope color variables */
:root {
  /* Piping scope - Blue theme (existing) */
  --piping-primary: 214 100% 50%;
  --piping-secondary: 214 50% 90%;
  --piping-accent: 214 80% 60%;
  
  /* Paint scope - Orange theme */
  --paint-primary: 25 100% 50%;
  --paint-secondary: 25 50% 90%;
  --paint-accent: 25 80% 60%;
  
  /* Insulation scope - Green theme */
  --insulation-primary: 142 100% 35%;
  --insulation-secondary: 142 50% 90%;
  --insulation-accent: 142 80% 50%;
  
  /* Neutral/All scopes - Gray theme */
  --neutral-primary: 220 10% 40%;
  --neutral-secondary: 220 5% 95%;
  --neutral-accent: 220 10% 60%;
}

/* Progress indicator styles */
.progress-piping { background: hsl(var(--piping-primary)); }
.progress-paint { background: hsl(var(--paint-primary)); }
.progress-insulation { background: hsl(var(--insulation-primary)); }

/* Badge styles */
.badge-paint-spec { 
  background: hsl(var(--paint-secondary));
  color: hsl(var(--paint-primary));
  border: 1px solid hsl(var(--paint-accent));
}

.badge-insulation-spec { 
  background: hsl(var(--insulation-secondary));
  color: hsl(var(--insulation-primary));
  border: 1px solid hsl(var(--insulation-accent));
}
```

## Desktop Dashboard Layouts

### 1. Multi-Scope Project Dashboard

**Enhanced dashboard showing all scopes with role-based filtering:**

```typescript
interface MultiScopeProjectDashboard {
  // Top-level KPI cards
  kpiCards: {
    overall: {
      title: "Project Progress";
      value: number; // Overall completion percentage
      change: number; // Change from last week
      trend: 'up' | 'down' | 'stable';
    };
    
    byScope: {
      piping: { progress: number; total: number; complete: number; };
      paint: { progress: number; total: number; complete: number; };
      insulation: { progress: number; total: number; complete: number; };
    };
    
    turnover: {
      ready: number; // Components ready for turnover
      total: number; // Total components requiring all scopes
      percentage: number;
    };
  };
  
  // Visual progress section
  progressVisualization: {
    type: 'multi-bar' | 'donut-chart' | 'timeline';
    breakdown: 'area' | 'system' | 'drawing' | 'component-type';
    showTrends: boolean;
    dateRange: DateRange;
  };
  
  // Activity feed
  recentActivity: {
    maxItems: number;
    filters: ('piping' | 'paint' | 'insulation')[];
    showSubcontractors: boolean;
  };
  
  // Quick actions
  quickActions: {
    availableActions: QuickAction[];
    roleRestricted: boolean; // Hide unavailable actions based on user role
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  scope: 'piping' | 'paint' | 'insulation' | 'all';
  action: 'bulk-update' | 'assign-work' | 'export-data' | 'generate-report';
  requiresSelection?: boolean;
}
```

### 2. Scope-Specific Workbench

**Dedicated interface for each scope with optimized workflows:**

```typescript
interface ScopeWorkbench {
  scope: 'paint' | 'insulation';
  
  // Header with scope branding
  header: {
    title: string; // "Paint Workbench" | "Insulation Workbench"
    scopeColor: string;
    subcontractor?: string; // Current subcontractor company
    activeProjects: number;
  };
  
  // Work queue management
  workQueue: {
    // Component lists
    notStarted: ComponentSummary[];
    inProgress: ComponentSummary[];
    pendingHandoff: ComponentSummary[]; // Waiting for piping completion
    completed: ComponentSummary[];
    
    // Queue management
    sortOptions: ('priority' | 'due-date' | 'location' | 'size')[];
    filterOptions: ComponentFilter[];
    bulkActions: BulkAction[];
  };
  
  // Progress tracking panel
  progressPanel: {
    // Current component being worked on
    activeComponent?: ComponentDetail;
    
    // Progress update interface
    progressUpdate: {
      milestoneButtons: MilestoneButton[];
      requiresConfirmation: boolean;
      allowsNotes: boolean;
      supportsPhotos: boolean;
    };
    
    // Time tracking (optional)
    timeTracking?: {
      startTime: Date;
      elapsed: number; // minutes
      estimatedRemaining: number;
    };
  };
  
  // Performance metrics sidebar
  metrics: {
    todayStats: DailyStats;
    weeklyTrend: TrendData[];
    personalBest: PersonalRecord[];
  };
}

interface ComponentSummary {
  id: string;
  displayId: string;
  description: string;
  location: {
    area: string;
    system: string;
    drawing?: string;
  };
  
  specification: {
    code: string;
    description?: string;
  };
  
  progress: {
    currentStage: string;
    percentage: number;
    nextAction: string;
  };
  
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedTime: number; // minutes
  assignedTo?: string;
  dueDate?: Date;
  
  // Visual indicators
  indicators: {
    isUrgent: boolean;
    isOverdue: boolean;
    hasIssues: boolean;
    requiresAttention: boolean;
  };
}
```

### 3. Component Detail Modal

**Enhanced component detail view with multi-scope information:**

```typescript
interface ComponentDetailModal {
  component: ComponentDetail;
  
  // Tabbed interface for different scopes
  tabs: {
    overview: ComponentOverviewTab;
    piping: PipingProgressTab;
    paint?: PaintProgressTab; // Only if component has paint spec
    insulation?: InsulationProgressTab; // Only if component has insulation spec
    history: ComponentHistoryTab;
  };
  
  // Action bar
  actionBar: {
    actions: ComponentAction[];
    bulkMode: boolean; // If multiple components selected
  };
  
  // Quick info sidebar
  sidebar: {
    specifications: SpecificationInfo[];
    location: LocationInfo;
    assignments: AssignmentInfo[];
    dependencies: DependencyInfo[];
  };
}

interface ComponentOverviewTab {
  // Basic component information
  identification: {
    displayId: string;
    businessId: string;
    type: ComponentType;
    description: string;
  };
  
  // Physical details
  physical: {
    size?: string;
    material?: string;
    pressureRating?: string;
    location: LocationHierarchy;
  };
  
  // Specifications (prominent display)
  specifications: {
    paint?: SpecificationDetail;
    insulation?: SpecificationDetail;
  };
  
  // Overall status summary
  status: {
    overall: 'not-started' | 'in-progress' | 'complete';
    piping: ProgressSummary;
    paint?: ProgressSummary;
    insulation?: ProgressSummary;
    readyForTurnover: boolean;
  };
}

interface PaintProgressTab {
  // Current status
  status: {
    stage: 'not-started' | 'primer' | 'finish-coat' | 'complete';
    percentage: number;
    estimatedCompletion: Date;
  };
  
  // Milestone tracking
  milestones: {
    primer: MilestoneStatus;
    finishCoat: MilestoneStatus;
  };
  
  // Work details
  work: {
    specification: SpecificationDetail;
    subcontractor: SubcontractorInfo;
    assignedCrew: CrewInfo;
    workOrder?: string;
    specialInstructions?: string;
  };
  
  // Quality control
  quality: {
    inspectionRequired: boolean;
    inspectionPassed: boolean;
    inspector?: string;
    inspectionDate?: Date;
    notes?: string;
  };
  
  // Progress update interface
  updateInterface: {
    canUpdate: boolean; // Based on user permissions
    updateForm: ProgressUpdateForm;
  };
}

interface MilestoneStatus {
  isComplete: boolean;
  completedAt?: Date;
  completedBy?: string;
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  notes?: string;
  photos?: string[]; // URLs to photos
}
```

## Mobile Interface Design

### 1. Mobile Navigation Structure

**Bottom navigation with scope-aware design:**

```typescript
interface MobileNavigation {
  // Bottom tab bar
  tabs: {
    dashboard: {
      icon: 'home';
      label: 'Dashboard';
      badge?: number; // Notifications count
    };
    
    workQueue: {
      icon: 'checklist';
      label: 'Work Queue';
      badge?: number; // Pending items
      scopeFiltered: boolean; // Show only user's scope
    };
    
    scanner: {
      icon: 'qr-code';
      label: 'Scan';
      alwaysVisible: boolean; // Always show for field crews
    };
    
    progress: {
      icon: 'progress-check';
      label: 'Progress';
      scopeColored: boolean; // Color based on user's primary scope
    };
    
    profile: {
      icon: 'user';
      label: 'Profile';
      badge?: number; // Notifications
    };
  };
  
  // Top app bar (contextual)
  appBar: {
    title: string; // Contextual title based on current view
    actions: MobileAction[];
    searchEnabled: boolean;
    filterEnabled: boolean;
  };
  
  // Floating action button
  fab?: {
    icon: React.ReactNode;
    action: 'quick-update' | 'bulk-select' | 'add-component';
    contextual: boolean; // Changes based on current screen
  };
}
```

### 2. Mobile Dashboard Design

**Touch-optimized dashboard with gesture support:**

```typescript
interface MobileDashboard {
  // Hero cards (swipeable)
  heroCards: {
    cards: HeroCard[];
    swipeable: boolean;
    autoRotate: boolean;
    indicators: boolean; // Dot indicators for pagination
  };
  
  // Quick stats grid
  quickStats: {
    layout: 'grid-2x2' | 'horizontal-scroll';
    stats: QuickStat[];
  };
  
  // Recent activity feed
  activityFeed: {
    items: ActivityItem[];
    showMore: boolean;
    pullToRefresh: boolean;
    infiniteScroll: boolean;
  };
  
  // Quick actions
  quickActions: {
    actions: MobileQuickAction[];
    layout: 'grid' | 'horizontal-scroll';
    customizable: boolean; // User can reorder/hide actions
  };
}

interface HeroCard {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: number;
    label: string;
  };
  color: 'piping' | 'paint' | 'insulation' | 'neutral';
  action?: () => void;
}

interface MobileQuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  badge?: number;
  enabled: boolean;
  scope?: 'piping' | 'paint' | 'insulation';
}
```

### 3. Mobile Component List

**Card-based layout optimized for touch interaction:**

```typescript
interface MobileComponentList {
  // List configuration
  viewMode: 'cards' | 'compact-list';
  grouping: 'none' | 'area' | 'system' | 'status' | 'priority';
  
  // Card design
  componentCard: {
    // Header
    header: {
      displayId: string;
      status: ComponentStatus;
      priority: PriorityIndicator;
      quickActions: CardAction[];
    };
    
    // Main content
    content: {
      description: string;
      location: string;
      specifications: SpecificationBadge[];
      progress: MiniProgressBar;
    };
    
    // Footer
    footer: {
      assignedTo?: string;
      dueDate?: Date;
      estimatedTime?: number;
      lastUpdate?: Date;
    };
    
    // Interaction
    gestures: {
      tap: 'view-detail' | 'quick-update';
      longPress: 'context-menu' | 'multi-select';
      swipeLeft: 'complete' | 'assign';
      swipeRight: 'start' | 'skip';
    };
  };
  
  // List features
  features: {
    search: SearchConfig;
    filter: FilterConfig;
    sort: SortConfig;
    bulkSelect: BulkSelectConfig;
    pullToRefresh: boolean;
    infiniteScroll: boolean;
  };
}

interface ComponentCard {
  // Visual priority indicators
  priorityStripe: {
    visible: boolean;
    color: string; // Based on priority
    thickness: number;
  };
  
  // Status indicators
  statusIndicators: {
    completion: CircularProgress;
    issues: WarningBadge;
    updates: NotificationDot;
  };
  
  // Specification display
  specificationChips: {
    paint?: SpecChip;
    insulation?: SpecChip;
    compact: boolean; // Compact view on small screens
  };
  
  // Action buttons
  actionButtons: {
    primary: ActionButton; // Main action based on current state
    secondary?: ActionButton; // Optional secondary action
    menu: ActionButton; // Always present menu button
  };
}
```

### 4. Mobile Progress Update Interface

**Large touch targets optimized for field use with gloves:**

```typescript
interface MobileProgressUpdate {
  // Component identification (sticky header)
  componentHeader: {
    displayId: string;
    description: string;
    location: string;
    specification: string;
    backgroundColor: string; // Scope color
  };
  
  // Progress selection (large buttons)
  progressSelector: {
    milestones: MobileMilestone[];
    layout: 'vertical-list' | 'button-grid';
    buttonSize: 'large'; // Minimum 44px touch target
  };
  
  // Additional information
  additionalInfo: {
    notes: {
      enabled: boolean;
      placeholder: string;
      voiceInput: boolean; // Voice-to-text support
    };
    
    photos: {
      enabled: boolean;
      maxPhotos: number;
      compressionQuality: number; // For mobile upload
    };
    
    time: {
      tracking: boolean;
      estimatedTime: number;
      actualTime?: number;
    };
    
    location: {
      gpsCapture: boolean;
      requiresLocation: boolean;
    };
  };
  
  // Action bar
  actionBar: {
    cancel: ActionButton;
    save: ActionButton;
    saveAndNext: ActionButton; // Continue to next component
  };
  
  // Offline support
  offline: {
    supported: boolean;
    queuedUpdates: number;
    syncStatus: 'synced' | 'pending' | 'error';
  };
}

interface MobileMilestone {
  name: string;
  description: string;
  isComplete: boolean;
  canToggle: boolean; // Based on user permissions and dependencies
  
  // Visual design
  appearance: {
    icon: React.ReactNode;
    color: string;
    size: 'large'; // Minimum 60px for easy touch
  };
  
  // Interaction
  onToggle: (completed: boolean) => void;
  feedback: 'haptic' | 'visual' | 'audio'; // Touch feedback options
}
```

## Responsive Design Patterns

### 1. Breakpoint Strategy

**Mobile-first responsive design with specific breakpoints:**

```css
/* Mobile-first breakpoints */
:root {
  --mobile-s: 320px;   /* Small mobile */
  --mobile-m: 375px;   /* Medium mobile */
  --mobile-l: 425px;   /* Large mobile */
  --tablet: 768px;     /* Tablet */
  --laptop: 1024px;    /* Laptop */
  --desktop: 1440px;   /* Desktop */
}

/* Component-specific responsive behavior */
@media (max-width: 768px) {
  .component-table { display: none; }
  .component-cards { display: block; }
  
  .multi-scope-progress {
    flex-direction: column;
    gap: 1rem;
  }
  
  .dashboard-layout {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}

@media (min-width: 769px) {
  .component-cards { display: none; }
  .component-table { display: table; }
  
  .mobile-fab { display: none; }
  .desktop-toolbar { display: flex; }
}
```

### 2. Component Adaptation

**How components adapt across different screen sizes:**

```typescript
interface ResponsiveComponentBehavior {
  // Component Table
  componentTable: {
    mobile: 'cards'; // Switch to card view
    tablet: 'compact-table'; // Reduced columns
    desktop: 'full-table'; // All columns visible
  };
  
  // Progress Indicators
  progressIndicators: {
    mobile: 'stacked'; // Vertical stack
    tablet: 'side-by-side'; // Horizontal layout
    desktop: 'dashboard-grid'; // Complex grid layout
  };
  
  // Navigation
  navigation: {
    mobile: 'bottom-tabs'; // Bottom navigation
    tablet: 'side-rail'; // Collapsible sidebar
    desktop: 'full-sidebar'; // Expanded sidebar
  };
  
  // Modals and Overlays
  modals: {
    mobile: 'full-screen'; // Full-screen overlay
    tablet: 'centered-modal'; // Centered with backdrop
    desktop: 'contextual-panel'; // Side panel or inline
  };
}
```

## Accessibility Requirements

### 1. WCAG 2.1 AA Compliance

**Accessibility features for all interfaces:**

```typescript
interface AccessibilityFeatures {
  // Color and Contrast
  colorAccessibility: {
    minimumContrast: 4.5; // WCAG AA standard
    scopeColors: {
      // Ensure sufficient contrast for color-blind users
      piping: { primary: '#0052CC', accessible: '#003D99' };
      paint: { primary: '#FF8C00', accessible: '#CC6600' };
      insulation: { primary: '#00A86B', accessible: '#007A4D' };
    };
    
    // Alternative indicators beyond color
    patternIndicators: boolean; // Use patterns/shapes in addition to colors
    textLabels: boolean; // Always include text labels with color coding
  };
  
  // Keyboard Navigation
  keyboardSupport: {
    fullKeyboardAccess: boolean; // All functionality accessible via keyboard
    focusIndicators: 'enhanced'; // Clear focus indicators
    skipLinks: string[]; // Skip to main content, skip to navigation
    shortcuts: KeyboardShortcut[]; // Keyboard shortcuts for common actions
  };
  
  // Screen Reader Support
  screenReader: {
    ariaLabels: boolean; // Comprehensive ARIA labeling
    liveRegions: boolean; // Announce progress updates
    structuredHeadings: boolean; // Proper heading hierarchy
    alternativeText: boolean; // Alt text for all images/icons
  };
  
  // Motor Accessibility
  motorAccessibility: {
    largeTargets: boolean; // Minimum 44px touch targets
    clickAlternatives: boolean; // Hover alternatives for mobile
    gestureAlternatives: boolean; // Button alternatives for gestures
    timeoutExtensions: boolean; // Extend timeouts for complex actions
  };
  
  // Visual Accessibility
  visualAccessibility: {
    zoomSupport: boolean; // Support up to 200% zoom
    highContrastMode: boolean; // High contrast theme option
    reducedMotion: boolean; // Respect prefers-reduced-motion
    textScaling: boolean; // Support browser text scaling
  };
}
```

### 2. Assistive Technology Integration

**Support for common assistive technologies:**

```typescript
interface AssistiveTechnologySupport {
  // Screen readers
  screenReaders: {
    JAWS: boolean;
    NVDA: boolean;
    VoiceOver: boolean;
    TalkBack: boolean; // Android
  };
  
  // Voice control
  voiceControl: {
    dragonNaturallySpeaking: boolean;
    voiceControlMac: boolean;
    voiceAccessAndroid: boolean;
  };
  
  // Switch navigation
  switchNavigation: {
    scanning: boolean; // Sequential scanning support
    stepScanning: boolean; // Manual step-by-step
    customSwitches: boolean; // Custom switch assignments
  };
  
  // Eye tracking
  eyeTracking: {
    tobiiDynavox: boolean;
    eyeGaze: boolean;
    dwellClick: boolean; // Click by dwelling
  };
}
```

## Performance Requirements

### 1. Loading Performance

**Page load and interaction performance targets:**

```typescript
interface PerformanceTargets {
  // Initial load times
  initialLoad: {
    dashboard: 2000; // ms - Dashboard first contentful paint
    componentList: 1500; // ms - Component list first meaningful paint
    componentDetail: 1000; // ms - Component detail modal
  };
  
  // Interaction responsiveness
  interactions: {
    buttonPress: 100; // ms - Visual feedback delay
    tableSort: 500; // ms - Table re-sort time
    filter: 300; // ms - Filter application time
    bulkUpdate: 2000; // ms - Bulk update processing time
  };
  
  // Data loading
  dataOperations: {
    componentQuery: 800; // ms - Component list query
    progressUpdate: 500; // ms - Single progress update
    bulkProgressUpdate: 3000; // ms - Bulk progress update
  };
  
  // Mobile-specific
  mobile: {
    scrollPerformance: 60; // FPS - Smooth scrolling
    touchResponse: 50; // ms - Touch response time
    gestureRecognition: 100; // ms - Gesture recognition delay
  };
}
```

### 2. Optimization Strategies

**Performance optimization approaches:**

```typescript
interface OptimizationStrategies {
  // Code splitting
  codeSplitting: {
    scopeBasedSplitting: boolean; // Load only relevant scope components
    routeBasedSplitting: boolean; // Split by page routes
    dynamicImports: boolean; // Dynamic import for modals/overlays
  };
  
  // Data optimization
  dataOptimization: {
    virtualScrolling: boolean; // For large component lists
    paginatedLoading: boolean; // Load data in chunks
    requestBatching: boolean; // Batch multiple API requests
    caching: CachingStrategy;
  };
  
  // Asset optimization
  assetOptimization: {
    imageOptimization: boolean; // WebP format, responsive images
    iconSprites: boolean; // SVG sprite sheets for icons
    fontSubsetting: boolean; // Load only needed font characters
  };
  
  // Runtime optimization
  runtimeOptimization: {
    memoization: boolean; // React.memo and useMemo
    lazyRendering: boolean; // Render components only when visible
    debouncing: boolean; // Debounce search and filter inputs
  };
}

interface CachingStrategy {
  // Browser caching
  browserCache: {
    staticAssets: 'aggressive'; // Long-term caching for static assets
    apiResponses: 'conditional'; // ETag-based conditional caching
    userPreferences: 'local-storage'; // Cache user settings locally
  };
  
  // Service worker caching
  serviceWorker: {
    offlineSupport: boolean; // Cache for offline functionality
    backgroundSync: boolean; // Sync when connection restored
    pushNotifications: boolean; // Enable push notifications
  };
}
```

## Testing Requirements

### 1. Cross-Device Testing Matrix

**Comprehensive device and browser testing:**

```typescript
interface TestingMatrix {
  // Mobile devices
  mobileDevices: {
    iOS: ['iPhone 12', 'iPhone 13', 'iPad Air', 'iPad Pro'];
    android: ['Samsung Galaxy S21', 'Google Pixel 6', 'Samsung Galaxy Tab'];
    ruggedTablets: ['Panasonic Toughbook', 'Dell Latitude Rugged']; // Field devices
  };
  
  // Desktop browsers
  desktopBrowsers: {
    chrome: ['latest', 'latest-1'];
    firefox: ['latest', 'latest-1'];
    safari: ['latest', 'latest-1'];
    edge: ['latest', 'latest-1'];
  };
  
  // Accessibility testing
  accessibilityTesting: {
    screenReaders: ['NVDA', 'JAWS', 'VoiceOver'];
    keyboardOnly: boolean;
    highContrast: boolean;
    colorBlindness: boolean;
  };
  
  // Performance testing
  performanceTesting: {
    lighthouse: boolean; // Google Lighthouse audits
    webVitals: boolean; // Core Web Vitals tracking
    slowNetwork: boolean; // 3G simulation testing
    lowPowerMode: boolean; // iOS low power mode testing
  };
}
```

### 2. User Acceptance Testing

**UAT scenarios specific to subcontractor workflows:**

```typescript
interface UATScenarios {
  // Paint subcontractor scenarios
  paintScenarios: [
    {
      title: 'Daily Work Assignment';
      description: 'Paint foreman receives daily assignments and updates progress';
      steps: [
        'Log in to PipeTrak on tablet',
        'View assigned components for today',
        'Start work on first component',
        'Mark primer complete with photo',
        'Complete finish coat and final update',
        'Move to next component'
      ];
      expectedDuration: 15; // minutes
      successCriteria: [
        'All updates save correctly',
        'Progress reflects in real-time',
        'Photos upload successfully',
        'Next assignment appears automatically'
      ];
    },
    
    {
      title: 'Bulk Progress Update';
      description: 'Paint supervisor updates multiple components after daily work';
      steps: [
        'Access bulk update interface',
        'Select components by area',
        'Mark all primer work complete',
        'Add supervisor notes',
        'Confirm bulk update'
      ];
      expectedDuration: 5; // minutes
      successCriteria: [
        'All selected components update correctly',
        'Audit trail captures bulk update',
        'Reports reflect new progress immediately'
      ];
    }
  ];
  
  // Project manager scenarios
  projectManagerScenarios: [
    {
      title: 'Multi-Scope Progress Review';
      description: 'PM reviews progress across all scopes for weekly report';
      steps: [
        'Access project dashboard',
        'Review piping, paint, and insulation progress',
        'Identify components ready for turnover',
        'Generate progress report',
        'Export data for client presentation'
      ];
      expectedDuration: 10; // minutes
      successCriteria: [
        'All scope data displays accurately',
        'Reports generate within 30 seconds',
        'Export formats are client-ready'
      ];
    }
  ];
  
  // Offline functionality scenarios
  offlineScenarios: [
    {
      title: 'Offline Progress Updates';
      description: 'Field crew continues work without internet connection';
      steps: [
        'Disconnect from internet',
        'Continue updating component progress',
        'Take photos and add notes',
        'Reconnect to internet',
        'Verify all changes sync correctly'
      ];
      expectedDuration: 20; // minutes
      successCriteria: [
        'All offline changes queue properly',
        'Sync occurs automatically on reconnection',
        'No data loss during sync process',
        'Conflicts handled gracefully'
      ];
    }
  ];
}
```

---

*Document Version: 1.0*  
*Author: UI/UX Architect*  
*Date: 2025-08-14*  
*Status: Implementation Ready*  
*Focus: Mobile-first design with comprehensive accessibility support*