import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { conflict, forbidden, validationFailed } from "@/lib/errors";
import { availablePayoutCents, payoutRequestError } from "@/lib/payout-rules";
import { db } from "@/server/db";
import { getInstructorProfileId } from "@/server/instructor-courses";
import { getPlatformSettings } from "@/server/platform-settings";
import type { SessionUser } from "@/server/session";

/**
 * Instructor earnings and payouts (P10-T02, BR-11/12/13).
 *
 * The balance is never stored. Sales become eligible only after the refund window has passed; paid
 * payouts are deducted, and a pending request reserves its amount until an admin decides. All amounts
 * are integer halalas in SAR, the platform default (multi-currency payouts are out of scope in v1).
 */

export type LedgerRow = {
  id: string;
  type: "SALE" | "REFUND" | "PAYOUT";
  amountCents: number;
  description: string | null;
  createdAt: Date;
};

export type PayoutRow = {
  id: string;
  amountCents: number;
  status: "REQUESTED" | "APPROVED" | "PAID" | "REJECTED";
  transferReference: string | null;
  createdAt: Date;
  decidedAt: Date | null;
  paidAt: Date | null;
};

export type InstructorEarnings = {
  lifetimeNetCents: number;
  eligibleNetCents: number;
  paidPayoutCents: number;
  pendingPayoutCents: number;
  availableCents: number;
  minimumCents: number;
  refundWindowDays: number;
  pendingPayoutId: string | null;
  ledger: LedgerRow[];
  payouts: PayoutRow[];
};

type DbClient = Prisma.TransactionClient | typeof db;

async function computeEarnings(
  client: DbClient,
  instructorProfileId: string,
  refundWindowDays: number,
  minimumCents: number,
): Promise<Omit<InstructorEarnings, "ledger" | "payouts">> {
  const cutoff = new Date(Date.now() - refundWindowDays * 86_400_000);
  const [lifetime, eligible, paid, pendingPayout] = await Promise.all([
    client.ledgerEntry.aggregate({
      where: { instructorProfileId, currency: "SAR" },
      _sum: { amountCents: true },
    }),
    client.ledgerEntry.findMany({
      where: {
        instructorProfileId,
        currency: "SAR",
        type: { in: ["SALE", "REFUND"] },
        order: { paidAt: { lte: cutoff } },
      },
      select: { amountCents: true },
    }),
    client.payout.aggregate({
      where: { instructorProfileId, currency: "SAR", status: "PAID" },
      _sum: { amountCents: true },
    }),
    client.payout.findFirst({
      where: {
        instructorProfileId,
        currency: "SAR",
        status: { in: ["REQUESTED", "APPROVED"] },
      },
      select: { id: true, amountCents: true },
    }),
  ]);

  const eligibleNetCents = eligible.reduce((sum, entry) => sum + entry.amountCents, 0);
  const paidPayoutCents = paid._sum.amountCents ?? 0;
  const pendingPayoutCents = pendingPayout?.amountCents ?? 0;

  return {
    lifetimeNetCents: lifetime._sum.amountCents ?? 0,
    eligibleNetCents,
    paidPayoutCents,
    pendingPayoutCents,
    availableCents: availablePayoutCents({
      eligibleNetCents,
      paidPayoutCents,
      pendingPayoutCents,
    }),
    minimumCents,
    refundWindowDays,
    pendingPayoutId: pendingPayout?.id ?? null,
  };
}

export async function getInstructorEarnings(
  instructorProfileId: string,
): Promise<InstructorEarnings> {
  const settings = await getPlatformSettings();
  const [summary, ledger, payouts] = await Promise.all([
    computeEarnings(
      db,
      instructorProfileId,
      settings.refundWindowDays,
      settings.payoutMinimumMinor,
    ),
    db.ledgerEntry.findMany({
      where: { instructorProfileId, currency: "SAR" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, type: true, amountCents: true, description: true, createdAt: true },
    }),
    db.payout.findMany({
      where: { instructorProfileId, currency: "SAR" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amountCents: true,
        status: true,
        transferReference: true,
        createdAt: true,
        decidedAt: true,
        paidAt: true,
      },
    }),
  ]);

  return { ...summary, ledger, payouts };
}

export async function requestPayout(input: {
  user: SessionUser;
  amountCents: number;
}): Promise<{ id: string }> {
  const instructorProfileId = await getInstructorProfileId(input.user.id);
  if (instructorProfileId === null) throw forbidden("INSTRUCTOR_PROFILE_REQUIRED");

  const settings = await getPlatformSettings();
  if (!Number.isInteger(input.amountCents)) {
    throw validationFailed({ amount: ["INVALID_AMOUNT"] });
  }

  try {
    return await db.$transaction(async (tx) => {
      const summary = await computeEarnings(
        tx,
        instructorProfileId,
        settings.refundWindowDays,
        settings.payoutMinimumMinor,
      );
      const error = payoutRequestError({
        amountCents: input.amountCents,
        availableCents: summary.availableCents,
        minimumCents: settings.payoutMinimumMinor,
        pendingExists: summary.pendingPayoutId !== null,
      });
      if (error !== null) throw conflict(error);

      return tx.payout.create({
        data: {
          instructorProfileId,
          amountCents: input.amountCents,
          currency: "SAR",
          status: "REQUESTED",
        },
        select: { id: true },
      });
    });
  } catch (error) {
    // The partial unique index is the final guard against two concurrent requests (BR-13).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict("PENDING_PAYOUT_EXISTS");
    }
    throw error;
  }
}
