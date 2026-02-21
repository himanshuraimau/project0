import { Navbar } from "@/components/shared/navbar";
import { BlogBreadcrumb } from "@/components/blog/BlogBreadcrumb";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Blog" showBackToDashboard={false} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <BlogBreadcrumb />
        {children}
      </main>
    </div>
  );
}
