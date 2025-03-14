"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/style";
import { THostRow, TPathnameRow } from "@/lib/types";
import { Checkbox } from "@/app/components/ui/checkbox";

const TIMESPAN_OPTIONS = [
  { value: "24", label: "Last 24 hours" },
  { value: "72", label: "Last 3 days" },
  { value: "168", label: "Last 7 days" },
];

type TProps = {
  hosts?: THostRow[];
  pathnames?: TPathnameRow[];
  selectedHosts?: string[];
  selectedPathnames?: string[];
  selectedTimespan?: string;
  hideCached: boolean;
  hideUncached: boolean;
  combineCached: boolean;
};

export function Filters({
  hosts,
  pathnames,
  selectedHosts,
  selectedPathnames,
  selectedTimespan = "24",
  hideCached,
  hideUncached,
  combineCached,
}: TProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  selectedHosts = selectedHosts?.filter(Boolean);
  selectedPathnames = selectedPathnames?.filter(Boolean);
  const bothUnchecked = hideCached && hideUncached;

  const toggleHost = (host: string) => {
    const params = new URLSearchParams(searchParams);
    const currentHosts = params.get("hosts")?.split(",") || [];
    if (currentHosts.includes(host)) {
      const newHosts = currentHosts.filter((h) => h !== host);
      if (newHosts.length) {
        params.set("hosts", newHosts.join(","));
      } else {
        params.delete("hosts");
      }
    } else {
      const newHosts = [...currentHosts, host];
      params.set("hosts", newHosts.join(","));
    }
    router.push(`?${params.toString()}`);
  };

  const togglePathname = (pathname: string) => {
    const params = new URLSearchParams(searchParams);
    const currentPathnames = params.get("pathnames")?.split(",") || [];
    if (currentPathnames.includes(pathname)) {
      const newPathnames = currentPathnames.filter((h) => h !== pathname);
      if (newPathnames.length) {
        params.set("pathnames", newPathnames.join(","));
      } else {
        params.delete("pathnames");
      }
    } else {
      const newPathnames = [...currentPathnames, pathname];
      params.set("pathnames", newPathnames.join(","));
    }
    router.push(`?${params.toString()}`);
  };

  const handleCombineCachedToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (checked) {
      params.set("combineCached", "true");
      params.delete("hideCached");
      params.delete("hideUncached");
    } else {
      params.delete("combineCached");
    }
    router.replace(`?${params.toString()}`);
  };

  const handleShowCachedToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (checked) {
      params.delete("hideCached");
    } else {
      params.set("hideCached", "true");
      params.delete("combineCached");
    }
    router.replace(`?${params.toString()}`);
  };

  const handleShowUncachedToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (checked) {
      params.delete("hideUncached");
    } else {
      params.set("hideUncached", "true");
      params.delete("combineCached");
    }
    router.replace(`?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("combineCached");
    params.delete("hideCached");
    params.delete("hideUncached");
    params.delete("hosts");
    params.delete("pathnames");
    router.push(`?${params.toString()}`);
  };

  const handleTimespanChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("timespan", value);
    router.replace(`?${params.toString()}`);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex flex-row justify-between items-center">
          <Heading level={5}>Filters</Heading>
          <Button
            variant="link"
            size="sm"
            onClick={clearAll}
            className={
              selectedHosts?.length > 0 || selectedPathnames?.length > 0
                ? "text-sm"
                : "text-sm invisible"
            }
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:gap-8 mb-4">
          <div className="w-full md:w-48">
            <label className="text-sm font-medium mb-2 block">Timespan</label>
            <Select
              value={selectedTimespan}
              onValueChange={handleTimespanChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timespan" />
              </SelectTrigger>
              <SelectContent>
                {TIMESPAN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-80 mb-4 md:mb-0">
            <label className="text-sm font-medium mb-2 block">
              Cached/uncached display
            </label>
            <div className="flex items-center gap-2">
              <Switch
                id="combine-switch"
                checked={combineCached}
                onCheckedChange={handleCombineCachedToggle}
              />
              <label
                className="text-sm cursor-pointer mr-4"
                htmlFor="combine-switch"
              >
                Show combined
              </label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cached-checkbox"
                  checked={!hideCached}
                  onCheckedChange={handleShowCachedToggle}
                  className={cn(bothUnchecked && "border-destructive")}
                />
                <label
                  htmlFor="cached-checkbox"
                  className={cn(
                    "text-sm cursor-pointer mr-4",
                    bothUnchecked && "text-destructive",
                  )}
                >
                  Show cached
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="uncached-checkbox"
                  checked={!hideUncached}
                  onCheckedChange={handleShowUncachedToggle}
                  className={cn(bothUnchecked && "border-destructive")}
                />
                <label
                  htmlFor="uncached-checkbox"
                  className={cn(
                    "text-sm cursor-pointer mr-4",
                    bothUnchecked && "text-destructive",
                  )}
                >
                  Show uncached
                </label>
              </div>
            </div>
          </div>

          {selectedHosts && (
            <div className="flex-1 mb-4 md:mb-0">
              <label className="text-sm font-medium mb-2 block">Hosts</label>
              <div className="flex flex-wrap gap-2">
                {hosts.map((hostRow) => {
                  const isSelected = selectedHosts.includes(hostRow.host);
                  return (
                    <Button
                      className="flex items-center gap-1 pl-6 pr-2"
                      key={hostRow.id}
                      onClick={() => toggleHost(hostRow.host)}
                      variant={isSelected ? "default" : "outline"}
                    >
                      <span
                        className={
                          !hostRow.is_active
                            ? "text-muted-foreground"
                            : undefined
                        }
                      >
                        {hostRow.host}
                      </span>
                      <X
                        className={cn(
                          "h-3 w-3",
                          !isSelected ? "invisible" : undefined,
                        )}
                      />
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row md:gap-8">
          {selectedPathnames && (
            <div className="flex-1 mb-4 md:mb-0">
              <label className="text-sm font-medium mb-2 block">
                Pathnames
              </label>
              <div className="flex flex-wrap gap-2">
                {pathnames.map((pathnameRow) => {
                  const isSelected = selectedPathnames.includes(
                    pathnameRow.pathname,
                  );
                  return (
                    <Button
                      className="flex items-center gap-1 pl-6 pr-2"
                      key={pathnameRow.id}
                      onClick={() => togglePathname(pathnameRow.pathname)}
                      variant={isSelected ? "default" : "outline"}
                    >
                      <span
                        className={
                          !pathnameRow.is_active
                            ? "text-muted-foreground"
                            : undefined
                        }
                      >
                        {pathnameRow.pathname}
                      </span>
                      <X
                        className={cn(
                          "h-3 w-3",
                          !isSelected ? "invisible" : undefined,
                        )}
                      />
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
