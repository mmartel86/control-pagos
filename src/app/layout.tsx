"use client";

import "./globals.css";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, Settings, FileText, Menu, X } from "lucide-react";
import { AppProvider } from "@/lib/store";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/horario", label: "Horario", icon: Calendar },
  { href: "/config", label: "Config", icon: Settings },
  { href: "/descuentos", label: "Descuentos", icon: FileText },
  { href: "/pagos", label: "Pagos", icon: Users },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AppProvider>
          <NavLayout>{children}</NavLayout>
        </AppProvider>
      </body>
    </html>
  );
}

function NavLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-4 border-b border-gray-200">
          <h1 className="font-bold text-lg text-blue-600">Control Pagos</h1>
          <p className="text-xs text-gray-500">Gimnasio</p>
        </div>
        <nav className="p-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === href
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="text-gray-600">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-blue-600">Control Pagos</h1>
        <div className="w-5" />
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-xl z-50">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h1 className="font-bold text-lg text-blue-600">Control Pagos</h1>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-2">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                    pathname === href
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-56 pt-14 md:pt-0 p-4 md:p-6">{children}</main>
    </div>
  );
}
