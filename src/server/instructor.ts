/**
 * Instructor applications (the product requirements).
 *
 * One user can have several rows over time — a rejected application stays in the history and a new
 * one may be submitted — but never two PENDING rows: the service checks first for a friendly
 * message and the partial unique index in Postgres guarantees it under concurrency.
 */

import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { InstructorApplicationInput } from "@/features/instructor/schema";
import { conflict } from "@/lib/errors";
import { db } from "@/server/db";

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ApplicationSummary = {
  id: string;
  status: ApplicationStatus;
  experience: string;
  field: string;
  portfolioUrl: string | null;
  sampleVideoUrl: string | null;
  /** Admin decision note; present when REJECTED. */
  reason: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

export async function listInstructorApplications(userId: string): Promise<ApplicationSummary[]> {
  return db.instructorApplication.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      experience: true,
      field: true,
      portfolioUrl: true,
      sampleVideoUrl: true,
      reason: true,
      createdAt: true,
      reviewedAt: true,
    },
  });
}

function optionalUrl(value: string | undefined): string | null {
  return value === undefined || value.trim() === "" ? null : value.trim();
}

export async function submitInstructorApplication(
  userId: string,
  input: InstructorApplicationInput,
): Promise<{ id: string }> {
  const existing = await db.instructorApplication.findFirst({
    where: { userId, status: { in: ["PENDING", "APPROVED"] } },
    select: { status: true },
  });
  if (existing !== null) {
    throw conflict(existing.status === "PENDING" ? "APPLICATION_PENDING" : "APPLICATION_APPROVED");
  }

  try {
    return await db.instructorApplication.create({
      data: {
        userId,
        status: "PENDING",
        experience: input.experience,
        field: input.field,
        portfolioUrl: optionalUrl(input.portfolioUrl),
        sampleVideoUrl: optionalUrl(input.sampleVideoUrl),
      },
      select: { id: true },
    });
  } catch (error) {
    // Two concurrent submits: the partial unique index wins over the check above.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict("APPLICATION_PENDING");
    }
    throw error;
  }
}
