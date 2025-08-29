"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import { Input } from "@ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { Progress } from "@ui/components/progress";
import { Badge } from "@ui/components/badge";
import { Checkbox } from "@ui/components/checkbox";
import { 
  AlertCircle, 
  Package,
  MapPin,
  Wrench,
  FileText,
  Users,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import type { ComponentWithMilestones } from "../../types";

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComponents: ComponentWithMilestones[];
  onUpdate: (updates: any) => Promise<void>;
}

export function BulkUpdateModal({ 
  isOpen, 
  onClose, 
  selectedComponents,
  onUpdate 
}: BulkUpdateModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  
  // Track which fields to update
  const [fieldsToUpdate, setFieldsToUpdate] = useState({
    status: false,
    area: false,
    system: false,
    testPackage: false,
    type: false,
    size: false,
    spec: false,
    material: false,
    description: false,
  });

  // Field values
  const [fieldValues, setFieldValues] = useState({
    status: "NO_CHANGE",
    area: "",
    system: "",
    testPackage: "",
    type: "",
    size: "",
    spec: "",
    material: "",
    description: "",
  });

  const handleFieldToggle = (field: string) => {
    setFieldsToUpdate(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handleFieldChange = (field: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBulkUpdate = async () => {
    // Prepare updates object with only selected fields
    const updates: any = {};
    Object.keys(fieldsToUpdate).forEach(field => {
      if (fieldsToUpdate[field as keyof typeof fieldsToUpdate] && 
          fieldValues[field as keyof typeof fieldValues] !== "NO_CHANGE") {
        updates[field] = fieldValues[field as keyof typeof fieldValues];
      }
    });

    if (Object.keys(updates).length === 0) {
      toast.error("Please select at least one field to update");
      return;
    }

    setIsUpdating(true);
    setUpdateProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUpdateProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onUpdate(updates);
      
      clearInterval(progressInterval);
      setUpdateProgress(100);
      
      toast.success(`Successfully updated ${selectedComponents.length} components`);
      
      // Reset form and close
      setTimeout(() => {
        onClose();
        setFieldsToUpdate({
          status: false,
          area: false,
          system: false,
          testPackage: false,
          type: false,
          size: false,
          spec: false,
          material: false,
          description: false,
        });
        setFieldValues({
          status: "NO_CHANGE",
          area: "",
          system: "",
          testPackage: "",
          type: "",
          size: "",
          spec: "",
          material: "",
          description: "",
        });
        setUpdateProgress(0);
      }, 500);
    } catch (error) {
      toast.error("Failed to update components");
      console.error("Bulk update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get unique values from selected components for preview
  const getUniqueValues = (field: keyof ComponentWithMilestones) => {
    const values = new Set(selectedComponents.map(c => c[field]).filter(Boolean));
    return Array.from(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Update Components
          </DialogTitle>
          <DialogDescription>
            Update {selectedComponents.length} selected component{selectedComponents.length !== 1 ? 's' : ''}. 
            Select the fields you want to update.
          </DialogDescription>
        </DialogHeader>

        {isUpdating ? (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto text-blue-600 animate-spin mb-4" />
              <p className="text-lg font-medium">Updating Components...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Processing {selectedComponents.length} components
              </p>
            </div>
            <Progress value={updateProgress} className="w-full" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Selected Components Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Selected Components</h4>
              <div className="flex flex-wrap gap-2">
                {selectedComponents.slice(0, 5).map(comp => (
                  <Badge key={comp.id} status="info">
                    {comp.componentId}
                  </Badge>
                ))}
                {selectedComponents.length > 5 && (
                  <Badge status="info">
                    +{selectedComponents.length - 5} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Update Fields */}
            <div className="space-y-4">
              {/* Status Update */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fieldsToUpdate.status}
                    onCheckedChange={() => handleFieldToggle('status')}
                  />
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Status
                  </Label>
                </div>
                {fieldsToUpdate.status && (
                  <Select
                    value={fieldValues.status}
                    onValueChange={(value) => handleFieldChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_CHANGE">No Change</SelectItem>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Area Update */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fieldsToUpdate.area}
                    onCheckedChange={() => handleFieldToggle('area')}
                  />
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Area
                  </Label>
                  {getUniqueValues('area').length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Current: {getUniqueValues('area').join(', ')}
                    </span>
                  )}
                </div>
                {fieldsToUpdate.area && (
                  <Input
                    value={fieldValues.area}
                    onChange={(e) => handleFieldChange('area', e.target.value)}
                    placeholder="Enter new area"
                  />
                )}
              </div>

              {/* System Update */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fieldsToUpdate.system}
                    onCheckedChange={() => handleFieldToggle('system')}
                  />
                  <Label className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    System
                  </Label>
                  {getUniqueValues('system').length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Current: {getUniqueValues('system').join(', ')}
                    </span>
                  )}
                </div>
                {fieldsToUpdate.system && (
                  <Input
                    value={fieldValues.system}
                    onChange={(e) => handleFieldChange('system', e.target.value)}
                    placeholder="Enter new system"
                  />
                )}
              </div>

              {/* Test Package Update */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fieldsToUpdate.testPackage}
                    onCheckedChange={() => handleFieldToggle('testPackage')}
                  />
                  <Label className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Test Package
                  </Label>
                  {getUniqueValues('testPackage').length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Current: {getUniqueValues('testPackage').join(', ')}
                    </span>
                  )}
                </div>
                {fieldsToUpdate.testPackage && (
                  <Input
                    value={fieldValues.testPackage}
                    onChange={(e) => handleFieldChange('testPackage', e.target.value)}
                    placeholder="Enter new test package"
                  />
                )}
              </div>

              {/* Type Update */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fieldsToUpdate.type}
                    onCheckedChange={() => handleFieldToggle('type')}
                  />
                  <Label>Type</Label>
                </div>
                {fieldsToUpdate.type && (
                  <Input
                    value={fieldValues.type}
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                    placeholder="Enter new type"
                  />
                )}
              </div>

              {/* Size Update */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fieldsToUpdate.size}
                    onCheckedChange={() => handleFieldToggle('size')}
                  />
                  <Label>Size</Label>
                </div>
                {fieldsToUpdate.size && (
                  <Input
                    value={fieldValues.size}
                    onChange={(e) => handleFieldChange('size', e.target.value)}
                    placeholder="Enter new size"
                  />
                )}
              </div>

              {/* Description Update */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fieldsToUpdate.description}
                    onCheckedChange={() => handleFieldToggle('description')}
                  />
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </Label>
                </div>
                {fieldsToUpdate.description && (
                  <Textarea
                    value={fieldValues.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Enter new description"
                    rows={3}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {!isUpdating && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpdate}
              disabled={Object.values(fieldsToUpdate).every(v => !v)}
            >
              Update {selectedComponents.length} Components
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}