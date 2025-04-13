import { Hymn, UsageHistory } from "@prisma/client";

export type HymnWithHistoryCount = Hymn & {
  _count: {
    usageHistory: number;
  };
};

export type HymnWithRecentHistory = Hymn & {
  usageHistory: UsageHistory[];
};
