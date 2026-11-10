import type { ReactNode } from "react";

/**
 * Shared shell for the static pages (about, terms, privacy).
 *
 * One measure and one heading scale across the legal/marketing pages, so a reader moving between
 * them is not re-learning the layout. Content is passed as sections rather than injected HTML.
 */
export function StaticPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <header className="border-b border-border pb-5">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{intro}</p>
      </header>
      <div className="mt-8 space-y-8">{children}</div>
    </div>
  );
}

export function StaticSection({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-foreground">{body}</p>
    </section>
  );
}
