"use client";

import React, { useRef, useCallback } from "react";
import { HymnListInfinite } from "./hymn-list-infinite";
import { HymnFilters } from "./hymn-filters";

export function HymnListWrapper() {
  const refreshRef = useRef<(() => void) | null>(null);

  const handleDataRefresh = useCallback(() => {
    if (refreshRef.current) {
      refreshRef.current();
    }
  }, []);

  return (
    <>
      <div className="flex-shrink-0 container mx-auto px-4 lg:px-52 py-4">
        <HymnFilters onDataChanged={handleDataRefresh} />
      </div>

      <div className="flex-1 overflow-hidden container mx-auto px-4 lg:px-52 pb-8">
        <HymnListInfinite
          onRefreshRef={refreshRef}
          onDataChanged={handleDataRefresh}
        />
      </div>
    </>
  );
}
