import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Settings, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/vendor-portal", label: "總覽", icon: LayoutDashboard },
  { href: "/vendor-portal/menu", label: "菜單管理", icon: UtensilsCrossed },
  { href: "/vendor-portal/orders", label: "訂單管理", icon: ClipboardList },
  { href: "/vendor-portal/settings", label: "店家設定", icon: Settings },
];

export default function VendorLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground px-4 h-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">🍱</span>
          <span className="font-semibold">廠商後台</span>
        </div>
        <Link href="/" className="flex items-center text-sm opacity-80 hover:opacity-100">
          <ArrowLeft className="w-4 h-4 mr-1" /> 回首頁
        </Link>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-48 min-h-[calc(100vh-3rem)] bg-white border-r border-border p-3 hidden md:block">
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors",
                  location === href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}>
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex md:hidden z-50">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex-1">
              <div className={cn(
                "flex flex-col items-center py-2 text-xs",
                location === href ? "text-primary" : "text-muted-foreground"
              )}>
                <Icon className="w-5 h-5 mb-0.5" />
                {label}
              </div>
            </Link>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
