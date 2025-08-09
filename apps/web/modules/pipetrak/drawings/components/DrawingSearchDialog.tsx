"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, FileText, Clock, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@saas/shared/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@ui/components/command";
import { Badge } from "@ui/components/badge";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";
import type { DrawingSearchResult } from "../../types";

interface DrawingSearchDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDrawingSelect?: (drawingId: string) => void;
  recentDrawings?: DrawingSearchResult[];
}

export function DrawingSearchDialog({
  projectId,
  open,
  onOpenChange,
  onDrawingSelect,
  recentDrawings = [],
}: DrawingSearchDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DrawingSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search for drawings
  const searchDrawings = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/pipetrak/drawings/project/${projectId}/search?q=${encodeURIComponent(
          query
        )}&limit=20`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [projectId]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchDrawings(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, searchDrawings]);

  const handleDrawingSelect = (drawing: DrawingSearchResult) => {
    if (onDrawingSelect) {
      onDrawingSelect(drawing.id);
    } else {
      router.push(`/app/pipetrak/${projectId}/drawings/${drawing.id}`);
    }
    onOpenChange(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const renderBreadcrumb = (breadcrumb: { id: string; number: string; title: string }[]) => {
    if (breadcrumb.length === 0) return null;
    
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {breadcrumb.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3" />}
            <span className="truncate max-w-[100px]">{item.number}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Drawings</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by drawing number, title, or component..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-12"
          />
          <CommandList className="max-h-[400px]">
            {/* Recent Drawings */}
            {!searchQuery && recentDrawings.length > 0 && (
              <CommandGroup heading="Recent Drawings">
                {recentDrawings.map((drawing) => (
                  <CommandItem
                    key={drawing.id}
                    value={drawing.id}
                    onSelect={() => handleDrawingSelect(drawing)}
                    className="flex items-start gap-3 py-3"
                  >
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{drawing.number}</span>
                        {drawing.revision && (
                          <span className="text-xs text-muted-foreground">
                            Rev. {drawing.revision}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {drawing.title}
                      </div>
                      {renderBreadcrumb(drawing.breadcrumb)}
                    </div>
                    {drawing.componentCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {drawing.componentCount} components
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchQuery && recentDrawings.length > 0 && (
              <CommandSeparator />
            )}

            {/* Search Results */}
            {searchQuery && (
              <>
                {isSearching ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length === 0 ? (
                  <CommandEmpty>
                    No drawings found matching "{searchQuery}"
                  </CommandEmpty>
                ) : (
                  <CommandGroup heading="Search Results">
                    {searchResults.map((drawing) => (
                      <CommandItem
                        key={drawing.id}
                        value={drawing.id}
                        onSelect={() => handleDrawingSelect(drawing)}
                        className="flex items-start gap-3 py-3"
                      >
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{drawing.number}</span>
                            {drawing.revision && (
                              <span className="text-xs text-muted-foreground">
                                Rev. {drawing.revision}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {drawing.title}
                          </div>
                          {renderBreadcrumb(drawing.breadcrumb)}
                        </div>
                        {drawing.componentCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {drawing.componentCount} components
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// Trigger button for the search dialog
export function DrawingSearchTrigger({
  projectId,
  className,
}: {
  projectId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground",
          "border rounded-md hover:bg-accent hover:text-accent-foreground",
          "transition-colors",
          className
        )}
      >
        <Search className="h-4 w-4" />
        <span>Search drawings...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <DrawingSearchDialog
        projectId={projectId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}