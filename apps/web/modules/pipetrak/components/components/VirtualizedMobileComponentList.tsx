"use client";

import { 
  memo, 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect, 
  useState 
} from "react";
import { VariableSizeList as List } from "react-window";
import { MobileComponentCard } from "./MobileComponentCard";
import type { ComponentWithMilestones } from "../../types";
import { cn } from "@ui/lib";

export interface VirtualizedMobileComponentListProps {
  components: ComponentWithMilestones[];
  selectedComponents: Set<string>;
  onComponentSelect: (componentId: string, selected: boolean) => void;
  onComponentClick: (component: ComponentWithMilestones) => void;
  onMilestoneUpdate?: (componentId: string, milestoneId: string, value: boolean | number) => void;
  onQuickUpdate?: (componentId: string, status: string) => void;
  onOpenMilestones?: (component: ComponentWithMilestones) => void;
  onOpenQuickSelector?: (component: ComponentWithMilestones) => void;
  height: number;
  className?: string;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    components: ComponentWithMilestones[];
    selectedComponents: Set<string>;
    onComponentSelect: (componentId: string, selected: boolean) => void;
    onComponentClick: (component: ComponentWithMilestones) => void;
    onMilestoneUpdate?: (componentId: string, milestoneId: string, value: boolean | number) => void;
    onQuickUpdate?: (componentId: string, status: string) => void;
    onOpenMilestones?: (component: ComponentWithMilestones) => void;
    onOpenQuickSelector?: (component: ComponentWithMilestones) => void;
  };
}

// Memoized list item component for performance
const ListItem = memo(function ListItem({ index, style, data }: ListItemProps) {
  const component = data.components[index];
  const isSelected = data.selectedComponents.has(component.id);

  const handleSelect = useCallback((selected: boolean) => {
    data.onComponentSelect(component.id, selected);
  }, [component.id, data.onComponentSelect]);

  const handleClick = useCallback(() => {
    data.onComponentClick(component);
  }, [component, data.onComponentClick]);

  const handleQuickUpdate = useCallback((status: string) => {
    data.onQuickUpdate?.(component.id, status);
  }, [component.id, data.onQuickUpdate]);

  const handleOpenMilestones = useCallback(() => {
    data.onOpenMilestones?.(component);
  }, [component, data.onOpenMilestones]);

  const handleOpenQuickSelector = useCallback(() => {
    data.onOpenQuickSelector?.(component);
  }, [component, data.onOpenQuickSelector]);

  const handleMilestoneUpdate = useCallback((milestoneId: string, value: boolean | number) => {
    data.onMilestoneUpdate?.(component.id, milestoneId, value);
  }, [component.id, data.onMilestoneUpdate]);

  return (
    <div style={style}>
      <div className="px-4 pb-1.5">
        <MobileComponentCard
          component={component}
          isSelected={isSelected}
          onSelect={handleSelect}
          onClick={handleClick}
          onQuickUpdate={data.onQuickUpdate ? handleQuickUpdate : undefined}
          onOpenMilestones={data.onOpenMilestones ? handleOpenMilestones : undefined}
          onOpenQuickSelector={data.onOpenQuickSelector ? handleOpenQuickSelector : undefined}
          onMilestoneUpdate={data.onMilestoneUpdate ? handleMilestoneUpdate : undefined}
        />
      </div>
    </div>
  );
});

// Calculate item height based on component content
function getItemHeight(component: ComponentWithMilestones): number {
  // Base height: padding + header + meta + milestone buttons
  let height = 8 + 24 + 16 + 40; // 88px base
  
  // Add padding between items
  height += 6;
  
  return height;
}

export const VirtualizedMobileComponentList = memo(function VirtualizedMobileComponentList({
  components,
  selectedComponents,
  onComponentSelect,
  onComponentClick,
  onMilestoneUpdate,
  onQuickUpdate,
  onOpenMilestones,
  onOpenQuickSelector,
  height,
  className,
}: VirtualizedMobileComponentListProps) {
  const listRef = useRef<List>(null);
  const [containerHeight, setContainerHeight] = useState(height);

  // Memoize list data to prevent unnecessary re-renders
  const listData = useMemo(() => ({
    components,
    selectedComponents,
    onComponentSelect,
    onComponentClick,
    onMilestoneUpdate,
    onQuickUpdate,
    onOpenMilestones,
    onOpenQuickSelector,
  }), [
    components,
    selectedComponents,
    onComponentSelect,
    onComponentClick,
    onMilestoneUpdate,
    onQuickUpdate,
    onOpenMilestones,
    onOpenQuickSelector,
  ]);

  // Memoize item size getter
  const getItemSize = useCallback((index: number) => {
    return getItemHeight(components[index]);
  }, [components]);

  // Handle container resize
  useEffect(() => {
    setContainerHeight(height);
  }, [height]);

  // Scroll to specific component
  const scrollToComponent = useCallback((componentId: string) => {
    const index = components.findIndex(c => c.id === componentId);
    if (index >= 0 && listRef.current) {
      listRef.current.scrollToItem(index, "center");
    }
  }, [components]);

  // Performance optimization: reset list when components change significantly
  const resetList = useCallback(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, []);

  // Reset list when component list changes structure
  useEffect(() => {
    resetList();
  }, [components.length, resetList]);

  if (components.length === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height: containerHeight }}>
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No components found</p>
          <p className="text-sm">Try adjusting your filters or search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <List
        ref={listRef}
        height={containerHeight}
        itemCount={components.length}
        itemSize={getItemSize}
        itemData={listData}
        overscanCount={5} // Render 5 items above/below viewport for smooth scrolling
        width="100%"
      >
        {ListItem}
      </List>
    </div>
  );
});