"use client";

import React, { useState, useTransition, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useHymnStore } from "@/lib/store";
import { HymnWithRecentHistory } from "@/types";

interface HymnHistoryModalProps {
  hymnId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged?: () => void;
}

export function HymnHistoryModal({
  hymnId,
  isOpen,
  onOpenChange,
  onDataChanged,
}: HymnHistoryModalProps) {
  const { getHymnWithHistory, removeHymnUsage, deleteHymn } = useHymnStore();
  
  // State
  const [hymnData, setHymnData] = useState<HymnWithRecentHistory | null>(null);
  const [removingHistoryId, setRemovingHistoryId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Transitions
  const [isLoadingData, startDataTransition] = useTransition();
  const [isRemovingUsage, startRemovalTransition] = useTransition();
  const [isDeletingHymn, startDeleteTransition] = useTransition();

  // Effects
  useEffect(() => {
    if (isOpen && hymnId) {
      // Reset state on open
      setError(null);
      setHymnData(null);
      setRemovingHistoryId(null);
      setShowDeleteConfirm(false);

      // Load hymn data
      startDataTransition(() => {
        const result = getHymnWithHistory(hymnId);
        if (result.success && result.data) {
          setHymnData(result.data);
        } else {
          setError(result.error || "Failed to load history.");
          toast.error(result.error || "Could not load hymn details.");
        }
      });
    }
  }, [isOpen, hymnId, getHymnWithHistory]);

  // Event handlers
  const handleRemoveUsage = (usageHistoryId: string) => {
    if (!hymnId) return;

    setRemovingHistoryId(usageHistoryId);
    startRemovalTransition(() => {
      const result = removeHymnUsage(usageHistoryId);
      if (result.success) {
        toast.success(result.message || "Usage record removed.");
        // Refresh data in the modal
        const refreshResult = getHymnWithHistory(hymnId);
        if (refreshResult.success && refreshResult.data) {
          setHymnData(refreshResult.data);
        } else {
          setError(refreshResult.error || "Failed to refresh history.");
          toast.error(refreshResult.error || "Could not refresh details.");
        }
      } else {
        toast.error(result.error || "Failed to remove usage record.");
      }
      setRemovingHistoryId(null);
    });
  };

  const handleDeleteHymn = () => {
    if (!hymnId) return;

    startDeleteTransition(() => {
      const result = deleteHymn(hymnId);
      if (result.success) {
        toast.success(result.message || "Hymn deleted.");
        handleClose();
        // Call the callback to refresh the main list
        if (onDataChanged) {
          onDataChanged();
        }
      } else {
        toast.error(result.error || "Failed to delete hymn.");
        setShowDeleteConfirm(false);
      }
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setShowDeleteConfirm(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] mx-4 my-auto">
        <DialogHeader>
          <DialogTitle>{hymnData?.title ?? "Loading Hymn..."}</DialogTitle>
          <DialogDescription>
            View recent usage history. Showing last{" "}
            {hymnData?.usageHistory.length ?? 0} times sung (max 6).
          </DialogDescription>
        </DialogHeader>

        {isLoadingData && (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoadingData && error && (
          <div className="flex items-center justify-center p-4 text-destructive">
            <XCircle className="mr-2 h-5 w-5" /> {error}
          </div>
        )}

        {!isLoadingData && hymnData && (
          <div className="grid gap-4 py-4">
            {/* History List */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recent History:</h4>
              {hymnData.usageHistory.length > 0 ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {hymnData.usageHistory.map((history) => (
                    <li
                      key={history.id}
                      className="flex items-center justify-between group"
                    >
                      <span>{format(new Date(history.sungDate), "PPP")} </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveUsage(history.id)}
                        disabled={
                          isRemovingUsage && removingHistoryId === history.id
                        }
                        title="Remove this entry"
                      >
                        {isRemovingUsage && removingHistoryId === history.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        <span className="sr-only">Remove usage entry</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No recent usage recorded.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          {/* Delete Button Trigger */}
          <AlertDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isDeletingHymn || isLoadingData || !hymnData}
                size="sm"
              >
                {isDeletingHymn ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Hymn
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="mx-4 my-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  hymn &quot;{hymnData?.title}&quot; and all of its usage
                  history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingHymn}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteHymn}
                  disabled={isDeletingHymn}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
                >
                  {isDeletingHymn ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Yes, delete hymn
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Close Button */}
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeletingHymn}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
