import { Home, FolderOpen, FileText, Bell, Settings, Briefcase, Rocket } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
    { title: "Discover Projects", url: "/investor", icon: Home },
    { title: "My Investments", url: "/investor/investments", icon: FolderOpen },
    { title: "Agreements (NOC)", url: "/investor/agreements", icon: FileText },
];

const secondaryItems = [
    { title: "Notifications", url: "/investor/notifications", icon: Bell },
    { title: "Settings", url: "/investor/settings", icon: Settings },
];

const InvestorSidebar = () => {
    const { state } = useSidebar();
    const collapsed = state === "collapsed";

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            <SidebarContent>
                <div className="p-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary shrink-0" />
                    {!collapsed && <span className="font-heading font-bold text-foreground">ShipIt Investor</span>}
                </div>

                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink to={item.url} end={item.url === "/investor"} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                                            <item.icon className="h-4 w-4 mr-2 shrink-0" />
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>More</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {secondaryItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink to={item.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-primary font-medium">
                                            <item.icon className="h-4 w-4 mr-2 shrink-0" />
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
};

export default InvestorSidebar;
