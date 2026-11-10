import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

/**
 * Ships only the message namespaces a route's client components actually use (P14-T03).
 *
 * The Arabic catalogue is ~100 KB; sending all of it to every page forced the browser to parse and
 * hydrate translations for admin and instructor screens the visitor never opened. The root layout
 * now carries the shell namespaces, and each layout that hosts richer client islands adds its own
 * namespaces. Server Components keep using `getTranslations`, which reads the full catalogue on the
 * server only.
 */
export async function ClientMessages({
  locale,
  namespaces,
  children,
}: {
  locale: string;
  namespaces: readonly string[];
  children: React.ReactNode;
}) {
  const all = await getMessages();
  const messages = Object.fromEntries(
    namespaces.flatMap((namespace) => {
      const value = (all as Record<string, unknown>)[namespace];
      return value === undefined ? [] : [[namespace, value]];
    }),
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
