import { useMemo } from "react";
import type { FieldWeldRecord } from "../types";

// Field weld filter state interface
interface WeldFileFilterState {
  search: string;
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
}

type FieldWeldData = FieldWeldRecord;

interface UseWeldFileFiltersProps {
  fieldWelds: FieldWeldData[];
  filters: WeldFileFilterState;
}

export function useWeldFileFilters({ fieldWelds, filters }: UseWeldFileFiltersProps) {
  const filteredWelds = useMemo(() => {
    return fieldWelds.filter(weld => {
      const weldTypeCode = weld.weldType?.code ?? weld.weldTypeCode ?? '';
      const weldTypeDescription = weld.weldType?.description ?? '';

      // Search filter - searches across multiple fields
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          weld.weldIdNumber,
          weld.packageNumber,
          weld.drawing.number,
          weld.drawing.title,
          weld.drawingArea,
          weld.drawingSystem,
          weld.welder?.stencil,
          weld.welder?.name,
          weld.weldSize,
          weld.schedule,
          weldTypeCode,
          weldTypeDescription,
          weld.comments,
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Package Number filter
      if (filters.packageNumber !== 'all') {
        if (weld.packageNumber !== filters.packageNumber) {
          return false;
        }
      }

      // Drawing filter
      if (filters.drawing !== 'all') {
        if (weld.drawing.number !== filters.drawing) {
          return false;
        }
      }

      // Area filter
      if (filters.area !== 'all') {
        const weldArea = weld.drawingArea ?? weld.component?.area;
        if (weldArea !== filters.area) {
          return false;
        }
      }

      // System filter
      if (filters.system !== 'all') {
        const weldSystem = weld.drawingSystem ?? weld.component?.system;
        if (weldSystem !== filters.system) {
          return false;
        }
      }

      // Welder filter
      if (filters.welder !== 'all') {
        if (weld.welder?.stencil !== filters.welder) {
          return false;
        }
      }

      // Weld Status filter - based on actual field weld being made
      if (filters.weldStatus !== 'all') {
        let status = 'Unknown';
        if (weld.dateWelded) {
          status = 'Complete';  // Weld has been made
        } else {
          status = 'Pending';   // Weld not yet made
        }
        
        if (status !== filters.weldStatus) {
          return false;
        }
      }

      // NDE Result filter
      if (filters.ndeResult !== 'all') {
        if (filters.ndeResult === 'pending') {
          // Show welds with no NDE result
          if (weld.ndeResult) {
            return false;
          }
        } else if (filters.ndeResult.includes(',')) {
          // Handle multiple values like "Reject,Repair"
          const allowedResults = filters.ndeResult.split(',');
          if (!weld.ndeResult || !allowedResults.includes(weld.ndeResult)) {
            return false;
          }
        } else {
          // Single value filter
          if (weld.ndeResult !== filters.ndeResult) {
            return false;
          }
        }
      }

      // PWHT Status filter
      if (filters.pwhtStatus !== 'all') {
        let pwhtStatus = 'Not Required';
        if (weld.pwhtRequired) {
          pwhtStatus = weld.datePwht ? 'Complete' : 'Required';
        }
        
        if (pwhtStatus !== filters.pwhtStatus) {
          return false;
        }
      }

      // Weld Type filter
      if (filters.weldType !== 'all') {
        if (weldTypeCode !== filters.weldType) {
          return false;
        }
      }

      // Weld Size filter
      if (filters.weldSize !== 'all') {
        if (weld.weldSize !== filters.weldSize) {
          return false;
        }
      }

      // Schedule filter
      if (filters.schedule !== 'all') {
        if (weld.schedule !== filters.schedule) {
          return false;
        }
      }

      // Date Welded From filter
      if (filters.dateWeldedFrom) {
        if (!weld.dateWelded) {
          return false;
        }
        const weldDate = new Date(weld.dateWelded);
        const fromDate = new Date(filters.dateWeldedFrom);
        if (weldDate < fromDate) {
          return false;
        }
      }

      // Date Welded To filter
      if (filters.dateWeldedTo) {
        if (!weld.dateWelded) {
          return false;
        }
        const weldDate = new Date(weld.dateWelded);
        const toDate = new Date(filters.dateWeldedTo);
        // Set to end of day for "to" date
        toDate.setHours(23, 59, 59, 999);
        if (weldDate > toDate) {
          return false;
        }
      }

      // Date PWHT From filter
      if (filters.datePwhtFrom) {
        if (!weld.datePwht) {
          return false;
        }
        const pwhtDate = new Date(weld.datePwht);
        const fromDate = new Date(filters.datePwhtFrom);
        if (pwhtDate < fromDate) {
          return false;
        }
      }

      // Date PWHT To filter
      if (filters.datePwhtTo) {
        if (!weld.datePwht) {
          return false;
        }
        const pwhtDate = new Date(weld.datePwht);
        const toDate = new Date(filters.datePwhtTo);
        // Set to end of day for "to" date
        toDate.setHours(23, 59, 59, 999);
        if (pwhtDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [fieldWelds, filters]);

  // Summary statistics for filtered data
  const filterStats = useMemo(() => {
    const stats = {
      total: filteredWelds.length,
      complete: 0,
      pending: 0,
      ndeAccept: 0,
      ndeReject: 0,
      ndeRepair: 0,
      ndePending: 0,
      pwhtRequired: 0,
      pwhtComplete: 0,
    };

    filteredWelds.forEach(weld => {
      // Weld status stats - based on actual field weld being made
      if (weld.dateWelded) {
        stats.complete++;  // Weld has been made
      } else {
        stats.pending++;   // Weld not yet made
      }

      // NDE stats
      switch (weld.ndeResult) {
        case 'Accept':
          stats.ndeAccept++;
          break;
        case 'Reject':
          stats.ndeReject++;
          break;
        case 'Repair':
          stats.ndeRepair++;
          break;
        default:
          stats.ndePending++;
      }

      // PWHT stats
      if (weld.pwhtRequired) {
        stats.pwhtRequired++;
        if (weld.datePwht) {
          stats.pwhtComplete++;
        }
      }
    });

    return stats;
  }, [filteredWelds]);

  return {
    filteredWelds,
    filterStats,
    filteredCount: filteredWelds.length,
    totalCount: fieldWelds.length,
  };
}
