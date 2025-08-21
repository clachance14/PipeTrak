"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Calendar } from "@ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/components/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@ui/lib";

interface AddWeldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

interface WeldFormData {
  weldIdNumber: string;
  drawingId: string;
  weldSize: string;
  schedule: string;
  weldTypeCode: string;
  dateWelded: Date | undefined;
  welderId?: string;
  xrayPercent?: number;
  baseMetal?: string;
  pwhtRequired: boolean;
  comments?: string;
}

export function AddWeldModal({ open, onOpenChange, projectId, onSuccess }: AddWeldModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WeldFormData>({
    weldIdNumber: "",
    drawingId: "",
    weldSize: "",
    schedule: "",
    weldTypeCode: "",
    dateWelded: new Date(),
    pwhtRequired: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/pipetrak/field-welds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          projectId,
          dateWelded: formData.dateWelded?.toISOString(),
        }),
      });

      if (response.ok) {
        onSuccess?.();
        onOpenChange(false);
        setFormData({
          weldIdNumber: "",
          drawingId: "",
          weldSize: "",
          schedule: "",
          weldTypeCode: "",
          dateWelded: new Date(),
          pwhtRequired: false,
        });
      } else {
        const error = await response.json();
        console.error("Failed to create weld:", error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error("Error creating weld:", error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof WeldFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Field Weld</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Weld ID */}
            <div className="space-y-2">
              <Label htmlFor="weldId">Weld ID *</Label>
              <Input
                id="weldId"
                value={formData.weldIdNumber}
                onChange={(e) => updateFormData("weldIdNumber", e.target.value)}
                placeholder="W-001"
                required
              />
            </div>

            {/* Drawing ID */}
            <div className="space-y-2">
              <Label htmlFor="drawingId">Drawing ID *</Label>
              <Input
                id="drawingId"
                value={formData.drawingId}
                onChange={(e) => updateFormData("drawingId", e.target.value)}
                placeholder="Select drawing..."
                required
              />
              {/* TODO: Replace with drawing selector */}
            </div>

            {/* Weld Size */}
            <div className="space-y-2">
              <Label htmlFor="weldSize">Size *</Label>
              <Input
                id="weldSize"
                value={formData.weldSize}
                onChange={(e) => updateFormData("weldSize", e.target.value)}
                placeholder="6 inch, 12x4, DN150"
                required
              />
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule *</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => updateFormData("schedule", e.target.value)}
                placeholder="40, 80, STD, XS"
                required
              />
            </div>

            {/* Weld Type */}
            <div className="space-y-2">
              <Label htmlFor="weldType">Weld Type *</Label>
              <Select
                value={formData.weldTypeCode}
                onValueChange={(value) => updateFormData("weldTypeCode", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weld type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BW">Butt Weld</SelectItem>
                  <SelectItem value="SW">Socket Weld</SelectItem>
                  <SelectItem value="FW">Fillet Weld</SelectItem>
                  {/* TODO: Load from WeldType table */}
                </SelectContent>
              </Select>
            </div>

            {/* Date Welded */}
            <div className="space-y-2">
              <Label>Date Welded *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dateWelded && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateWelded ? (
                      format(formData.dateWelded, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dateWelded}
                    onSelect={(date) => updateFormData("dateWelded", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* X-Ray Percentage */}
            <div className="space-y-2">
              <Label htmlFor="xrayPercent">X-Ray %</Label>
              <Input
                id="xrayPercent"
                type="number"
                min="0"
                max="100"
                value={formData.xrayPercent || ""}
                onChange={(e) => updateFormData("xrayPercent", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0-100"
              />
            </div>

            {/* Base Metal */}
            <div className="space-y-2">
              <Label htmlFor="baseMetal">Base Metal</Label>
              <Input
                id="baseMetal"
                value={formData.baseMetal || ""}
                onChange={(e) => updateFormData("baseMetal", e.target.value)}
                placeholder="A106 Gr B, 304L"
              />
            </div>
          </div>

          {/* PWHT Required */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="pwhtRequired"
              checked={formData.pwhtRequired}
              onChange={(e) => updateFormData("pwhtRequired", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="pwhtRequired">PWHT Required</Label>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <textarea
              id="comments"
              value={formData.comments || ""}
              onChange={(e) => updateFormData("comments", e.target.value)}
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Weld"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}