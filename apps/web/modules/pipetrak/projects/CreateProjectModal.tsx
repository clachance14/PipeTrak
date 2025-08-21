"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { useToast } from "@ui/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@ui/components/form";

const createProjectSchema = z.object({
  jobNumber: z.string().min(1, "Job number is required").max(10, "Job number must be 10 characters or less"),
  jobName: z.string().min(1, "Job name is required").max(255, "Job name must be 255 characters or less"),
  client: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

type CreateProjectData = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { activeOrganization } = useActiveOrganization();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<CreateProjectData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      jobNumber: "",
      jobName: "",
      client: "",
      location: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateProjectData) => {
    if (!activeOrganization) {
      toast({
        title: "Error",
        description: "No organization selected",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await fetch("/api/pipetrak/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          organizationId: activeOrganization.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create project");
      }

      const project = await response.json();
      
      toast({
        title: "Project created",
        description: `${data.jobName} has been created successfully.`,
      });
      
      // Close modal and navigate to the new project
      onOpenChange(false);
      router.push(`/app/${activeOrganization.slug}/pipetrak/${project.id}/dashboard`);
      router.refresh();
      
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter the details for your new construction project.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2024-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Internal company job number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="jobName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SDO Tank Farm" {...field} />
                    </FormControl>
                    <FormDescription>
                      Project display name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ExxonMobil" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Houston, TX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief project description..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}