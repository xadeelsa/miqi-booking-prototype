import { Stepper } from "@/components/Stepper";

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Stepper />
      {children}
    </>
  );
}
