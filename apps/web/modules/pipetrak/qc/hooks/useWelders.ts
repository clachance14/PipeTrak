"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Welder {
  id: string;
  projectId: string;
  stencil: string;
  name: string;
  active: boolean;
  weldCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWelderData {
  projectId: string;
  stencil: string;
  name: string;
  active?: boolean;
}

export interface UpdateWelderData {
  name?: string;
  active?: boolean;
}

export interface WelderFileFilters {
  projectId: string;
  active?: boolean;
  search?: string;
}

// Get all welders for a project
export function useWelders(filters: WelderFileFilters) {
  return useQuery({
    queryKey: ["welders", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("projectId", filters.projectId);
      
      if (filters.active !== undefined) {
        params.append("active", String(filters.active));
      }
      
      if (filters.search) {
        params.append("search", filters.search);
      }

      const response = await fetch(`/api/pipetrak/welders?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch welders");
      }
      
      const data = await response.json();
      return data.welders as Welder[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get a single welder by ID
export function useWelder(id: string | null) {
  return useQuery({
    queryKey: ["welder", id],
    queryFn: async () => {
      if (!id) throw new Error("Welder ID required");
      
      const response = await fetch(`/api/pipetrak/welders/${id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch welder");
      }
      
      const data = await response.json();
      return data.welder as Welder;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create a new welder
export function useCreateWelder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateWelderData) => {
      const response = await fetch("/api/pipetrak/welders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create welder");
      }
      
      return response.json();
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch welders list
      queryClient.invalidateQueries({
        queryKey: ["welders", { projectId: variables.projectId }],
      });
      
      toast.success("Welder created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create welder");
    },
  });
}

// Update a welder
export function useUpdateWelder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWelderData }) => {
      const response = await fetch(`/api/pipetrak/welders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update welder");
      }
      
      return response.json();
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific welder and welders list
      queryClient.invalidateQueries({
        queryKey: ["welder", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["welders"],
      });
      
      toast.success("Welder updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update welder");
    },
  });
}

// Delete/deactivate a welder
export function useDeleteWelder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pipetrak/welders/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete welder");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate welders list
      queryClient.invalidateQueries({
        queryKey: ["welders"],
      });
      
      toast.success(data.message || "Welder deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete welder");
    },
  });
}

// Get welder statistics
export function useWelderStats(id: string | null) {
  return useQuery({
    queryKey: ["welderStats", id],
    queryFn: async () => {
      if (!id) throw new Error("Welder ID required");
      
      const response = await fetch(`/api/pipetrak/welders/${id}/stats`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch welder statistics");
      }
      
      return response.json();
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}