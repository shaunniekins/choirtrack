"use client"; // This remains a Client Component boundary if HymnFilters needs client interactivity

import React, { Suspense } from "react";

interface PageContentProps {
  filtersComponent: React.ReactNode;
  listComponent: React.ReactNode;
  listFallback: React.ReactNode; // Prop for the Suspense fallback
}

// Component now just renders props
export function PageContent({
  filtersComponent,
  listComponent,
  listFallback, // Receive fallback via props
}: PageContentProps) {
  // No need for useSearchParams or state here anymore

  return (
    <>
      {/* Render the filters passed from the server component */}
      {filtersComponent}

      {/* Render the list component (which is async, rendered on server) */}
      {/* Wrap the list component in Suspense */}
      <Suspense fallback={listFallback}>{listComponent}</Suspense>
    </>
  );
}
