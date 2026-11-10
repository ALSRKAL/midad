import { ArrowDown, ArrowUp, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Unified admin table (P05-T01).
 *
 * The URL owns the state: search, filters, sort and page are search params, so every table is
 * shareable, bookmarkable and fully server-rendered. Sorting and pagination links clone the current
 * query; the CSV link points at the resource's authenticated export route with the same filters.
 */
export type AdminColumn<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "start" | "end";
  render: (row: T) => ReactNode;
  csv: (row: T) => string | number;
};

export function AdminDataTable<T extends { id: string }>({
  columns,
  rows,
  total,
  page,
  pageCount,
  query,
  basePath,
  formAction,
  searchValue,
  searchPlaceholder,
  filters,
  csvHref,
  filterLabel,
}: {
  columns: AdminColumn<T>[];
  rows: T[];
  total: number;
  page: number;
  pageCount: number;
  /** Current scalar query params, used to preserve filters in sort and page links. */
  query: Record<string, string>;
  basePath: string;
  /** Locale-prefixed action for the native GET form; links add the locale themselves. */
  formAction?: string;
  searchValue: string;
  searchPlaceholder: string;
  filters?: ReactNode;
  csvHref: string;
  filterLabel: string;
}) {
  const t = useTranslations("Admin");
  const sortKey = query.sort ?? "createdAt";
  const sortDir = query.dir === "asc" ? "asc" : "desc";

  const hrefFor = (overrides: Record<string, string | undefined>): string => {
    const params = new URLSearchParams(query);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    return qs === "" ? basePath : `${basePath}?${qs}`;
  };

  const pageWindow = (() => {
    const width = 5;
    let start = Math.max(1, page - Math.floor(width / 2));
    const end = Math.min(pageCount, start + width - 1);
    start = Math.max(1, end - width + 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  })();

  const from = total === 0 ? 0 : (page - 1) * 20 + 1;
  const to = Math.min(page * 20, total);

  return (
    <div>
      <form method="get" action={formAction ?? basePath} className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1 space-y-1">
          <label htmlFor="admin-search" className="text-sm font-medium text-foreground">
            {t("search")}
          </label>
          <Input
            id="admin-search"
            name="q"
            type="search"
            defaultValue={searchValue}
            placeholder={searchPlaceholder}
          />
        </div>
        {filters !== undefined && (
          <div className="flex flex-wrap items-end gap-3" aria-label={filterLabel}>
            {filters}
          </div>
        )}
        <input type="hidden" name="sort" value={sortKey} />
        <input type="hidden" name="dir" value={sortDir} />
        <div className="flex items-center gap-2 pb-0.5">
          <Button type="submit" size="md">
            {t("apply")}
          </Button>
          <Link
            href={basePath}
            className="rounded-sm px-3 py-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("clear")}
          </Link>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" role="status">
          {t("showing", { from, to, total })}
        </p>
        {/* API routes are not locale-prefixed; the intl Link would turn this into /ar/api/... (404). */}
        <a
          href={csvHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Download className="size-4" aria-hidden="true" />
          {t("exportCsv")}
        </a>
      </div>

      <div
        role="region"
        aria-label={filterLabel}
        tabIndex={0}
        className="mt-2 overflow-x-auto rounded-md border border-border bg-surface"
      >
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-start">
              {columns.map((column) => {
                const active = column.sortable === true && sortKey === column.key;
                const nextDir = active && sortDir === "asc" ? "desc" : "asc";
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      active ? (sortDir === "asc" ? "ascending" : "descending") : undefined
                    }
                    className={cn(
                      "px-3 py-2.5 font-medium text-muted-foreground",
                      column.align === "end" ? "text-end" : "text-start",
                    )}
                  >
                    {column.sortable === true ? (
                      <Link
                        href={hrefFor({ sort: column.key, dir: nextDir, page: undefined })}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {column.label}
                        {active &&
                          (sortDir === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          ))}
                      </Link>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-10 text-center text-muted-foreground"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-3 text-foreground",
                        column.align === "end" ? "text-end" : "text-start",
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <nav
          aria-label={t("paginationLabel")}
          className="mt-4 flex flex-wrap items-center justify-between gap-3"
        >
          {page > 1 ? (
            <Link
              href={hrefFor({ page: String(page - 1) })}
              className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-sm font-medium hover:bg-muted"
            >
              {t("previousPage")}
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center rounded-md border border-dashed border-border px-4 text-sm text-muted-foreground">
              {t("previousPage")}
            </span>
          )}

          <div className="flex items-center gap-1">
            {pageWindow.map((number) =>
              number === page ? (
                <span
                  key={number}
                  aria-current="page"
                  className="tabular inline-flex size-9 items-center justify-center rounded-sm bg-primary text-sm font-medium text-primary-foreground"
                >
                  {number}
                </span>
              ) : (
                <Link
                  key={number}
                  href={hrefFor({ page: String(number) })}
                  className="tabular inline-flex size-9 items-center justify-center rounded-sm text-sm text-foreground hover:bg-muted"
                >
                  {number}
                </Link>
              ),
            )}
          </div>

          {page < pageCount ? (
            <Link
              href={hrefFor({ page: String(page + 1) })}
              className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-sm font-medium hover:bg-muted"
            >
              {t("nextPage")}
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center rounded-md border border-dashed border-border px-4 text-sm text-muted-foreground">
              {t("nextPage")}
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
