# Typography System - PipeTrak Design Tokens

## Overview

PipeTrak's typography system prioritizes **field readability** in challenging industrial environments. Built on Geist Sans foundation with enhanced sizing for outdoor visibility and construction workflows.

---

## Font Stack

### Primary Font Family
```css
:root {
  --font-sans: var(--font-geist-sans), "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
}

/* Geist Sans characteristics optimized for PipeTrak: */
/* - High x-height for better readability at smaller sizes */
/* - Clear character differentiation (0 vs O, 1 vs l vs I) */  
/* - Excellent rendering on low-DPI construction tablets */
/* - Works well in dusty/wet screen conditions */
```

### Fallback Strategy
```css
/* Fallback fonts for various platforms */
.typography-system {
  font-family: 
    var(--font-geist-sans),     /* Primary - Geist Sans */
    "Segoe UI",                 /* Windows */
    "SF Pro Display",           /* macOS/iOS */
    "Roboto",                   /* Android */
    "Helvetica Neue",           /* Legacy Apple */
    Arial,                      /* Universal fallback */
    sans-serif;                 /* System fallback */
}
```

---

## Type Scale

### Enhanced Scale for Field Visibility
```css
:root {
  /* Base sizing - 16px root with enhanced scale */
  --text-xs: 0.75rem;      /* 12px - Small labels, captions */
  --text-sm: 0.875rem;     /* 14px - Secondary text */
  --text-base: 1rem;       /* 16px - Body text */
  --text-lg: 1.125rem;     /* 18px - Large body text */
  --text-xl: 1.25rem;      /* 20px - Small headings */
  --text-2xl: 1.5rem;      /* 24px - Card titles */
  --text-3xl: 1.875rem;    /* 30px - Section headings */
  --text-4xl: 2.25rem;     /* 36px - Page titles */
  --text-5xl: 3rem;        /* 48px - Display headings */
  
  /* Line heights optimized for industrial reading */
  --leading-tight: 1.25;   /* Headlines */
  --leading-snug: 1.375;   /* Subheadings */
  --leading-normal: 1.5;   /* Body text */
  --leading-relaxed: 1.625; /* Large blocks */
  --leading-loose: 2;      /* Very spacious */
  
  /* Letter spacing for clarity */
  --tracking-tight: -0.025em;  /* Large headings */
  --tracking-normal: 0em;      /* Body text */
  --tracking-wide: 0.025em;    /* Small caps, labels */
  --tracking-wider: 0.05em;    /* Emphasis */
  --tracking-widest: 0.1em;    /* All caps headings */
}

/* Responsive scaling for different screen densities */
@media screen and (max-width: 640px) {
  :root {
    /* Slightly larger sizes for mobile/tablet field use */
    --text-xs: 0.8125rem;    /* 13px */
    --text-sm: 0.9375rem;    /* 15px */
    --text-base: 1.0625rem;  /* 17px */
    --text-lg: 1.1875rem;    /* 19px */
    --text-xl: 1.3125rem;    /* 21px */
    --text-2xl: 1.625rem;    /* 26px */
    --text-3xl: 2rem;        /* 32px */
    --text-4xl: 2.5rem;      /* 40px */
  }
}

/* High DPI adjustments */
@media screen and (min-resolution: 2dppx) {
  :root {
    /* Slightly smaller on high-DPI screens */
    --text-base: 0.9375rem;  /* 15px */
    --text-lg: 1.0625rem;    /* 17px */
  }
}
```

---

## Font Weights

### Strategic Weight Usage
```css
:root {
  /* Geist Sans weight scale */
  --font-thin: 100;        /* Rarely used */
  --font-light: 300;       /* Secondary text */
  --font-normal: 400;      /* Body text default */
  --font-medium: 500;      /* Emphasized text */
  --font-semibold: 600;    /* Subheadings */
  --font-bold: 700;        /* Headings */
  --font-extrabold: 800;   /* Display text */
  --font-black: 900;       /* Hero text */
}

/* Field-optimized weight choices */
.typography-weights {
  /* Body text - medium weight for better readability on tablets */
  --body-weight: var(--font-medium);
  
  /* Headings - semibold for clear hierarchy without being too heavy */
  --heading-weight: var(--font-semibold);
  
  /* Labels - medium weight for form clarity */
  --label-weight: var(--font-medium);
  
  /* Numbers - semibold for quick scanning */
  --numeric-weight: var(--font-semibold);
  
  /* Status text - bold for quick identification */
  --status-weight: var(--font-bold);
}
```

---

## Typography Components

### Heading System
```typescript
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

const headingStyles = {
  h1: "text-4xl font-bold leading-tight tracking-tight text-foreground mb-6",
  h2: "text-3xl font-semibold leading-snug tracking-tight text-foreground mb-5", 
  h3: "text-2xl font-semibold leading-snug text-foreground mb-4",
  h4: "text-xl font-semibold leading-snug text-foreground mb-3",
  h5: "text-lg font-medium leading-normal text-foreground mb-2",
  h6: "text-base font-medium leading-normal text-foreground mb-2"
};

export const Heading: React.FC<HeadingProps> = ({ level, children, className = "" }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const styles = headingStyles[`h${level}` as keyof typeof headingStyles];
  
  return (
    <Tag className={cn(styles, className)}>
      {children}
    </Tag>
  );
};
```

### Body Text System
```css
/* Body text classes */
.text-body {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  font-weight: var(--font-medium);
  color: hsl(var(--foreground));
}

.text-body-large {
  font-size: var(--text-lg);
  line-height: var(--leading-normal);
  font-weight: var(--font-normal);
  color: hsl(var(--foreground));
}

.text-body-small {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  font-weight: var(--font-medium);
  color: hsl(var(--muted-foreground));
}

/* Caption text for metadata */
.text-caption {
  font-size: var(--text-xs);
  line-height: var(--leading-snug);
  font-weight: var(--font-normal);
  color: hsl(var(--muted-foreground));
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
```

### Label System
```css
/* Form labels optimized for field use */
.label-primary {
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  font-weight: var(--font-medium);
  color: hsl(var(--foreground));
  letter-spacing: var(--tracking-normal);
}

.label-secondary {
  font-size: var(--text-xs);
  line-height: var(--leading-snug);
  font-weight: var(--font-normal);
  color: hsl(var(--muted-foreground));
  letter-spacing: var(--tracking-wide);
}

/* Required field indicators */
.label-required::after {
  content: '*';
  color: hsl(var(--destructive));
  font-weight: var(--font-bold);
  margin-left: 0.125rem;
}

/* Help text */
.help-text {
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
  font-weight: var(--font-normal);
  color: hsl(var(--muted-foreground));
  margin-top: 0.25rem;
}
```

---

## Field-Specific Typography

### Component ID Display
```css
/* Component IDs need to be easily scannable */
.component-id {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-wide);
  color: hsl(var(--foreground));
  background-color: hsl(var(--muted));
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  border: 1px solid hsl(var(--border));
}

/* Large component ID for mobile/field viewing */
.component-id--large {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  padding: 0.25rem 0.5rem;
}
```

### Numeric Data Display
```css
/* Progress percentages, quantities, measurements */
.numeric-display {
  font-feature-settings: 'tnum'; /* Tabular numbers */
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-normal);
}

.numeric-display--large {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: hsl(var(--primary));
}

.numeric-display--percentage {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
}

.numeric-display--quantity {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
}

/* Unit labels paired with numbers */
.unit-label {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  color: hsl(var(--muted-foreground));
  margin-left: 0.25rem;
}
```

### Status Typography
```css
/* Status text needs to be immediately recognizable */
.status-text {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.status-text--completed {
  color: hsl(var(--field-complete));
}

.status-text--in-progress {
  color: hsl(var(--field-warning));
}

.status-text--not-started {
  color: hsl(var(--field-pending));
}

.status-text--blocked {
  color: hsl(var(--field-blocked));
}

.status-text--critical {
  color: hsl(var(--field-critical));
}
```

---

## Reading Optimization

### Line Length & Spacing
```css
/* Optimal reading measures */
.readable-text {
  max-width: 65ch; /* Optimal line length for readability */
  line-height: var(--leading-relaxed);
}

.readable-text--narrow {
  max-width: 45ch; /* For sidebar content */
}

.readable-text--wide {
  max-width: 80ch; /* For technical documentation */
}

/* Paragraph spacing */
.prose p + p {
  margin-top: 1rem;
}

.prose-tight p + p {
  margin-top: 0.5rem;
}

.prose-loose p + p {
  margin-top: 1.5rem;
}
```

### Text Hierarchy
```css
/* Clear information hierarchy */
.text-hierarchy {
  /* Primary information - largest, boldest */
  --primary-text: var(--text-xl) var(--font-bold);
  
  /* Secondary information - medium size, medium weight */
  --secondary-text: var(--text-base) var(--font-medium);
  
  /* Tertiary information - smaller, normal weight */
  --tertiary-text: var(--text-sm) var(--font-normal);
  
  /* Metadata - smallest, muted */
  --metadata-text: var(--text-xs) var(--font-normal);
}
```

---

## Accessibility Considerations

### High Contrast Support
```css
@media (prefers-contrast: high) {
  /* Increase font weights for better contrast */
  .text-body {
    font-weight: var(--font-semibold);
  }
  
  .label-primary {
    font-weight: var(--font-bold);
  }
  
  /* Increase letter spacing */
  .text-body,
  .label-primary {
    letter-spacing: var(--tracking-wide);
  }
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  /* Remove text animations but keep essential feedback */
  .text-animate {
    animation: none !important;
    transition: color 0.15s ease !important;
  }
}
```

### Font Size Preferences
```css
@media (prefers-font-size: large) {
  :root {
    /* Scale up all text by ~1.125x */
    --text-xs: 0.8438rem;    /* 13.5px */
    --text-sm: 0.9844rem;    /* 15.75px */
    --text-base: 1.125rem;   /* 18px */
    --text-lg: 1.2656rem;    /* 20.25px */
    --text-xl: 1.4063rem;    /* 22.5px */
    --text-2xl: 1.6875rem;   /* 27px */
    --text-3xl: 2.1094rem;   /* 33.75px */
    --text-4xl: 2.5313rem;   /* 40.5px */
  }
}
```

---

## Implementation Examples

### Milestone Card Typography
```typescript
const MilestoneCardTypography = () => (
  <Card className="p-4">
    {/* Primary milestone name */}
    <h3 className="text-lg font-semibold leading-snug text-foreground mb-2">
      Pipe Installation Complete
    </h3>
    
    {/* Component ID */}
    <div className="component-id mb-3">
      PIPE-001-A
    </div>
    
    {/* Progress display */}
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-muted-foreground">
        Progress
      </span>
      <span className="numeric-display numeric-display--percentage text-success">
        75%
      </span>
    </div>
    
    {/* Status indicator */}
    <div className="status-text status-text--in-progress">
      In Progress
    </div>
    
    {/* Metadata */}
    <div className="text-caption mt-3">
      Updated 2 hours ago by John Doe
    </div>
  </Card>
);
```

### Table Header Typography
```typescript
const TableHeaderTypography = () => (
  <TableHeader>
    <TableRow>
      <TableHead className="text-sm font-semibold text-foreground tracking-wide uppercase">
        Component ID
      </TableHead>
      <TableHead className="text-sm font-semibold text-foreground tracking-wide uppercase">
        Progress
      </TableHead>
      <TableHead className="text-sm font-semibold text-foreground tracking-wide uppercase">
        Status
      </TableHead>
    </TableRow>
  </TableHeader>
);
```

### Form Typography
```typescript
const FormTypography = () => (
  <div className="space-y-4">
    <div>
      <label className="label-primary label-required">
        Milestone Name
      </label>
      <input 
        className="text-body mt-1 block w-full"
        placeholder="Enter milestone name"
      />
      <div className="help-text">
        Use descriptive names that field workers will easily recognize
      </div>
    </div>
  </div>
);
```

This typography system ensures excellent readability across all PipeTrak interfaces, from office desktop screens to dusty construction site tablets, while maintaining clear information hierarchy and accessibility standards.