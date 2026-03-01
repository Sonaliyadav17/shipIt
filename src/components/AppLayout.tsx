import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import AppNavbar from "@/components/AppNavbar";
import SearchModal from "@/components/SearchModal";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";

const AppLayout = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppNavbar onSearchClick={() => setSearchOpen(true)} />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
};

export default AppLayout;
