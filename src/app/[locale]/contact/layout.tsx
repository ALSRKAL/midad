import { ClientMessages } from "@/components/client-messages";

export default async function ContactLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ClientMessages locale={locale} namespaces={["Common", "Contact"]}>
      {children}
    </ClientMessages>
  );
}
