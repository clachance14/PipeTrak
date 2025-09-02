"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Checkbox } from "@ui/components/checkbox";
import { Alert, AlertDescription } from "@ui/components/alert";
import { AlertCircle, UserPlus } from "lucide-react";
import { useCreateWelder, type CreateWelderData } from "../hooks/useWelders";

interface AddWelderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

interface WelderFormData {
  stencil: string;
  name: string;
  active: boolean;
}

export function AddWelderModal({ open, onOpenChange, projectId }: AddWelderModalProps) {
  const [formData, setFormData] = useState<WelderFormData>({
    stencil: "",
    name: "",
    active: true,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const createWelderMutation = useCreateWelder();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate stencil
    if (!formData.stencil.trim()) {
      errors.stencil = "Stencil is required";
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.stencil)) {
      errors.stencil = "Stencil must contain only letters, numbers, and hyphens";
    }

    // Validate name
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const welderData: CreateWelderData = {
      projectId,
      stencil: formData.stencil.trim(),
      name: formData.name.trim(),
      active: formData.active,
    };

    try {
      await createWelderMutation.mutateAsync(welderData);
      
      // Reset form and close modal on success
      setFormData({
        stencil: "",
        name: "",
        active: true,
      });
      setValidationErrors({});
      onOpenChange(false);
    } catch (error) {
      // Error is already handled by the hook
      console.error("Failed to create welder:", error);
    }
  };

  const updateFormData = (field: keyof WelderFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleClose = () => {
    if (!createWelderMutation.isPending) {
      setFormData({
        stencil: "",
        name: "",
        active: true,
      });
      setValidationErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Welder</DialogTitle>
          <DialogDescription>
            Create a new welder record. Stencil must be unique across all projects.
          </DialogDescription>
        </DialogHeader>

        {createWelderMutation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="text-base">
              {createWelderMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stencil */}
          <div className="space-y-2">
            <Label htmlFor="stencil">
              Stencil <span className="text-destructive">*</span>
            </Label>
            <Input
              id="stencil"
              value={formData.stencil}
              onChange={(e) => updateFormData("stencil", e.target.value)}
              placeholder="K-07, W-123, JD456"
              autoComplete="off"
              autoFocus
              className={validationErrors.stencil ? "border-destructive" : ""}
            />
            {validationErrors.stencil && (
              <p className="text-base font-medium text-destructive bg-destructive/10 p-3 rounded-md">{validationErrors.stencil}</p>
            )}
            <p className="text-sm text-muted-foreground font-medium">
              Letters, numbers, and hyphens only. Must be globally unique.
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              placeholder="John Doe"
              className={validationErrors.name ? "border-destructive" : ""}
            />
            {validationErrors.name && (
              <p className="text-base font-medium text-destructive bg-destructive/10 p-3 rounded-md">{validationErrors.name}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => updateFormData("active", Boolean(checked))}
            />
            <Label htmlFor="active">Active</Label>
            <p className="text-sm text-muted-foreground font-medium">
              Active welders can be assigned to field welds
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleClose}
              disabled={createWelderMutation.isPending}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="lg"
              disabled={createWelderMutation.isPending}
              className="min-h-[44px]"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              {createWelderMutation.isPending ? "Creating..." : "Create Welder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}