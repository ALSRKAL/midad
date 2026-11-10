import { ClientMessages } from "@/components/client-messages";

export default async function CartLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ClientMessages locale={locale} namespaces={["Common", "Cart", "Coupons"]}>
      {children}
    </ClientMessages>
  );
}
