import { ConnectButton } from "@mysten/dapp-kit";
import { Link as RouterLink, useLocation } from "react-router";
import { Outlet } from "react-router";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import navbarBg from '@/assets/navbar_bg.png'

export function Layout() {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/", label: "免费抽卡" },
    { path: "/battle", label: "对战大厅" },
    { path: "/intro", label: "卡牌介紹" },
    { path: "/news", label: "次元快报" },
  ];

  return (
    <>
      <div 
        className="sticky top-0 z-50 w-full border-white/10 relative"
        style={{
          backgroundImage: `url(${navbarBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {/* 遮罩层 */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* 内容 */}
        <div className="container relative flex h-16 items-center justify-between px-4">
          {/* Navigation */}
          <NavigationMenu>
            <NavigationMenuList className="hidden md:flex">
              {navItems.map((item) => (
                <NavigationMenuItem key={item.path}>
                  <NavigationMenuLink asChild>
                    <RouterLink
                      to={item.path}
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium transition-colors hover:text-white",
                        "text-white/70",
                        location.pathname === item.path && "text-white"
                      )}
                    >
                      {item.label}
                    </RouterLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Connect Button */}
          <div className="flex items-center space-x-4">
            <ConnectButton className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20" />
          </div>
        </div>
      </div>
      
      <Outlet />
    </>
  );
} 