import { TowerControl } from "lucide-react";
import Link from "next/link";

import { getAllHosts, getAllPathnames } from "@/lib/db";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";

export async function Navigation() {
  const hosts = await getAllHosts();
  const pathnames = await getAllPathnames();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link
            href="/"
            className="ml-4 mr-6 flex items-center space-x-2 font-bold text-primary"
          >
            <TowerControl className="h-5 w-5" />
            <span>Lighthouse Metrics</span>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>By Host</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] gap-3 p-4">
              {hosts.map((hostRow) => (
                <li key={hostRow.id}>
                  <Link
                    href={`/host/${encodeURIComponent(hostRow.host)}`}
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    {hostRow.host}
                  </Link>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>By Page</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] lg:w-[600px]">
              {pathnames.map((pathnameRow) => (
                <li key={pathnameRow.id}>
                  <Link
                    href={`/pathname/${encodeURIComponent(pathnameRow.pathname)}`}
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <span
                      className={
                        !pathnameRow.is_active && "text-muted-foreground"
                      }
                    >
                      {pathnameRow.pathname}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
