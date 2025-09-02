"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Input } from "@ui/components/input";
import { 
  Filter, 
  X, 
  Search,
  RotateCcw,
} from "lucide-react";
import { cn } from "@ui/lib";

// Field weld data structure from FieldWeldTable.tsx
interface FieldWeldData {
  id: string;
  weldIdNumber: string;
  dateWelded?: string;
  weldSize: string;
  schedule: string;
  ndeResult?: string;
  pwhtRequired: boolean;
  datePwht?: string;
  comments?: string;
  packageNumber: string;
  welder?: {
    id: string;
    stencil: string;
    name: string;
  };
  drawing: {
    id: string;
    number: string;
    title: string;
  };
  weldType: {
    code: string;
    description: string;
  };
  component?: {
    id: string;
    componentId: string;
    displayId: string;
    area: string;
    system: string;
    testPackage: string;
    status: string;
    completionPercent: number;
    milestones: Array<{
      id: string;
      milestoneName: string;
      isCompleted: boolean;
      completedAt?: string;
      completedBy?: string;
      milestoneOrder: number;
      weight: number;
    }>;
  };
}

export interface WeldFilterState {
  packageNumber: string;
  drawing: string;
  area: string;
  system: string;
  welder: string;
  weldStatus: string;
  ndeResult: string;
  pwhtStatus: string;
  weldType: string;
  weldSize: string;
  schedule: string;
  dateWeldedFrom: string;
  dateWeldedTo: string;
  datePwhtFrom: string;
  datePwhtTo: string;
  search: string;
}

interface WeldFilterBarProps {
  fieldWelds: FieldWeldData[];
  onFilterChange: (filters: WeldFilterState) => void;
  filteredCount: number;
  totalCount: number;
  className?: string;
}

const DEFAULT_FILTERS: WeldFilterState = {
  packageNumber: 'all',
  drawing: 'all',
  area: 'all',
  system: 'all',
  welder: 'all',
  weldStatus: 'all',
  ndeResult: 'all',
  pwhtStatus: 'all',
  weldType: 'all',
  weldSize: 'all',
  schedule: 'all',
  dateWeldedFrom: '',
  dateWeldedTo: '',
  datePwhtFrom: '',
  datePwhtTo: '',
  search: ''
};

const NDE_RESULT_OPTIONS = [
  { value: 'all', label: 'All NDE Results' },
  { value: 'Accept', label: 'Accept' },
  { value: 'Reject', label: 'Reject' },
  { value: 'Repair', label: 'Repair' },
  { value: 'pending', label: 'Pending' },
] as const;

const WELD_STATUS_OPTIONS = [
  { value: 'all', label: 'All Weld Status' },
  { value: 'Complete', label: 'Complete' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Unknown', label: 'Unknown' },
] as const;

const PWHT_STATUS_OPTIONS = [
  { value: 'all', label: 'All PWHT Status' },
  { value: 'Required', label: 'PWHT Required' },
  { value: 'Complete', label: 'PWHT Complete' },
  { value: 'Not Required', label: 'Not Required' },
] as const;

// QC Inspector focused presets
const QC_PRESETS = [
  {
    id: 'ready-for-nde',
    label: 'Ready for NDE',
    filters: { ...DEFAULT_FILTERS, weldStatus: 'Complete', ndeResult: 'pending' }
  },
  {
    id: 'failed-inspection',
    label: 'Failed Inspection',
    filters: { ...DEFAULT_FILTERS, ndeResult: 'Reject,Repair' }
  },
  {
    id: 'pwht-outstanding',
    label: 'PWHT Outstanding',
    filters: { ...DEFAULT_FILTERS, pwhtStatus: 'Required' }
  },
  {
    id: 'todays-completions',
    label: "Today's Completions",
    filters: { ...DEFAULT_FILTERS, dateWeldedFrom: new Date().toISOString().split('T')[0] }
  },
] as const;

export function WeldFilterBar({ 
  fieldWelds, 
  onFilterChange, 
  filteredCount,
  totalCount,
  className 
}: WeldFilterBarProps) {
  const [filters, setFilters] = useState<WeldFilterState>(DEFAULT_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load saved filters from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pipetrak-weld-filters');
      if (saved) {
        const savedFilters = JSON.parse(saved);
        setFilters(savedFilters);
        onFilterChange(savedFilters);
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error);
    }
  }, [onFilterChange]);

  // Extract unique values from field welds for filter options
  const filterOptions = useMemo(() => {
    const packageNumbers = new Set<string>();
    const drawings = new Set<string>();
    const areas = new Set<string>();
    const systems = new Set<string>();
    const welders = new Set<string>();
    const weldTypes = new Set<string>();
    const weldSizes = new Set<string>();
    const schedules = new Set<string>();

    fieldWelds.forEach(weld => {
      if (weld.packageNumber && weld.packageNumber !== "TBD") packageNumbers.add(weld.packageNumber);
      if (weld.drawing.number) drawings.add(weld.drawing.number);
      if (weld.component?.area) areas.add(weld.component.area);
      if (weld.component?.system) systems.add(weld.component.system);
      if (weld.welder?.stencil) welders.add(weld.welder.stencil);
      if (weld.weldType.code) weldTypes.add(weld.weldType.code);
      if (weld.weldSize) weldSizes.add(weld.weldSize);
      if (weld.schedule) schedules.add(weld.schedule);
    });

    return {
      packageNumbers: Array.from(packageNumbers).sort(),
      drawings: Array.from(drawings).sort(),
      areas: Array.from(areas).sort(),
      systems: Array.from(systems).sort(),
      welders: Array.from(welders).sort(),
      weldTypes: Array.from(weldTypes).sort(),
      weldSizes: Array.from(weldSizes).sort(),
      schedules: Array.from(schedules).sort(),
    };
  }, [fieldWelds]);

  // Save to localStorage and notify parent when filters change
  const handleFilterChange = (key: keyof WeldFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Save to localStorage
    try {
      localStorage.setItem('pipetrak-weld-filters', JSON.stringify(newFilters));
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
    
    onFilterChange(newFilters);
  };

  // Apply preset filters
  const applyPreset = (presetFilters: Partial<WeldFilterState>) => {
    const newFilters = { ...DEFAULT_FILTERS, ...presetFilters };
    setFilters(newFilters);
    
    try {
      localStorage.setItem('pipetrak-weld-filters', JSON.stringify(newFilters));
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
    
    onFilterChange(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    try {
      localStorage.removeItem('pipetrak-weld-filters');
    } catch (error) {
      console.error('Failed to clear saved filters:', error);
    }
    onFilterChange(DEFAULT_FILTERS);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search' || key.includes('From') || key.includes('To')) return value !== '';
    return value !== 'all';
  });

  // Count active filters for badge
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search' || key.includes('From') || key.includes('To')) return value !== '';
    return value !== 'all';
  }).length;

  return (
    <div className={cn("space-y-4 p-4 bg-gray-50 rounded-lg border", className)}>
      {/* QC Presets Row */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center font-medium">Quick Filters:</span>
        {QC_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            size="sm"
            onClick={() => applyPreset(preset.filters)}
            className="h-8 text-xs"
          >
            {preset.label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-8 text-xs ml-auto"
        >
          {showAdvanced ? 'Basic' : 'Advanced'} Filters
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col gap-4">
        {/* Top Row - Search and Primary Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search welds..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAllFilters}
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
        </div>

        {/* Primary Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Package Filter */}
          <Select
            value={filters.packageNumber}
            onValueChange={(value) => handleFilterChange('packageNumber', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Package" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Packages</SelectItem>
              {filterOptions.packageNumbers.map(packageNumber => (
                <SelectItem key={packageNumber} value={packageNumber}>
                  {packageNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Area Filter */}
          <Select
            value={filters.area}
            onValueChange={(value) => handleFilterChange('area', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {filterOptions.areas.map(area => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* System Filter */}
          <Select
            value={filters.system}
            onValueChange={(value) => handleFilterChange('system', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="System" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              {filterOptions.systems.map(system => (
                <SelectItem key={system} value={system}>
                  {system}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Weld Status Filter */}
          <Select
            value={filters.weldStatus}
            onValueChange={(value) => handleFilterChange('weldStatus', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Weld Status" />
            </SelectTrigger>
            <SelectContent>
              {WELD_STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* NDE Result Filter */}
          <Select
            value={filters.ndeResult}
            onValueChange={(value) => handleFilterChange('ndeResult', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="NDE Result" />
            </SelectTrigger>
            <SelectContent>
              {NDE_RESULT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* PWHT Status Filter */}
          <Select
            value={filters.pwhtStatus}
            onValueChange={(value) => handleFilterChange('pwhtStatus', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="PWHT" />
            </SelectTrigger>
            <SelectContent>
              {PWHT_STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Row */}
        {showAdvanced && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t">
            {/* Drawing Filter */}
            <Select
              value={filters.drawing}
              onValueChange={(value) => handleFilterChange('drawing', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Drawing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drawings</SelectItem>
                {filterOptions.drawings.map(drawing => (
                  <SelectItem key={drawing} value={drawing}>
                    {drawing}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Welder Filter */}
            <Select
              value={filters.welder}
              onValueChange={(value) => handleFilterChange('welder', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Welder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Welders</SelectItem>
                {filterOptions.welders.map(welder => (
                  <SelectItem key={welder} value={welder}>
                    {welder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Weld Type Filter */}
            <Select
              value={filters.weldType}
              onValueChange={(value) => handleFilterChange('weldType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.weldTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Weld Size Filter */}
            <Select
              value={filters.weldSize}
              onValueChange={(value) => handleFilterChange('weldSize', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                {filterOptions.weldSizes.map(size => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Schedule Filter */}
            <Select
              value={filters.schedule}
              onValueChange={(value) => handleFilterChange('schedule', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schedules</SelectItem>
                {filterOptions.schedules.map(schedule => (
                  <SelectItem key={schedule} value={schedule}>
                    Sch {schedule}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Welded From */}
            <Input
              type="date"
              placeholder="Welded From"
              value={filters.dateWeldedFrom}
              onChange={(e) => handleFilterChange('dateWeldedFrom', e.target.value)}
              className="text-sm"
            />
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>
            Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> field welds
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </Badge>
          )}
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1 max-w-md">
            {filters.search && (
              <Badge variant="outline" className="text-xs">
                Search: {filters.search}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => handleFilterChange('search', '')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {Object.entries(filters).map(([key, value]) => {
              if (key === 'search' || value === 'all' || value === '') return null;
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return (
                <Badge key={key} variant="outline" className="text-xs">
                  {label}: {value}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleFilterChange(key as keyof WeldFilterState, key.includes('From') || key.includes('To') ? '' : 'all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}