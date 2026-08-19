"use client";

import { Suspense } from "react";
import { HymnListWrapper } from "@/components/hymn-list-wrapper";
import { ImportExportButton } from "@/components/import-export";
import { Skeleton } from "@/components/ui/skeleton";

function HymnTableSkeleton() {
  return (
    <div className="flex-shrink-0 container mx-auto px-4 lg:px-52 py-4">
      {/* Header */}
      <div className="h-full bg-muted/50 flex items-center px-4 border-b">
        <Skeleton className="h-4 w-[50%]" />
        <Skeleton className="h-4 w-[25%] ml-4" /> {/* Last Sung Header */}
        <Skeleton className="h-4 w-[20%] ml-auto" /> {/* Actions Header */}
      </div>
      {/* Body Rows */}
      <div className="divide-y divide-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 flex items-center px-4">
            <Skeleton className="h-4 w-[50%]" /> {/* Title */}
            <Skeleton className="h-4 w-[25%] ml-4" /> {/* Last Sung */}
            <Skeleton className="h-8 w-24 ml-auto" /> {/* Button placeholder */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="h-[100svh] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 container mx-auto px-4 lg:px-52 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ChoirTrack</h1>
          <ImportExportButton />
        </div>
      </div>

      <Suspense fallback={<HymnTableSkeleton />}>
        <HymnListWrapper />
      </Suspense>
    </main>
  );
}
