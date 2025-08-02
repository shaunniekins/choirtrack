"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const MAX_HISTORY_COUNT = 6;

// --- Data Fetching Actions ---

export type GetHymnsSort =
  | "title-asc"
  | "title-desc"
  | "last-sung-asc"
  | "last-sung-desc";

export type HistoryFilter = "all" | "with-history" | "no-history";

export type HymnWithLastSung = Prisma.HymnGetPayload<{
  include: {
    usageHistory: {
      orderBy: { sungDate: "desc" };
      take: 1;
    };
  };
}> & { lastSungDate: Date | null };

export async function getHymns(params: {
  search?: string;
  sort?: GetHymnsSort;
  historyFilter?: HistoryFilter;
  page?: number;
  limit?: number;
}) {
  const { search, sort, historyFilter = "all", page = 1, limit = 20 } = params;

  const where: Prisma.HymnWhereInput = {};
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  // Determine base ordering for Prisma query
  const orderBy:
    | Prisma.HymnOrderByWithRelationInput
    | Prisma.HymnOrderByWithRelationInput[] = {};
  let requiresPostProcessingSort = false;

  switch (sort) {
    case "title-desc":
      orderBy.title = "desc";
      break;
    case "last-sung-asc":
    case "last-sung-desc":
      // Basic title sort for consistency before date sort
      orderBy.title = "asc";
      requiresPostProcessingSort = true; // We'll sort by date in JS after fetching
      break;
    case "title-asc":
    default:
      orderBy.title = "asc"; // Default sort
      break;
  }

  try {
    // First, get all hymns matching the criteria (without pagination for filtering)
    const hymnsRaw = await prisma.hymn.findMany({
      where,
      orderBy,
      include: {
        usageHistory: {
          orderBy: { sungDate: "desc" },
          take: 1,
        },
      },
    });

    // Map the result to include a top-level lastSungDate
    let hymns: HymnWithLastSung[] = hymnsRaw.map((hymn) => ({
      ...hymn,
      lastSungDate: hymn.usageHistory[0]?.sungDate ?? null,
    }));

    // Apply history filter
    if (historyFilter === "with-history") {
      hymns = hymns.filter((hymn) => hymn.lastSungDate !== null);
    } else if (historyFilter === "no-history") {
      hymns = hymns.filter((hymn) => hymn.lastSungDate === null);
    }

    // Post-processing sort for last sung date
    if (requiresPostProcessingSort) {
      hymns.sort((a, b) => {
        const dateA = a.lastSungDate;
        const dateB = b.lastSungDate;

        if (sort === "last-sung-asc") {
          // Nulls (never sung) first
          if (dateA === null && dateB === null) return 0;
          if (dateA === null) return -1;
          if (dateB === null) return 1;
          return dateA.getTime() - dateB.getTime(); // Oldest first
        } else {
          // last-sung-desc - Nulls (never sung) FIRST per requirement
          if (dateA === null && dateB === null) return 0;
          if (dateA === null) return -1; // Changed: Nulls first
          if (dateB === null) return 1;
          return dateB.getTime() - dateA.getTime(); // Newest first
        }
      });
    } else if (sort === "title-asc" || sort === "title-desc") {
      // For title sorts, also ensure no-history songs are at top
      hymns.sort((a, b) => {
        // First, sort by history status (no history first)
        const aHasHistory = a.lastSungDate !== null;
        const bHasHistory = b.lastSungDate !== null;

        if (!aHasHistory && bHasHistory) return -1;
        if (aHasHistory && !bHasHistory) return 1;

        // Then sort by title within each group
        if (sort === "title-desc") {
          return b.title.localeCompare(a.title);
        } else {
          return a.title.localeCompare(b.title);
        }
      });
    }

    // Apply pagination
    const totalCount = hymns.length;
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;
    const paginatedHymns = hymns.slice(skip, skip + limit);

    return {
      success: true as const,
      data: paginatedHymns,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching hymns:", error);
    return { success: false as const, error: "Failed to fetch hymns." };
  }
}

export async function getHymnWithHistory(hymnId: string) {
  try {
    const hymn = await prisma.hymn.findUnique({
      where: { id: hymnId },
      include: {
        usageHistory: {
          orderBy: { sungDate: "desc" },
          take: MAX_HISTORY_COUNT,
        },
      },
    });

    if (!hymn) {
      return { success: false as const, error: "Hymn not found." };
    }

    return { success: true as const, data: hymn };
  } catch (error) {
    console.error("Error fetching hymn history:", error);
    return { success: false as const, error: "Failed to fetch hymn history." };
  }
}

// --- Data Mutation Actions ---

const AddHymnSchema = z.object({
  title: z.string().min(1, "Title is required."),
});

export async function addHymn(formData: FormData) {
  const validatedFields = AddHymnSchema.safeParse({
    title: formData.get("title"),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;

    return {
      success: false,
      error: "Invalid input.",
      issues: fieldErrors,
    };
  }

  try {
    // Using prisma for database operations
    await prisma.hymn.create({
      data: {
        title: validatedFields.data.title,
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: `Hymn "${validatedFields.data.title}" added.`,
    };
  } catch (error) {
    // Using Prisma for error type checking
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "A hymn with this title already exists.",
      };
    }

    console.error("Error adding hymn:", error);
    return { success: false, error: "Failed to add hymn." };
  }
}

const EditHymnSchema = z.object({
  hymnId: z.string().cuid("Invalid Hymn ID"),
  title: z.string().min(1, "Title is required."),
});

export async function editHymn(hymnId: string, formData: FormData) {
  const validatedFields = EditHymnSchema.safeParse({
    hymnId: hymnId,
    title: formData.get("title"),
  });

  if (!validatedFields.success) {
    return {
      success: false as const,
      error: "Invalid input.",
      issues: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { hymnId: validatedHymnId, title: newTitle } = validatedFields.data;

  try {
    await prisma.hymn.update({
      where: { id: validatedHymnId },
      data: { title: newTitle },
    });

    revalidatePath("/");
    return {
      success: true as const,
      message: `Hymn title updated to "${newTitle}".`,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" // Unique constraint violation (title already exists)
    ) {
      return {
        success: false as const,
        error: "Another hymn with this title already exists.",
        issues: { title: ["Title must be unique."] }, // Mimic Zod issues structure
      };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025" // Record to update not found
    ) {
      return { success: false as const, error: "Hymn not found." };
    }

    console.error("Error editing hymn:", error);
    return { success: false as const, error: "Failed to update hymn title." };
  }
}

const DeleteHymnSchema = z.object({
  hymnId: z.string().cuid("Invalid Hymn ID"),
});

export async function deleteHymn(hymnId: string) {
  const validatedFields = DeleteHymnSchema.safeParse({ hymnId });

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten());
    return {
      success: false as const,
      error: "Invalid Hymn ID provided.",
    };
  }

  const { hymnId: validatedHymnId } = validatedFields.data;

  try {
    // Assuming cascade delete is set up in Prisma schema (onDelete: Cascade)
    // for the relation between Hymn and UsageHistory.
    // If not, you'd need to delete UsageHistory records manually first.
    await prisma.hymn.delete({
      where: { id: validatedHymnId },
    });

    revalidatePath("/"); // Revalidate the main list page
    return { success: true as const, message: "Hymn deleted successfully." };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025" // Record to delete not found
    ) {
      return { success: false as const, error: "Hymn not found." };
    }
    // Add other specific error handling if needed
    console.error("Error deleting hymn:", error);
    return { success: false as const, error: "Failed to delete hymn." };
  }
}

const LogUsageSchema = z.object({
  hymnId: z.string().cuid("Invalid Hymn ID"),
  sungDate: z.date({ required_error: "Please select a date." }),
});

export async function logHymnUsage(hymnId: string, sungDate: Date | undefined) {
  const validatedFields = LogUsageSchema.safeParse({ hymnId, sungDate });

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten());
    return {
      success: false,
      error: "Invalid data provided.",
      issues: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { hymnId: validatedHymnId, sungDate: validatedSungDate } =
    validatedFields.data;

  try {
    // Use prisma transaction for database operations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Add the new history record
      const newRecord = await tx.usageHistory.create({
        data: {
          hymnId: validatedHymnId,
          sungDate: validatedSungDate,
        },
      });

      // 2. Count current history records for this hymn
      const historyCount = await tx.usageHistory.count({
        where: { hymnId: validatedHymnId },
      });

      // 3. If count exceeds the limit, find and delete the oldest ones
      if (historyCount > MAX_HISTORY_COUNT) {
        const recordsToDelete = await tx.usageHistory.findMany({
          where: { hymnId: validatedHymnId },
          orderBy: { sungDate: "asc" },
          take: historyCount - MAX_HISTORY_COUNT,
          select: { id: true },
        });

        const idsToDelete = recordsToDelete.map((record) => record.id);

        if (idsToDelete.length > 0) {
          await tx.usageHistory.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }
      }
      return newRecord;
    });

    revalidatePath("/");
    return {
      success: true,
      message: "Usage logged successfully.",
      data: result,
    };
  } catch (error) {
    console.error("Error logging hymn usage:", error);
    return { success: false, error: "Failed to log usage." };
  }
}

const RemoveUsageSchema = z.object({
  usageHistoryId: z.string().cuid("Invalid Usage History ID"),
});

export async function removeHymnUsage(usageHistoryId: string) {
  const validatedFields = RemoveUsageSchema.safeParse({ usageHistoryId });

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten());
    return {
      success: false as const,
      error: "Invalid Usage History ID provided.",
    };
  }

  const { usageHistoryId: validatedUsageHistoryId } = validatedFields.data;

  try {
    // Find the record to get the hymnId for revalidation
    const usageRecord = await prisma.usageHistory.findUnique({
      where: { id: validatedUsageHistoryId },
      select: { hymnId: true },
    });

    if (!usageRecord) {
      return { success: false as const, error: "Usage record not found." };
    }

    await prisma.usageHistory.delete({
      where: { id: validatedUsageHistoryId },
    });

    // Revalidate the main page and potentially the specific hymn page if needed
    revalidatePath("/");
    // Consider revalidating specific hymn detail pages if they exist
    // revalidatePath(`/hymns/${usageRecord.hymnId}`);

    return { success: true as const, message: "Usage record removed." };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025" // Record to delete not found
    ) {
      return { success: false as const, error: "Usage record not found." };
    }
    console.error("Error removing hymn usage:", error);
    return { success: false as const, error: "Failed to remove usage record." };
  }
}
