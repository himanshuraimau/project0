import { Header } from "@/components/landing/header";
import { AuthLoadingWrapper } from "@/components/auth/auth-loading";

interface Props {
    children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <AuthLoadingWrapper>
      <main className="flex flex-col min-h-screen max-h-screen">
        <Header />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </AuthLoadingWrapper>
  );
};

export default Layout;
