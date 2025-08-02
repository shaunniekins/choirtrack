// src/components/hymn-table.tsx
"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { logHymnUsage, editHymn, HymnWithLastSung } from "@/app/actions";
import { toast } from "sonner";
import { CalendarIcon, Loader2, PencilIcon, HistoryIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { HymnHistoryModal } from "./hymn-history-modal";

type HymnTableProps = {
  hymns: HymnWithLastSung[];
};

type EditFormErrors = {
  title?: string[];
};

export function HymnTable({ hymns }: HymnTableProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loggingHymnId, setLoggingHymnId] = useState<string | null>(null);
  const [isLoggingPending, startLoggingTransition] = useTransition();
  const [popoverOpenState, setPopoverOpenState] = useState<
    Record<string, boolean>
  >({});

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHymn, setEditingHymn] = useState<HymnWithLastSung | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editFormErrors, setEditFormErrors] = useState<EditFormErrors>({});
  const [isEditPending, startEditTransition] = useTransition();
  const editFormRef = useRef<HTMLFormElement>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyModalHymnId, setHistoryModalHymnId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (editingHymn) {
      setNewTitle(editingHymn.title);
      setEditFormErrors({});
    } else {
      setNewTitle("");
    }
  }, [editingHymn]);

  const handleLogUsage = (hymnId: string) => {
    if (!selectedDate) {
      toast.error("Please select a date first.");
      return;
    }

    setLoggingHymnId(hymnId);
    startLoggingTransition(async () => {
      const result = await logHymnUsage(hymnId, selectedDate);
      if (result.success) {
        toast.success(result.message || "Usage logged successfully!");
        setSelectedDate(undefined);
        setPopoverOpenState((prev) => ({ ...prev, [hymnId]: false }));
      } else {
        toast.error(result.error || "Failed to log usage.");
        if (result.issues?.sungDate) {
          toast.error(`Date Error: ${result.issues.sungDate.join(", ")}`);
        }
      }
      setLoggingHymnId(null);
    });
  };

  const handlePopoverOpenChange = (hymnId: string, open: boolean) => {
    setPopoverOpenState((prev) => ({ ...prev, [hymnId]: open }));
    if (!open) {
      setSelectedDate(undefined);
    }
  };

  const handleOpenEditDialog = (hymn: HymnWithLastSung) => {
    setEditingHymn(hymn);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingHymn) return;

    setEditFormErrors({});
    const formData = new FormData(event.currentTarget);

    startEditTransition(async () => {
      const result = await editHymn(editingHymn.id, formData);
      if (result.success) {
        toast.success(result.message || "Hymn updated successfully!");
        setIsEditDialogOpen(false);
        setEditingHymn(null);
      } else {
        if (result.issues) {
          setEditFormErrors(result.issues);
        }
        toast.error(result.error || "Failed to update hymn.");
      }
    });
  };

  const handleOpenHistoryModal = (hymnId: string) => {
    setHistoryModalHymnId(hymnId);
    setIsHistoryModalOpen(true);
  };

  // Function to format date in a relative way without time
  const formatRelativeDate = (date: Date): string => {
    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      const daysAgo = differenceInDays(new Date(), date);
      if (daysAgo < 30) {
        return `${daysAgo} days ago`;
      } else {
        return format(date, "MMM d, yyyy");
      }
    }
  };

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <div className="bg-muted/50 border-b">
          <div className="h-12 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_200px] items-center px-4 gap-4">
            <div className="text-left text-sm font-medium text-muted-foreground">
              Title
            </div>
            <div className="hidden sm:block text-center text-sm font-medium text-muted-foreground">
              Last Sung
            </div>
            <div className="text-center text-sm font-medium text-muted-foreground">
              Actions
            </div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {hymns.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-muted-foreground px-4 py-4">
              No music found.
            </div>
          ) : (
            hymns.map((hymn) => (
              <div
                key={hymn.id}
                className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_200px] items-center px-4 py-3 hover:bg-muted/20 gap-4"
              >
                <div className="font-medium min-w-0">
                  <div className="truncate">{hymn.title}</div>
                  <div className="sm:hidden text-xs text-muted-foreground mt-1">
                    {hymn.lastSungDate ? (
                      <span title={format(hymn.lastSungDate, "PPP")}>
                        {formatRelativeDate(hymn.lastSungDate)}
                      </span>
                    ) : (
                      "Never"
                    )}
                  </div>
                </div>
                <div className="hidden sm:block text-muted-foreground text-center text-sm">
                  {hymn.lastSungDate ? (
                    <span title={format(hymn.lastSungDate, "PPP")}>
                      {formatRelativeDate(hymn.lastSungDate)}
                    </span>
                  ) : (
                    "Never"
                  )}
                </div>
                <div className="flex items-center justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenHistoryModal(hymn.id)}
                    title="View History"
                  >
                    <HistoryIcon className="h-4 w-4" />
                    <span className="sr-only">View History</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenEditDialog(hymn)}
                    title="Edit Title"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Edit Title</span>
                  </Button>
                  <Popover
                    open={popoverOpenState[hymn.id] || false}
                    onOpenChange={(open) =>
                      handlePopoverOpenChange(hymn.id, open)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 sm:px-3"
                        disabled={isLoggingPending && loggingHymnId === hymn.id}
                        title="Log Usage"
                      >
                        {isLoggingPending && loggingHymnId === hymn.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CalendarIcon className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline ml-1">Log</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4 space-y-2">
                      <p className="text-sm font-medium">Select Sung Date</p>
                      <DatePicker
                        date={selectedDate}
                        setDate={setSelectedDate}
                        disabled={isLoggingPending && loggingHymnId === hymn.id}
                      />
                      <Button
                        onClick={() => handleLogUsage(hymn.id)}
                        disabled={
                          !selectedDate ||
                          (isLoggingPending && loggingHymnId === hymn.id)
                        }
                        size="sm"
                        className="w-full h-8"
                      >
                        {isLoggingPending && loggingHymnId === hymn.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Confirm Log
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingHymn(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Hymn Title</DialogTitle>
            <DialogDescription>
              Change the title for &quot;{editingHymn?.title}&quot;. Click save
              when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <form
            ref={editFormRef}
            id="edit-hymn-form"
            onSubmit={handleEditSubmit}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Title
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-title"
                  name="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={editFormErrors.title ? "border-destructive" : ""}
                  disabled={isEditPending}
                />
                {editFormErrors.title && (
                  <p className="text-xs text-destructive mt-1">
                    {editFormErrors.title.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isEditPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="edit-hymn-form"
              disabled={isEditPending || newTitle === editingHymn?.title}
            >
              {isEditPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HymnHistoryModal
        hymnId={historyModalHymnId}
        isOpen={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
      />
    </>
  );
}
