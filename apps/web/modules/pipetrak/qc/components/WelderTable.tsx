"use client";

import { useState } from "react";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@ui/components/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ui/components/alert-dialog";
import { Checkbox } from "@ui/components/checkbox";
import { 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Loader2,
  Users
} from "lucide-react";
import { cn } from "@ui/lib";
import { 
  useWelders, 
  useUpdateWelder, 
  useDeleteWelder,
  type Welder,
  type UpdateWelderData
} from "../hooks/useWelders";

interface WelderTableProps {
  projectId: string;
}

interface EditWelderData {
  id: string;
  name: string;
  active: boolean;
}

export function WelderTable({ projectId }: WelderTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editingWelder, setEditingWelder] = useState<EditWelderData | null>(null);
  const [editName, setEditName] = useState("");

  const { data: welders = [], isLoading, error } = useWelders({
    projectId,
    active: showInactive ? undefined : true,
    search: searchTerm,
  });

  const updateWelderMutation = useUpdateWelder();
  const deleteWelderMutation = useDeleteWelder();

  const handleEditSubmit = async () => {
    if (!editingWelder || !editName.trim()) return;

    const updateData: UpdateWelderData = {
      name: editName.trim(),
      active: editingWelder.active,
    };

    try {
      await updateWelderMutation.mutateAsync({
        id: editingWelder.id,
        data: updateData,
      });
      setEditingWelder(null);
      setEditName("");
    } catch (error) {
      console.error("Failed to update welder:", error);
    }
  };

  const handleToggleActive = async (welder: Welder) => {
    const updateData: UpdateWelderData = {
      active: !welder.active,
    };

    try {
      await updateWelderMutation.mutateAsync({
        id: welder.id,
        data: updateData,
      });
    } catch (error) {
      console.error("Failed to toggle welder status:", error);
    }
  };

  const handleDelete = async (welderId: string) => {
    try {
      await deleteWelderMutation.mutateAsync(welderId);
    } catch (error) {
      console.error("Failed to delete welder:", error);
    }
  };

  const openEditDialog = (welder: Welder) => {
    setEditingWelder({
      id: welder.id,
      name: welder.name,
      active: welder.active,
    });
    setEditName(welder.name);
  };

  const closeEditDialog = () => {
    setEditingWelder(null);
    setEditName("");
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive">Failed to load welders: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and FileFilter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search welders
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by stencil or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Show Inactive FileFilter */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showInactive"
                checked={showInactive}
                onCheckedChange={(checked) => setShowInactive(Boolean(checked))}
              />
              <Label htmlFor="showInactive" className="text-sm">
                Show inactive
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Welders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Welders ({welders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading welders...</span>
            </div>
          ) : welders.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No welders found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No welders match your search criteria."
                  : "Get started by adding your first welder."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stencil</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Total Welds</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {welders.map((welder) => (
                      <TableRow key={welder.id}>
                        <TableCell className="font-mono font-medium">
                          {welder.stencil}
                        </TableCell>
                        <TableCell>{welder.name}</TableCell>
                        <TableCell>
                          <Badge status="info">
                            {welder.weldCount} welds
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            status={welder.active ? "success" : "warning"}
                            className={cn(
                              "flex items-center gap-1 w-fit"
                            )}
                          >
                            {welder.active ? (
                              <UserCheck className="h-3 w-3" />
                            ) : (
                              <UserX className="h-3 w-3" />
                            )}
                            {welder.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit Button */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(welder)}
                                  className="min-h-[44px] min-w-[44px]"
                                  title="Edit welder"
                                >
                                  <Edit className="h-5 w-5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Welder</DialogTitle>
                                  <DialogDescription>
                                    Update welder information. Stencil cannot be changed.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {editingWelder?.id === welder.id && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Stencil (Read-only)</Label>
                                      <Input value={welder.stencil} disabled className="font-mono" />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="editName">Name</Label>
                                      <Input
                                        id="editName"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Enter welder name"
                                      />
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="editActive"
                                        checked={editingWelder.active}
                                        onCheckedChange={(checked) => 
                                          setEditingWelder({
                                            ...editingWelder,
                                            active: Boolean(checked)
                                          })
                                        }
                                      />
                                      <Label htmlFor="editActive">Active</Label>
                                    </div>
                                    
                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={closeEditDialog}>
                                        Cancel
                                      </Button>
                                      <Button 
                                        onClick={handleEditSubmit}
                                        disabled={updateWelderMutation.isPending || !editName.trim()}
                                      >
                                        {updateWelderMutation.isPending ? "Saving..." : "Save"}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {/* Toggle Status Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(welder)}
                              disabled={updateWelderMutation.isPending}
                              title={welder.active ? "Deactivate welder" : "Activate welder"}
                              className="min-h-[44px] min-w-[44px]"
                            >
                              {welder.active ? (
                                <UserX className="h-5 w-5 text-orange-600" />
                              ) : (
                                <UserCheck className="h-5 w-5 text-green-600" />
                              )}
                            </Button>

                            {/* Delete Button */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive min-h-[44px] min-w-[44px]"
                                  title="Delete welder"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Welder</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete welder "{welder.name}" ({welder.stencil})?
                                    {welder.weldCount > 0 && (
                                      <span className="block mt-2 font-medium text-orange-600">
                                        This welder has {welder.weldCount} associated welds and will be deactivated instead of deleted.
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(welder.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {welder.weldCount > 0 ? "Deactivate" : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {welders.map((welder) => (
                  <Card key={welder.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-mono font-medium text-lg">
                          {welder.stencil}
                        </div>
                        <div className="text-muted-foreground">{welder.name}</div>
                      </div>
                      <Badge
                        status={welder.active ? "success" : "warning"}
                        className={cn(
                          "flex items-center gap-1"
                        )}
                      >
                        {welder.active ? (
                          <UserCheck className="h-3 w-3" />
                        ) : (
                          <UserX className="h-3 w-3" />
                        )}
                        {welder.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge status="info">
                        {welder.weldCount} welds
                      </Badge>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(welder)}
                          className="min-h-[44px] min-w-[44px]"
                          title="Edit welder"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(welder)}
                          disabled={updateWelderMutation.isPending}
                          className="min-h-[44px] min-w-[44px]"
                          title={welder.active ? "Deactivate welder" : "Activate welder"}
                        >
                          {welder.active ? (
                            <UserX className="h-5 w-5 text-orange-600" />
                          ) : (
                            <UserCheck className="h-5 w-5 text-green-600" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive min-h-[44px] min-w-[44px]"
                              title="Delete welder"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Welder</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete welder "{welder.name}" ({welder.stencil})?
                                {welder.weldCount > 0 && (
                                  <span className="block mt-2 font-medium text-orange-600">
                                    This welder has {welder.weldCount} associated welds and will be deactivated instead of deleted.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(welder.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {welder.weldCount > 0 ? "Deactivate" : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}