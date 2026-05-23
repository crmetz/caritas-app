import type { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-6">
          <span className="font-semibold text-lg">Caritas</span>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
