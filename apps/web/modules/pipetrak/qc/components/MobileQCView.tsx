"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Card, CardContent } from "@ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { 
  Search, 
  FileFilter, 
  Plus, 
  RefreshCw,
  CheckCircle22,
  XCircle,
  Clock,
  FlameKindling
} from "lucide-react";
import { FieldWeldCard } from "./FieldWeldCard";
import { AddWeldModal } from "./AddWeldModal";
import { MarkWeldCompleteModal } from "./MarkWeldCompleteModal";
import { toast } from "sonner";
import { cn } from "@ui/lib";

// Types from FieldWeldTable
interface FieldWeldData {
  id: string;
  weldIdNumber: string;
  dateWelded?: string;
  weldSize: string;
  schedule: string;
  ndeType?: 'Visual' | 'RT' | 'UT' | 'MT' | 'PT' | 'None';
  ndeResult?: 'Accept' | 'Reject';
  ndeDate?: string;
  ndeInspector?: string;
  pwhtRequired: boolean;
  datePwht?: string;
  comments?: string;
  packageNumber: string;
  welder?: {
    id: string;
    stencil: string;
    name: string;
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
    }>;
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
}

interface MobileQCViewProps {
  projectId: string;
  organizationSlug: string;
}

export function MobileQCView({ projectId, organizationSlug: _organizationSlug }: MobileQCViewProps) {
  const router = useRouter();
  const [data, setData] = useState<FieldWeldData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageFileFilter, setPackageFileFilter] = useState<string>("all");
  const [ndeFileFilter, setNdeFileFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFileFilters, setShowFileFilters] = useState(false);
  const [selectedWeld, setSelectedWeld] = useState<FieldWeldData | null>(null);
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = data.length;
    const pending = data.filter(w => !w.ndeResult).length;
    const accepted = data.filter(w => w.ndeResult === 'Accept').length;
    const rejected = data.filter(w => w.ndeResult === 'Reject').length;
    const pwhtRequired = data.filter(w => w.pwhtRequired).length;
    const pwhtCompleted = data.filter(w => w.pwhtRequired && w.datePwht).length;

    return { total, pending, accepted, rejected, pwhtRequired, pwhtCompleted };
  }, [data]);

  // FileFilter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(weld => {
      // Search filter
      const searchMatch = !searchQuery || 
        weld.weldIdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        weld.packageNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        weld.drawing.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        weld.welder?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        weld.welder?.stencil.toLowerCase().includes(searchQuery.toLowerCase());

      // Package filter
      const packageMatch = packageFileFilter === "all" || weld.packageNumber === packageFileFilter;

      // NDE filter
      let ndeMatch = true;
      if (ndeFileFilter === "pending") {
        ndeMatch = !weld.ndeResult;
      } else if (ndeFileFilter !== "all") {
        ndeMatch = weld.ndeResult === ndeFileFilter;
      }

      return searchMatch && packageMatch && ndeMatch;
    });
  }, [data, searchQuery, packageFileFilter, ndeFileFilter]);

  // Get unique packages for filter
  const uniquePackages = useMemo(() => {
    return Array.from(new Set(data.map(w => w.packageNumber))).sort();
  }, [data]);

  // Fetch data
  const fetchFieldWelds = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pipetrak/field-welds?projectId=${projectId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.fieldWelds || []);
      } else {
        toast.error("Failed to fetch field welds");
      }
    } catch (error) {
      console.error("Failed to fetch field welds:", error);
      toast.error("Failed to fetch field welds");
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchFieldWelds();
  }, [projectId]);

  // Selection handlers
  const handleSelectWeld = (weldId: string, selected: boolean) => {
    const newSelection = new Set(selectedIds);
    if (selected) {
      newSelection.add(weldId);
    } else {
      newSelection.delete(weldId);
    }
    setSelectedIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      // All selected, clear selection
      setSelectedIds(new Set());
    } else {
      // Select all filtered items
      setSelectedIds(new Set(filteredData.map(w => w.id)));
    }
  };

  // QC Action handlers
  const handleApproveWeld = async (weldId: string) => {
    try {
      const response = await fetch(`/api/pipetrak/field-welds/${weldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ndeResult: 'Accept' })
      });

      if (response.ok) {
        setData(prev => prev.map(w => 
          w.id === weldId ? { ...w, ndeResult: 'Accept' } : w
        ));
        toast.success("NDE result updated to Accept");
      } else {
        toast.error("Failed to update NDE result");
      }
    } catch (error) {
      console.error("Failed to approve weld:", error);
      toast.error("Failed to update NDE result");
    }
  };

  const handleRejectWeld = async (weldId: string) => {
    try {
      const response = await fetch(`/api/pipetrak/field-welds/${weldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ndeResult: 'Reject' })
      });

      if (response.ok) {
        setData(prev => prev.map(w => 
          w.id === weldId ? { ...w, ndeResult: 'Reject' } : w
        ));
        toast.success("NDE result updated to Reject");
      } else {
        toast.error("Failed to update NDE result");
      }
    } catch (error) {
      console.error("Failed to reject weld:", error);
      toast.error("Failed to update NDE result");
    }
  };

  const handleEditWeld = (weldId: string) => {
    // For now, just show a toast. Can implement edit modal later
    toast.info("Edit functionality coming soon");
  };

  const handleWeldClick = (weld: FieldWeldData) => {
    // Navigate to detailed view or show details modal
    console.log("Clicked weld:", weld);
    toast.info("Detailed view coming soon");
  };

  const handleAddWeldSuccess = () => {
    fetchFieldWelds(); // Refresh data
    toast.success("Field weld added successfully");
  };

  const handleMarkComplete = (weld: FieldWeldData) => {
    setSelectedWeld(weld);
    setShowMarkCompleteModal(true);
  };

  const handleMarkCompleteSuccess = () => {
    fetchFieldWelds(); // Refresh data
    setSelectedWeld(null);
    toast.success("Weld marked as complete successfully");
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Mobile header with search and actions */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search welds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => setShowFileFilters(!showFileFilters)}
              className={cn(showFileFilters && "bg-accent")}
            >
              <FileFilter className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={fetchFieldWelds}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>

          {/* FileFilters - collapsible */}
          {showFileFilters && (
            <div className="grid grid-cols-2 gap-2">
              <Select value={packageFileFilter} onValueChange={setPackageFileFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  {uniquePackages.map(pkg => (
                    <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={ndeFileFilter} onValueChange={setNdeFileFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="NDE Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="Accept">Accept</SelectItem>
                  <SelectItem value="Reject">Reject</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toast.info("Bulk actions coming soon")}
                >
                  Bulk Actions
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid3x3 */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700 font-medium">Pending NDE</p>
                <p className="text-lg font-bold text-blue-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle22 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-green-700 font-medium">Accepted</p>
                <p className="text-lg font-bold text-green-900">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-red-700 font-medium">Rejected</p>
                <p className="text-lg font-bold text-red-900">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <FlameKindling className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-orange-700 font-medium">PWHT Done</p>
                <p className="text-lg font-bold text-orange-900">
                  {stats.pwhtCompleted}/{stats.pwhtRequired}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action row */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {filteredData.length} of {data.length} welds
          {selectedIds.size > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={handleSelectAll}
              className="p-0 ml-2 h-auto"
            >
              {selectedIds.size === filteredData.length ? "Clear all" : "Select all"}
            </Button>
          )}
        </div>
        
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Weld
        </Button>
      </div>

      {/* Field Weld Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading field welds...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || packageFileFilter !== "all" || ndeFileFilter !== "all" 
              ? "No field welds match your filters"
              : "No field welds found"
            }
          </div>
        ) : (
          filteredData.map((weld) => (
            <FieldWeldCard
              key={weld.id}
              fieldWeld={weld}
              isSelected={selectedIds.has(weld.id)}
              onSelect={(selected) => handleSelectWeld(weld.id, selected)}
              onApprove={() => handleApproveWeld(weld.id)}
              onReject={() => handleRejectWeld(weld.id)}
              onEdit={() => handleEditWeld(weld.id)}
              onMarkComplete={() => handleMarkComplete(weld)}
              onClick={() => handleWeldClick(weld)}
            />
          ))
        )}
      </div>

      {/* Add Weld Modal */}
      <AddWeldModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        projectId={projectId}
        onSuccess={handleAddWeldSuccess}
      />

      {/* Mark Weld Complete Modal */}
      {selectedWeld && (
        <MarkWeldCompleteModal
          open={showMarkCompleteModal}
          onOpenChange={setShowMarkCompleteModal}
          fieldWeld={{
            id: selectedWeld.id,
            weldIdNumber: selectedWeld.weldIdNumber,
            projectId,
          }}
          onSuccess={handleMarkCompleteSuccess}
        />
      )}
    </div>
  );
}