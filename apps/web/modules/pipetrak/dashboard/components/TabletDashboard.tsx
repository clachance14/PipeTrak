'use client';

import { useState, useEffect } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { ToggleGroup, ToggleGroupItem } from "@ui/components/toggle-group";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@ui/components/sheet";
import { 
  RefreshCw, 
  Search, 
  Plus,
  Check,
  MoreVertical,
  Filter,
  List,
  Grid3x3
} from "lucide-react";
import { QuickStatsChips } from "./QuickStatsChips";
import { ComponentList } from "./ComponentList";
import { MilestoneProgressMatrix } from "./MilestoneProgressMatrix";
import { fetchDashboardComponentsClient } from "../lib/client-api";
import type { 
  DashboardMetrics,
  TestPackageReadiness,
} from "../types";
import type { ComponentWithMilestones, ComponentFilters } from "../../types";

interface TabletDashboardProps {
  projectId: string;
  projectName: string;
  metrics: DashboardMetrics | null;
  testPackageReadiness: TestPackageReadiness | null;
  onProjectChange?: (projectId: string) => void;
  onRefresh?: () => void;
  availableProjects?: Array<{ id: string; jobName: string }>;
}

/**
 * Tablet Dashboard (768-1024px) - UPDATE-FIRST Layout
 * Focus on quick updates and component management, minimal analytics
 */
export function TabletDashboard({
  projectId,
  projectName,
  metrics,
  testPackageReadiness,
  onProjectChange,
  onRefresh,
  availableProjects = []
}: TabletDashboardProps) {
  const [components, setComponents] = useState<ComponentWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');

  // Load components on mount and when filters change
  useEffect(() => {
    loadComponents();
  }, [projectId, selectedArea]);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const filters: ComponentFilters = {
        search: searchQuery || undefined,
        area: selectedArea ? [selectedArea] : undefined
      };
      
      const result = await fetchDashboardComponentsClient(projectId, filters, 100, 0);
      setComponents(result.components);
    } catch (error) {
      console.error('Error loading components:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Debounce search
    const timeoutId = setTimeout(() => {
      loadComponents();
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadComponents(),
      onRefresh?.()
    ]);
    setRefreshing(false);
  };

  const handleMilestoneToggle = async (componentId: string, milestoneId: string, completed: boolean) => {
    // TODO: Implement milestone toggle API call
    console.log('Toggle milestone:', { componentId, milestoneId, completed });
    
    // Optimistic update
    setComponents(prev => prev.map(comp => {
      if (comp.id === componentId) {
        const updatedMilestones = comp.milestones.map(m => 
          m.id === milestoneId ? { ...m, isCompleted: completed } : m
        );
        return { ...comp, milestones: updatedMilestones };
      }
      return comp;
    }));
  };

  const handleBulkMarkComplete = async () => {
    if (selectedComponents.length === 0) return;
    
    // TODO: Implement bulk completion API call
    console.log('Bulk mark complete:', selectedComponents);
    setSelectedComponents([]);
  };

  const handleAddMilestone = () => {
    // TODO: Open milestone creation dialog
    console.log('Add milestone');
  };

  // Extract unique areas for filter
  const uniqueAreas = Array.from(
    new Set(components.map(c => c.area).filter(Boolean))
  ).sort();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left - Project selector */}
          <div className="flex-1 min-w-0">
            {availableProjects.length > 1 ? (
              <Select value={projectId} onValueChange={onProjectChange}>
                <SelectTrigger className="max-w-[280px]">
                  <SelectValue>
                    <span className="font-medium truncate">{projectName}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.jobName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <h1 className="font-semibold text-lg truncate">{projectName}</h1>
            )}
          </div>

          {/* Right - Search and Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search My Area"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border-b px-4 py-3">
        <QuickStatsChips 
          metrics={metrics} 
          testPackages={testPackageReadiness}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Filter Bar */}
          <div className="bg-white border-b px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Area
                  {selectedArea && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedArea}
                    </Badge>
                  )}
                </Button>
                
                {selectedComponents.length > 0 && (
                  <Badge variant="default" className="ml-2">
                    {selectedComponents.length} selected
                  </Badge>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                {components.length} components
              </div>
            </div>

            {/* Area Filter */}
            {showFilters && (
              <div className="mt-2 pt-2 border-t">
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Areas</SelectItem>
                    {uniqueAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Component List or Matrix View */}
          <div className="flex-1 p-4">
            {viewMode === 'list' ? (
              <ComponentList
                components={components}
                loading={loading}
                onMilestoneToggle={handleMilestoneToggle}
                searchable={false} // Search is handled in top bar
              />
            ) : (
              <MilestoneProgressMatrix
                components={components}
                showSystems={true}
                showTestPackages={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <ToggleGroup 
              type="single" 
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as 'list' | 'matrix')}
              size="sm"
              className="h-8"
            >
              <ToggleGroupItem value="list" aria-label="List View" className="px-2 h-7">
                <List className="h-3.5 w-3.5 mr-1" />
                List
              </ToggleGroupItem>
              <ToggleGroupItem value="matrix" aria-label="Matrix View" className="px-2 h-7">
                <Grid3x3 className="h-3.5 w-3.5 mr-1" />
                Matrix
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              onClick={handleAddMilestone}
              className="gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Milestone
            </Button>
            
            <Button
              variant="outline"
              onClick={handleBulkMarkComplete}
              disabled={selectedComponents.length === 0}
              className="gap-2"
              size="sm"
            >
              <Check className="h-4 w-4" />
              Mark Complete ({selectedComponents.length})
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <MoreVertical className="h-4 w-4" />
            More
          </Button>
        </div>
      </div>
    </div>
  );
}