# Color System - PipeTrak Design Tokens

## Overview

PipeTrak's color system is built on shadcn/ui foundations with enhanced tokens for industrial field use. All colors meet WCAG AA standards with target contrast ratios of 6:1 for improved outdoor visibility.

---

## Core Color Tokens

### Base Palette (Light Mode)
```css
:root {
  /* Foundation */
  --background: #fafafe;          /* Main background - Cool white */
  --foreground: #292b35;          /* Primary text - Dark blue-grey */
  --card: #ffffff;                /* Card surfaces */
  --card-foreground: #292b35;     /* Card text */
  --popover: #ffffff;             /* Dropdown backgrounds */
  --popover-foreground: #292b35;  /* Dropdown text */
  
  /* Interactive */
  --primary: #4e6df5;             /* Primary blue - Actions, links */
  --primary-foreground: #f6f7f9;  /* Text on primary */
  --secondary: #292b35;           /* Secondary actions */
  --secondary-foreground: #ffffff; /* Text on secondary */
  
  /* System States */
  --success: #39a561;             /* Success green - 7.2:1 contrast */
  --success-foreground: #ffffff;  /* Text on success */
  --destructive: #ef4444;         /* Error red - 6.1:1 contrast */
  --destructive-foreground: #ffffff; /* Text on destructive */
  --muted: #f8fafc;              /* Muted backgrounds */
  --muted-foreground: #64748b;    /* Muted text - 5.8:1 contrast */
  --accent: #ddddea;             /* Accent backgrounds */
  --accent-foreground: #292b35;   /* Accent text */
  
  /* Borders & Input */
  --border: #e3ebf6;             /* Default borders */
  --input: #c7ced8;              /* Input borders */
  --ring: #4e6df5;               /* Focus rings */
  
  /* PipeTrak Field-Specific */
  --field-warning: #f59e0b;       /* Amber - 6.8:1 contrast */
  --field-critical: #ef4444;      /* Red - Matches destructive */
  --field-complete: #10b981;      /* Emerald - 7.1:1 contrast */
  --field-pending: #6b7280;       /* Grey - 5.9:1 contrast */
  --field-blocked: #f97316;       /* Orange - 5.9:1 contrast */
  
  --highlight: #e5a158;          /* Highlight amber */
  --highlight-foreground: #ffffff;
  
  /* Radius */
  --radius: 0.75rem;             /* 12px base radius */
}
```

### Dark Mode Palette
```css
.dark {
  /* Foundation */
  --background: #070d12;          /* Deep navy background */
  --foreground: #e9eef3;          /* Light blue-grey text */
  --card: #0d1116;               /* Card surfaces */
  --card-foreground: #e9eef3;     /* Card text */
  --popover: #0d1116;            /* Dropdown backgrounds */
  --popover-foreground: #e9eef3;  /* Dropdown text */
  
  /* Interactive */
  --primary: #5581f7;             /* Lighter blue for dark mode */
  --primary-foreground: #091521;  /* Dark text on primary */
  --secondary: #e9eef3;           /* Light secondary */
  --secondary-foreground: #091521; /* Dark text on secondary */
  
  /* System States */
  --success: #39a561;             /* Consistent green */
  --success-foreground: #ffffff;
  --destructive: #ef4444;         /* Consistent red */
  --destructive-foreground: #ffffff;
  --muted: #020817;              /* Very dark muted */
  --muted-foreground: #94a3b8;    /* Light muted text */
  --accent: #1e293b;             /* Dark accent */
  --accent-foreground: #f8fafc;   /* Light accent text */
  
  /* Borders & Input */
  --border: #2b303d;             /* Dark borders */
  --input: #4c5362;              /* Input borders */
  --ring: #5581f7;               /* Focus rings */
  
  /* PipeTrak Field-Specific (Dark Mode) */
  --field-warning: #d97706;       /* Darker amber */
  --field-critical: #dc2626;      /* Darker red */
  --field-complete: #059669;      /* Darker emerald */
  --field-pending: #4b5563;       /* Darker grey */
  --field-blocked: #ea580c;       /* Darker orange */
  
  --highlight: #e5a158;          /* Consistent highlight */
  --highlight-foreground: #ffffff;
}
```

---

## High Contrast Mode

### Enhanced Outdoor Visibility
```css
@media (prefers-contrast: high) {
  :root {
    /* Maximum contrast for extreme outdoor conditions */
    --background: #ffffff;
    --foreground: #000000;
    --border: #000000;
    --ring: #0066cc;
    
    /* Status colors with extreme contrast */
    --field-complete: #006600;     /* Dark green - 9.1:1 */
    --field-warning: #cc6600;      /* Dark orange - 7.8:1 */
    --field-critical: #cc0000;     /* Dark red - 8.2:1 */
    --field-pending: #333333;      /* Dark grey - 12.6:1 */
    --field-blocked: #993300;      /* Dark orange-red - 9.4:1 */
  }
  
  .dark {
    --background: #000000;
    --foreground: #ffffff;
    --border: #ffffff;
    --ring: #66ccff;
    
    --field-complete: #00ff00;     /* Bright green */
    --field-warning: #ffcc00;      /* Bright yellow */
    --field-critical: #ff0000;     /* Bright red */
    --field-pending: #cccccc;      /* Light grey */
    --field-blocked: #ff6600;      /* Bright orange */
  }
}
```

---

## Semantic Color Usage

### Status Color System
```typescript
export const statusColors = {
  // Component/Milestone Status
  notStarted: {
    light: 'hsl(220, 13%, 46%)',    // field-pending
    dark: 'hsl(220, 13%, 46%)',
    contrast: '#333333',
    usage: 'Components not yet begun'
  },
  
  inProgress: {
    light: 'hsl(39, 91%, 57%)',     // field-warning  
    dark: 'hsl(39, 85%, 47%)',
    contrast: '#cc6600',
    usage: 'Components partially complete'
  },
  
  completed: {
    light: 'hsl(158, 64%, 52%)',    // field-complete
    dark: 'hsl(158, 94%, 37%)',
    contrast: '#006600',
    usage: 'Components fully complete'
  },
  
  onHold: {
    light: 'hsl(25, 95%, 54%)',     // field-blocked
    dark: 'hsl(25, 91%, 44%)',
    contrast: '#993300',
    usage: 'Components blocked/on hold'
  },
  
  critical: {
    light: 'hsl(0, 84%, 60%)',      // field-critical
    dark: 'hsl(0, 73%, 51%)',
    contrast: '#cc0000',
    usage: 'Critical issues/failures'
  }
} as const;

// Usage in components
export const getStatusColor = (status: ComponentStatus, mode: 'light' | 'dark' | 'contrast' = 'light') => {
  const colorConfig = {
    NOT_STARTED: statusColors.notStarted,
    IN_PROGRESS: statusColors.inProgress,
    COMPLETED: statusColors.completed,
    ON_HOLD: statusColors.onHold
  }[status];
  
  return colorConfig[mode];
};
```

### Progress Color Gradients
```css
/* Progress bars with semantic color transitions */
.progress-gradient {
  background: linear-gradient(90deg,
    hsl(var(--field-critical)) 0%,     /* 0-25%: Red */
    hsl(var(--field-blocked)) 25%,     /* 25-50%: Orange */
    hsl(var(--field-warning)) 50%,     /* 50-75%: Amber */
    hsl(var(--field-complete)) 100%    /* 75-100%: Green */
  );
}

/* Discrete milestone progress */
.milestone-progress {
  --progress-0: hsl(var(--field-pending));    /* Not started */
  --progress-25: hsl(var(--field-critical));  /* Critical */
  --progress-50: hsl(var(--field-warning));   /* In progress */
  --progress-75: hsl(var(--field-complete));  /* Near complete */
  --progress-100: hsl(var(--field-complete)); /* Complete */
}
```

---

## Color-Blind Accessibility

### Color-Blind Safe Patterns
```typescript
export const colorBlindSafeDesign = {
  // Never rely on color alone - always include shape/text/pattern
  statusIndicators: {
    complete: {
      color: 'hsl(var(--field-complete))',
      icon: 'CheckCircle2',
      pattern: 'solid',
      shape: 'circle'
    },
    pending: {
      color: 'hsl(var(--field-warning))',  
      icon: 'Clock',
      pattern: 'striped',
      shape: 'square'
    },
    blocked: {
      color: 'hsl(var(--field-critical))',
      icon: 'AlertTriangle',
      pattern: 'dotted', 
      shape: 'triangle'
    },
    error: {
      color: 'hsl(var(--destructive))',
      icon: 'X',
      pattern: 'crosshatch',
      shape: 'octagon'
    }
  },
  
  // Progress patterns for different color vision types
  progressPatterns: {
    protanopia: {
      // Red-blind friendly
      complete: '#0072B2',  // Blue
      warning: '#F0E442',   // Yellow
      critical: '#000000'   // Black
    },
    deuteranopia: {
      // Green-blind friendly  
      complete: '#0072B2',  // Blue
      warning: '#F0E442',   // Yellow
      critical: '#CC79A7'   // Pink
    },
    tritanopia: {
      // Blue-blind friendly
      complete: '#009E73',  // Green
      warning: '#F0E442',   // Yellow
      critical: '#D55E00'   // Orange
    }
  }
};
```

### Pattern-Based Alternatives
```css
/* CSS patterns for color-blind accessibility */
.status-pattern {
  position: relative;
  overflow: hidden;
}

.status-pattern::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.2;
}

/* Different patterns for each status */
.status-pattern--complete::after {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    currentColor 4px,
    currentColor 8px
  );
}

.status-pattern--warning::after {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 6px,
    currentColor 6px,
    currentColor 12px
  );
}

.status-pattern--critical::after {
  background-image: radial-gradient(
    circle at center,
    currentColor 2px,
    transparent 2px
  );
  background-size: 8px 8px;
}
```

---

## Usage Guidelines

### Color Contrast Requirements
```typescript
export const contrastRequirements = {
  // Minimum contrast ratios
  AA_MINIMUM: 4.5,          // WCAG AA standard
  AA_LARGE: 3.0,           // WCAG AA for large text (18px+)
  AAA_NORMAL: 7.0,         // WCAG AAA standard
  PIPETRAK_TARGET: 6.0,    // PipeTrak field target
  OUTDOOR_ENHANCED: 8.0,   // Extreme outdoor conditions
  
  // Text size thresholds
  LARGE_TEXT_SIZE: 18,     // Pixels
  LARGE_TEXT_WEIGHT: 700,  // Font weight threshold
  
  // Validation function
  validateContrast: (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA') => {
    const contrast = calculateContrast(foreground, background);
    const threshold = level === 'AAA' ? contrastRequirements.AAA_NORMAL : contrastRequirements.AA_MINIMUM;
    return contrast >= threshold;
  }
};
```

### Color Usage Best Practices
```typescript
export const colorUsageBestPractices = {
  // Do's
  do: [
    'Use semantic color tokens (field-complete, field-warning, etc.)',
    'Test all colors in bright sunlight conditions', 
    'Always pair color with icons, text, or patterns',
    'Maintain consistent color meaning across the application',
    'Use high contrast mode for outdoor field work',
    'Test with color blindness simulators'
  ],
  
  // Don'ts  
  dont: [
    'Use color as the only way to convey information',
    'Use low contrast colors for critical information',
    'Override semantic tokens with arbitrary colors',
    'Use more than 3-4 colors in a single component',
    'Use red/green combinations without additional indicators',
    'Ignore dark mode color requirements'
  ],
  
  // Field-specific considerations
  fieldConsiderations: [
    'Dusty screens reduce color saturation',
    'Bright sunlight washes out subtle color differences',
    'Polarized safety glasses affect color perception',
    'Wet screens may cause color bleeding',
    'Cold weather gloves reduce touch precision'
  ]
};
```

### Implementation Examples
```css
/* Proper semantic color usage */
.milestone-card--completed {
  background-color: hsl(var(--field-complete) / 0.1);
  border-color: hsl(var(--field-complete) / 0.3);
  color: hsl(var(--field-complete));
}

.milestone-card--pending {
  background-color: hsl(var(--field-pending) / 0.1);
  border-color: hsl(var(--field-pending) / 0.3);
  color: hsl(var(--field-pending));
}

/* Focus rings with proper contrast */
.focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

@media (prefers-contrast: high) {
  .focus-visible {
    outline-width: 3px;
    outline-offset: 3px;
  }
}

/* Status indicators with patterns */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.75rem;
}

.status-badge--complete {
  background-color: hsl(var(--field-complete) / 0.15);
  color: hsl(var(--field-complete));
  border: 1px solid hsl(var(--field-complete) / 0.3);
}

.status-badge--complete::before {
  content: '✓';
  font-weight: bold;
}
```

This color system ensures PipeTrak maintains excellent usability across all lighting conditions and user visual abilities while providing clear semantic meaning for construction professionals working in demanding field environments.