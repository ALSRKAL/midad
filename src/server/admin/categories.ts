/**
 * Category administration (P05-T04).
 *
 * Create, edit and delete with bilingual names, a stable Latin slug, an icon from the allow-listed
 * registry and an explicit order. A category with courses cannot be deleted (the foreign key would
 * reject it anyway); deactivating is the supported alternative. Every write is audited.
 */

import "server-only";

import { updateTag } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { isCategoryIconName } from "@/lib/category-icons";
import { conflict, notFound } from "@/lib/errors";
import { SLUG_PATTERN } from "@/lib/slug";
import { db } from "@/server/db";

export type AdminCategoryRow = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  courseCount: number;
};

export type CategoryInput = {
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
};

const SELECT = {
  id: true,
  slug: true,
  nameAr: true,
  nameEn: true,
  icon: true,
  sortOrder: true,
  isActive: true,
  _count: { select: { courses: true } },
} as const;

type Row = Prisma.CategoryGetPayload<{ select: typeof SELECT }>;

function mapRow(row: Row): AdminCategoryRow {
  return {
    id: row.id,
    slug: row.slug,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    icon: row.icon,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    courseCount: row._count.courses,
  };
}

export async function listAdminCategories(q: string): Promise<AdminCategoryRow[]> {
  const rows = await db.category.findMany({
    where:
      q.trim() === ""
        ? {}
        : {
            OR: [
              { nameAr: { contains: q.trim(), mode: "insensitive" } },
              { nameEn: { contains: q.trim(), mode: "insensitive" } },
              { slug: { contains: q.trim(), mode: "insensitive" } },
            ],
          },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    select: SELECT,
  });
  return rows.map(mapRow);
}

function validate(input: CategoryInput): void {
  if (!SLUG_PATTERN.test(input.slug)) throw conflict("SLUG_INVALID");
  if (input.nameAr.trim() === "" || input.nameEn.trim() === "") throw conflict("NAME_REQUIRED");
  if (input.icon !== null && !isCategoryIconName(input.icon)) throw conflict("ICON_INVALID");
  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 999) {
    throw conflict("ORDER_INVALID");
  }
}

export async function createCategory(
  adminId: string,
  input: CategoryInput,
): Promise<{ id: string }> {
  validate(input);
  const existing = await db.category.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existing !== null) throw conflict("SLUG_TAKEN");

  const created = await db.category.create({
    data: {
      slug: input.slug,
      nameAr: input.nameAr.trim(),
      nameEn: input.nameEn.trim(),
      icon: input.icon,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
    select: { id: true },
  });

  await db.auditLog.create({
    data: {
      actorId: adminId,
      action: "category.created",
      entity: "Category",
      entityId: created.id,
      after: { slug: input.slug, nameAr: input.nameAr, nameEn: input.nameEn },
    },
  });

  updateTag("catalog-categories");
  return created;
}

export async function updateCategory(
  adminId: string,
  id: string,
  input: CategoryInput,
): Promise<void> {
  validate(input);
  const current = await db.category.findUnique({ where: { id }, select: SELECT });
  if (current === null) throw notFound("Category not found");

  if (input.slug !== current.slug) {
    const taken = await db.category.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (taken !== null) throw conflict("SLUG_TAKEN");
  }

  await db.$transaction([
    db.category.update({
      where: { id },
      data: {
        slug: input.slug,
        nameAr: input.nameAr.trim(),
        nameEn: input.nameEn.trim(),
        icon: input.icon,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: "category.updated",
        entity: "Category",
        entityId: id,
        before: {
          slug: current.slug,
          nameAr: current.nameAr,
          nameEn: current.nameEn,
          sortOrder: current.sortOrder,
          isActive: current.isActive,
        },
        after: { ...input },
      },
    }),
  ]);
  updateTag("catalog-categories");
}

export async function deleteCategory(adminId: string, id: string): Promise<void> {
  const category = await db.category.findUnique({
    where: { id },
    select: { id: true, slug: true, _count: { select: { courses: true } } },
  });
  if (category === null) throw notFound("Category not found");
  if (category._count.courses > 0) throw conflict("CATEGORY_IN_USE");

  await db.$transaction([
    db.category.delete({ where: { id } }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: "category.deleted",
        entity: "Category",
        entityId: id,
        before: { slug: category.slug },
      },
    }),
  ]);
  updateTag("catalog-categories");
}
