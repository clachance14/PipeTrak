"use client";

import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = "default", duration }: ToastOptions) => {
    const message = title || description || "";
    const descriptionText = title && description ? description : undefined;
    
    switch (variant) {
      case "destructive":
        sonnerToast.error(message, { 
          description: descriptionText,
          duration,
        });
        break;
      case "success":
        sonnerToast.success(message, { 
          description: descriptionText,
          duration,
        });
        break;
      default:
        sonnerToast(message, { 
          description: descriptionText,
          duration,
        });
    }
  };

  return { toast };
}