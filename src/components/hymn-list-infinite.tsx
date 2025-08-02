"use client";

import React, {
  useEffect,
  useState,
  useTransition,
  useCallback,
  useRef,
} from "react";
import { useSearchParams } from "next/navigation";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { logHymnUsage, editHymn } from "@/app/actions";
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
import {
  getHymns,
  GetHymnsSort,
  HistoryFilter,
  HymnWithLastSung,
} from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";

interface HymnListInfiniteProps {
  initialHymns: HymnWithLastSung[];
  initialHasMore: boolean;
}

export function HymnListInfinite({
  initialHymns,
  initialHasMore,
}: HymnListInfiniteProps) {
  const searchParams = useSearchParams();
  const [hymns, setHymns] = useState<HymnWithLastSung[]>(initialHymns);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, startTransition] = useTransition();
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Extract search parameters
  const search = searchParams.get("search") || undefined;
  const sort = (searchParams.get("sort") as GetHymnsSort) || "last-sung-desc";
  const historyFilter =
    (searchParams.get("historyFilter") as HistoryFilter) || "all";

  // Reset when search parameters change
  useEffect(() => {
    setIsInitialLoad(true);
    startTransition(async () => {
      const result = await getHymns({
        search,
        sort,
        historyFilter,
        page: 1,
        limit: 20,
      });

      if (result.success) {
        setHymns(result.data);
        setPage(1);
        setHasMore(result.pagination?.hasMore || false);
      }
      setIsInitialLoad(false);
    });
  }, [search, sort, historyFilter]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    const nextPage = page + 1;
    startTransition(async () => {
      const result = await getHymns({
        search,
        sort,
        historyFilter,
        page: nextPage,
        limit: 20,
      });

      if (result.success) {
        setHymns((prev) => [...prev, ...result.data]);
        setPage(nextPage);
        setHasMore(result.pagination?.hasMore || false);
      }
    });
  }, [search, sort, historyFilter, page, isLoading, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

  if (isInitialLoad) {
    return <HymnTableSkeleton />;
  }

  return (
    <div className="h-full flex flex-col">
      <HymnTableWithInfiniteScroll
        hymns={hymns}
        hasMore={hasMore}
        isLoading={isLoading}
        loadingRef={loadingRef}
        search={search}
      />
    </div>
  );
}

// Wrapper component for HymnTable with infinite scroll
function HymnTableWithInfiniteScroll({
  hymns,
  hasMore,
  isLoading,
  loadingRef,
  search,
}: {
  hymns: HymnWithLastSung[];
  hasMore: boolean;
  isLoading: boolean;
  loadingRef: React.RefObject<HTMLDivElement | null>;
  search?: string;
}) {
  return (
    <div className="rounded-md border overflow-hidden h-full">
      <div className="h-full flex flex-col">
        {/* Fixed Header */}
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {hymns.length === 0 && !isLoading ? (
            <div className="h-24 flex items-center justify-center text-muted-foreground px-4">
              {search
                ? `No hymns found matching "${search}"`
                : "No hymns found"}
            </div>
          ) : (
            <>
              {hymns.map((hymn) => (
                <HymnRow key={hymn.id} hymn={hymn} />
              ))}

              {/* Loading indicator and infinite scroll trigger */}
              {hasMore && (
                <div
                  ref={loadingRef}
                  className="h-16 flex items-center justify-center border-t"
                >
                  {isLoading && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading more...</span>
                    </div>
                  )}
                </div>
              )}

              {!hasMore && hymns.length > 0 && (
                <div className="text-center text-muted-foreground text-sm py-4 border-t">
                  No more hymns to load
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton Component
function HymnTableSkeleton() {
  return (
    <div className="rounded-md border h-full">
      {/* Header */}
      <div className="h-12 bg-muted/50 border-b">
        <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_200px] items-center px-4 gap-4 h-full">
          <Skeleton className="h-4" />
          <Skeleton className="h-4 hidden sm:block" />
          <Skeleton className="h-4" />
        </div>
      </div>
      {/* Body Rows */}
      <div className="divide-y divide-border">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_200px] items-center px-4 py-3 gap-4"
          >
            <div className="min-w-0">
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-3 w-1/2 sm:hidden" />
            </div>
            <Skeleton className="h-4 hidden sm:block" />
            <div className="flex justify-end">
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HymnRow({ hymn }: { hymn: HymnWithLastSung }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loggingHymnId, setLoggingHymnId] = useState<string | null>(null);
  const [isLoggingPending, startLoggingTransition] = useTransition();
  const [popoverOpenState, setPopoverOpenState] = useState<
    Record<string, boolean>
  >({});

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(hymn.title);
  const [editFormErrors, setEditFormErrors] = useState<{ title?: string[] }>(
    {}
  );
  const [isEditPending, startEditTransition] = useTransition();

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditFormErrors({});
    const formData = new FormData(event.currentTarget);

    startEditTransition(async () => {
      const result = await editHymn(hymn.id, formData);
      if (result.success) {
        toast.success(result.message || "Hymn updated successfully!");
        setIsEditDialogOpen(false);
      } else {
        if (result.issues) {
          setEditFormErrors(result.issues);
        }
        toast.error(result.error || "Failed to update hymn.");
      }
    });
  };

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
      <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_200px] items-center px-4 py-3 border-b hover:bg-muted/20 gap-4">
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
            onClick={() => setIsHistoryModalOpen(true)}
            title="View History"
          >
            <HistoryIcon className="h-4 w-4" />
            <span className="sr-only">View History</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditDialogOpen(true)}
            title="Edit Title"
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit Title</span>
          </Button>
          <Popover
            open={popoverOpenState[hymn.id] || false}
            onOpenChange={(open) => handlePopoverOpenChange(hymn.id, open)}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Hymn Title</DialogTitle>
            <DialogDescription>
              Change the title for &quot;{hymn.title}&quot;. Click save when
              you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
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
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isEditPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isEditPending || newTitle === hymn.title}
              >
                {isEditPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <HymnHistoryModal
        hymnId={hymn.id}
        isOpen={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
      />
    </>
  );
}
