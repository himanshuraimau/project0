export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-[3vw]">
      {children}
    </div>
  );
}
