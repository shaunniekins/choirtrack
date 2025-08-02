// src/components/hymn-filters.tsx
"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X, PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GetHymnsSort, HistoryFilter, addHymn } from "@/app/actions";
import { toast } from "sonner";
import { debounce } from "lodash";

type FormErrors = {
  title?: string[];
};

interface HymnFiltersProps {
  onHymnAdded?: () => void;
}

// localStorage keys
const SEARCH_STORAGE_KEY = "choirtrack-search";
const SORT_STORAGE_KEY = "choirtrack-sort";
const HISTORY_FILTER_STORAGE_KEY = "choirtrack-history-filter";

export function HymnFilters({ onHymnAdded }: HymnFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isAddingHymn, startAddHymnTransition] = useTransition();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHymnTitle, setNewHymnTitle] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize search term from URL params or localStorage
  const [searchTerm, setSearchTerm] = useState(() => {
    const paramSearch = searchParams.get("search") || "";
    if (typeof window !== "undefined") {
      return paramSearch || localStorage.getItem(SEARCH_STORAGE_KEY) || "";
    }
    return paramSearch;
  });

  // Initialize sort order from URL params, localStorage, or "last-sung-desc" as default
  const [sortOrder, setSortOrder] = useState<GetHymnsSort>(() => {
    const paramSort = searchParams.get("sort") as GetHymnsSort | null;
    if (typeof window !== "undefined") {
      const storedSort = localStorage.getItem(
        SORT_STORAGE_KEY
      ) as GetHymnsSort | null;
      return paramSort || storedSort || "last-sung-desc";
    }
    return paramSort || "last-sung-desc";
  });

  // Initialize history filter from URL params, localStorage, or "all" as default
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>(() => {
    const paramFilter = searchParams.get(
      "historyFilter"
    ) as HistoryFilter | null;
    if (typeof window !== "undefined") {
      const storedFilter = localStorage.getItem(
        HISTORY_FILTER_STORAGE_KEY
      ) as HistoryFilter | null;
      return paramFilter || storedFilter || "all";
    }
    return paramFilter || "all";
  });

  const debouncedUpdateParams = useRef(
    debounce(
      (
        newSearchTerm: string,
        currentSortOrder: GetHymnsSort,
        currentHistoryFilter: HistoryFilter
      ) => {
        const params = new URLSearchParams(searchParams);
        if (newSearchTerm) {
          params.set("search", newSearchTerm);
        } else {
          params.delete("search");
        }
        if (currentSortOrder && currentSortOrder !== "last-sung-desc") {
          params.set("sort", currentSortOrder);
        } else {
          params.delete("sort");
        }
        if (currentHistoryFilter && currentHistoryFilter !== "all") {
          params.set("historyFilter", currentHistoryFilter);
        } else {
          params.delete("historyFilter");
        }

        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`, { scroll: false });
        });
      },
      300
    )
  ).current;

  useEffect(() => {
    const paramSearch = searchParams.get("search") || "";
    const paramSort =
      (searchParams.get("sort") as GetHymnsSort | null) || "last-sung-desc";
    const paramHistoryFilter =
      (searchParams.get("historyFilter") as HistoryFilter | null) || "all";
    setSearchTerm(paramSearch);
    setSortOrder(paramSort);
    setHistoryFilter(paramHistoryFilter);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SEARCH_STORAGE_KEY, searchTerm);
      localStorage.setItem(SORT_STORAGE_KEY, sortOrder);
      localStorage.setItem(HISTORY_FILTER_STORAGE_KEY, historyFilter);
    }
  }, [searchTerm, sortOrder, historyFilter]);

  useEffect(() => {
    debouncedUpdateParams(searchTerm, sortOrder, historyFilter);
    return () => {
      debouncedUpdateParams.cancel();
    };
  }, [searchTerm, sortOrder, historyFilter, debouncedUpdateParams]);

  useEffect(() => {
    if (!isAddDialogOpen) {
      setNewHymnTitle("");
      setFormErrors({});
    }
  }, [isAddDialogOpen]);

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (value: string) => {
    const newSortOrder = value as GetHymnsSort;
    setSortOrder(newSortOrder);
  };

  const handleHistoryFilterChange = (value: string) => {
    const newHistoryFilter = value as HistoryFilter;
    setHistoryFilter(newHistoryFilter);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleAddHymnSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setFormErrors({});

    const formData = new FormData(event.currentTarget);

    startAddHymnTransition(async () => {
      const result = await addHymn(formData);

      if (result.success) {
        toast.success(result.message || "Hymn added successfully!");
        setIsAddDialogOpen(false);
        // Call the callback to refresh the list
        if (onHymnAdded) {
          onHymnAdded();
        }
      } else {
        if (result.issues) {
          setFormErrors(result.issues);
        }
        toast.error(result.error || "Failed to add hymn.");
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center">
      <div className="relative flex-grow w-full sm:w-auto">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </span>
        <Input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={handleSearchTermChange}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground hover:text-primary"
            onClick={handleClearSearch}
            disabled={isPending}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Select
        value={sortOrder}
        onValueChange={handleSortChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title-asc">Title (A-Z)</SelectItem>
          <SelectItem value="title-desc">Title (Z-A)</SelectItem>
          <SelectItem value="last-sung-desc">Last Sung (Newest)</SelectItem>
          <SelectItem value="last-sung-asc">Last Sung (Oldest)</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={historyFilter}
        onValueChange={handleHistoryFilterChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Songs</SelectItem>
          <SelectItem value="with-history">With History</SelectItem>
          <SelectItem value="no-history">No History</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <PlusIcon className="mr-2 h-4 w-4" /> Add New Music
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Hymn</DialogTitle>
            <DialogDescription>
              Enter the details for the new hymn. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <form
            ref={formRef}
            onSubmit={handleAddHymnSubmit}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <div className="col-span-3">
                <Input
                  id="title"
                  name="title"
                  value={newHymnTitle}
                  onChange={(e) => setNewHymnTitle(e.target.value)}
                  className={formErrors.title ? "border-destructive" : ""}
                  disabled={isAddingHymn}
                />
                {formErrors.title && (
                  <p className="text-xs text-destructive mt-1">
                    {formErrors.title.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isAddingHymn}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form={formRef.current ? formRef.current.id : undefined}
              disabled={isAddingHymn}
              onClick={() => formRef.current?.requestSubmit()}
            >
              {isAddingHymn && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Hymn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
