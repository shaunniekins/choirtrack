import { Suspense } from "react";
import { HymnTable } from "@/components/hymn-table";
import { HymnFilters } from "@/components/hymn-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { getHymns, GetHymnsSort } from "./actions";

// Async component to fetch and display hymns
async function HymnListLoader({
  searchParams, // Accept the whole object
}: {
  searchParams: { [key: string]: string | string[] | undefined }; // Update prop type
}) {
  // Await searchParams before accessing its properties
  const resolvedSearchParams = await searchParams;

  // Extract and process search param
  const search =
    typeof resolvedSearchParams.search === "string"
      ? resolvedSearchParams.search
      : undefined;

  // Extract and process sort param
  const currentSortParam =
    typeof resolvedSearchParams.sort === "string"
      ? resolvedSearchParams.sort
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
      : "title-asc"; // Default sort

  // Fetch data using the server action with processed values
  const result = await getHymns({ search, sort });

  if (!result.success) {
    // Handle error state appropriately - maybe show an error message
    return (
      <p className="text-center text-destructive">
        Error loading hymns: {result.error}
      </p>
    );
  }

  // Pass fetched data to the client component table with a fallback empty array
  return <HymnTable hymns={result.data ?? []} />;
}

// Loading Skeleton Component
function HymnTableSkeleton() {
  return (
    <div className="rounded-md border">
      {/* Header */}
      <div className="h-12 bg-muted/50 flex items-center px-4 border-b">
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

// Define the props type explicitly using a more general searchParams type
interface HomePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// The main page component (Server Component) - Ensure it's not async
export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">ChoirTrack - BBC Atis</h1>

      {/* Filters are client components for interactivity */}
      <HymnFilters />

      {/* Use Suspense for loading state while data fetches */}
      <Suspense fallback={<HymnTableSkeleton />}>
        {/* Pass the entire searchParams object */}
        <HymnListLoader searchParams={searchParams} />
      </Suspense>

      {/* Optional: Add Hymn Area - Maybe a separate component/modal triggered by a button */}
      {/* <AddHymnForm /> */}
    </main>
  );
}
