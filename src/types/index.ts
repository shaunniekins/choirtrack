export interface Hymn {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageHistory {
  id: string;
  sungDate: Date;
  hymnId: string;
  createdAt: Date;
}

export type HymnWithHistoryCount = Hymn & {
  _count: {
    usageHistory: number;
  };
};

export type HymnWithRecentHistory = Hymn & {
  usageHistory: UsageHistory[];
};

export type HymnWithLastSung = Hymn & {
  lastSungDate: Date | null;
  usageHistory: UsageHistory[];
};

export type GetHymnsSort =
  | "title-asc"
  | "title-desc"
  | "last-sung-asc"
  | "last-sung-desc";

export type HistoryFilter = "all" | "with-history" | "no-history";
