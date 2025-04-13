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
import { GetHymnsSort, addHymn } from "@/app/actions";
import { toast } from "sonner";
import { debounce } from "lodash";

type FormErrors = {
  title?: string[];
};

export function HymnFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isAddingHymn, startAddHymnTransition] = useTransition();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHymnTitle, setNewHymnTitle] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [sortOrder, setSortOrder] = useState<GetHymnsSort>(
    (searchParams.get("sort") as GetHymnsSort | null) || "title-asc"
  );

  const debouncedUpdateParams = useRef(
    debounce((newSearchTerm: string, currentSortOrder: GetHymnsSort) => {
      const params = new URLSearchParams(searchParams);
      if (newSearchTerm) {
        params.set("search", newSearchTerm);
      } else {
        params.delete("search");
      }
      if (currentSortOrder && currentSortOrder !== "title-asc") {
        params.set("sort", currentSortOrder);
      } else {
        params.delete("sort");
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 300)
  ).current;

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setSortOrder(
      (searchParams.get("sort") as GetHymnsSort | null) || "title-asc"
    );
  }, [searchParams]);

  useEffect(() => {
    debouncedUpdateParams(searchTerm, sortOrder);
    return () => {
      debouncedUpdateParams.cancel();
    };
  }, [searchTerm, sortOrder, debouncedUpdateParams]);

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
