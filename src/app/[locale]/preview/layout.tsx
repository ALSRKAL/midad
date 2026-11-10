import { ClientMessages } from "@/components/client-messages";

export default async function PreviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ClientMessages
      locale={locale}
      namespaces={["Common", "Course", "Cart", "Reviews", "Wishlist"]}
    >
      {children}
    </ClientMessages>
  );
}
