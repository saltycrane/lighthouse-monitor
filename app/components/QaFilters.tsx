"use client";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/style";
import { THostRow, TPathnameRow } from "@/lib/types";

type TProps = {
  keyHost: "host1" | "host2";
  keyPathname: "pathname1" | "pathname2";
  hosts: THostRow[];
  pathnames: TPathnameRow[];
  selectedHost: string;
  selectedPathname: string;
};

export function QaFilters({
  keyHost,
  keyPathname,
  hosts,
  pathnames,
  selectedHost,
  selectedPathname,
}: TProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectHost = (host: string) => {
    const params = new URLSearchParams(searchParams);
    if (selectedHost !== host) {
      params.set(keyHost, host);
    }
    router.push(`?${params.toString()}`);
  };

  const selectPathname = (pathname: string) => {
    const params = new URLSearchParams(searchParams);
    if (selectedPathname !== pathname) {
      params.set(keyPathname, pathname);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader className="pb-2" />
      <CardContent>
        <div className="flex flex-col md:flex-row md:gap-8 mb-4">
          <div className="flex-1 mb-4 md:mb-0">
            <label className="text-sm font-medium mb-2 block">Host</label>
            <div className="flex flex-wrap gap-2">
              {hosts.map((hostRow) => {
                const isSelected = selectedHost === hostRow.host;
                return (
                  <Button
                    className="flex items-center gap-1 pl-6 pr-2"
                    key={hostRow.id}
                    onClick={() => selectHost(hostRow.host)}
                    variant={isSelected ? "default" : "outline"}
                  >
                    <span
                      className={
                        !hostRow.is_active ? "text-muted-foreground" : undefined
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
        </div>
        <div className="flex flex-col md:flex-row md:gap-8">
          <div className="flex-1 mb-4 md:mb-0">
            <label className="text-sm font-medium mb-2 block">Pathname</label>
            <Select
              value={selectedPathname || ""}
              onValueChange={(value) => selectPathname(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select pathname" />
              </SelectTrigger>
              <SelectContent>
                {pathnames.map((pathnameRow) => (
                  <SelectItem
                    key={pathnameRow.id}
                    value={pathnameRow.pathname}
                    disabled={!pathnameRow.is_active}
                    className={
                      !pathnameRow.is_active
                        ? "text-muted-foreground"
                        : undefined
                    }
                  >
                    {pathnameRow.pathname}
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
