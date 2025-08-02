import { Suspense } from "react";
import { HymnListInfinite } from "@/components/hymn-list-infinite";
import { HymnFilters } from "@/components/hymn-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { getHymns, GetHymnsSort, HistoryFilter } from "./actions";
// Import the SignOutButton
import { SignOutButton } from "@/components/auth/sign-out-button";

// Async component to fetch and display initial hymns
async function HymnListLoader({
  searchParams, // Accept the whole object
}: {
  searchParams: { [key: string]: string | string[] | undefined }; // Update prop type
}) {
  // Extract and process search param directly from searchParams
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;

  // Extract and process sort param directly from searchParams
  const currentSortParam =
    typeof searchParams.sort === "string" ? searchParams.sort : undefined;

  // Extract and process history filter param
  const currentHistoryFilterParam =
    typeof searchParams.historyFilter === "string"
      ? searchParams.historyFilter
      : undefined;

  // Validate and cast sort param
  const validSorts: GetHymnsSort[] = [
    "title-asc",
    "title-desc",
    "last-sung-asc",
    "last-sung-desc",
  ];
  const sort: GetHymnsSort =
    currentSortParam && validSorts.includes(currentSortParam as GetHymnsSort)
      ? (currentSortParam as GetHymnsSort)
      : "last-sung-desc"; // Changed default sort to "last-sung-desc"

  // Validate and cast history filter param
  const validHistoryFilters: HistoryFilter[] = [
    "all",
    "with-history",
    "no-history",
  ];
  const historyFilter: HistoryFilter =
    currentHistoryFilterParam &&
    validHistoryFilters.includes(currentHistoryFilterParam as HistoryFilter)
      ? (currentHistoryFilterParam as HistoryFilter)
      : "all";

  // Fetch initial data using the server action with processed values
  const result = await getHymns({
    search,
    sort,
    historyFilter,
    page: 1,
    limit: 20,
  });

  if (!result.success) {
    // Handle error state appropriately - maybe show an error message
    return (
      <p className="text-center text-destructive">
        Error loading hymns: {result.error}
      </p>
    );
  }

  return (
    <HymnListInfinite
      initialHymns={result.data ?? []}
      initialHasMore={result.pagination?.hasMore || false}
    />
  );
}

// Loading Skeleton Component
function HymnTableSkeleton() {
  return (
    <div className="rounded-md border">
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

// Make the main page component async and update the searchParams type
export default async function HomePage({
  searchParams: searchParamsPromise, // Rename prop to indicate it's a promise
}: {
  // Type searchParams as a Promise
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the promise to get the actual searchParams object
  const searchParams = await searchParamsPromise;

  return (
    <main className="h-[100svh] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 container mx-auto px-4 lg:px-52 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ChoirTrack</h1>
          <SignOutButton />
        </div>

        <HymnFilters />
      </div>

      <div className="flex-1 overflow-hidden container mx-auto px-4 lg:px-52 pb-8">
        <Suspense fallback={<HymnTableSkeleton />}>
          <HymnListLoader searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
