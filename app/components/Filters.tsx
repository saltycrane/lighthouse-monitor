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
import { cn } from "@/lib/style";
import { THostRow, TPathnameRow } from "@/lib/types";

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
};

export function Filters({
  hosts,
  pathnames,
  selectedHosts,
  selectedPathnames,
  selectedTimespan = "24",
}: TProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const clearAll = () => {
    const params = new URLSearchParams(searchParams);
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
        <div className="flex flex-col md:flex-row md:gap-8">
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
                          !hostRow.is_active && "text-muted-foreground"
                        }
                      >
                        {hostRow.host}
                      </span>
                      <X
                        className={cn("h-3 w-3", !isSelected && "invisible")}
                      />
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
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
                          !pathnameRow.is_active && "text-muted-foreground"
                        }
                      >
                        {pathnameRow.pathname}
                      </span>
                      <X
                        className={cn("h-3 w-3", !isSelected && "invisible")}
                      />
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
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
        </div>
      </CardContent>
    </Card>
  );
}
