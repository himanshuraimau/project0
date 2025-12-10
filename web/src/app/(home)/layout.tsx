import { Header } from "@/components/landing/header";
import { AuthLoadingWrapper } from "@/components/auth/auth-loading";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <AuthLoadingWrapper>
      {/* Global Background Texture */}
      <div className="fixed inset-0 -z-50 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Radial Gradient for subtle center focus */}
      <div className="fixed inset-0 -z-40 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col relative">
          {children}
        </main>
      </div>
    </AuthLoadingWrapper>
  );
};

export default Layout;