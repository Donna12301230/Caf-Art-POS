import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import { Menu, Coffee } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar — slim 40px */}
        <div className="sticky top-0 z-30 flex items-center h-10 px-3 border-b border-border bg-card md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="開啟選單"
          >
            <Menu className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex items-center ml-2 space-x-1.5">
            <div className="w-5 h-5 coffee-gradient rounded flex items-center justify-center">
              <Coffee className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">CaféArt POS</span>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
