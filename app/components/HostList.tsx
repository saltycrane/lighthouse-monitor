"use client";

import { Check, Trash2, X } from "lucide-react";
import { useState } from "react";

import { THostRow } from "@/lib/types";
import { removeHost, toggleHostActive } from "../actions";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Heading } from "./ui/heading";
import { Switch } from "./ui/switch";

type TProps = {
  hosts: THostRow[];
};

export default function HostList({ hosts }: TProps) {
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const activeHosts = hosts.filter((host) => host.is_active);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<number | null>(null);

  async function handleDelete(id: number, formData: FormData) {
    setPendingId(id);
    setMessage(null);

    const result = await removeHost(formData);

    setPendingId(null);
    if (result.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      setMessage({ text: "Host deleted successfully!", type: "success" });
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
  }

  async function handleToggleActive(id: number, isActive: boolean) {
    setPendingToggleId(id);
    setMessage(null);

    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("isActive", (!isActive).toString());

    const result = await toggleHostActive(formData);

    setPendingToggleId(null);
    if (result.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      setMessage({
        text: `Pathname ${!isActive ? "activated" : "deactivated"} successfully!`,
        type: "success",
      });
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
  }

  if (hosts.length === 0) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            No hosts added yet. Add your first host to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row with heading and feedback message */}
      <div className="flex justify-between items-center mb-4">
        <Heading level={2}>Hosts to monitor ({activeHosts.length})</Heading>

        {/* Feedback message aligned to the right */}
        <div className="h-6 flex items-center">
          {message && (
            <div
              className={`flex items-center ${
                message.type === "error" ? "text-destructive" : "text-green-600"
              }`}
            >
              {message.type === "success" ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              {message.text}
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {hosts.map((host) => (
              <li
                key={host.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={host.is_active}
                    disabled={pendingToggleId === host.id}
                    onCheckedChange={() =>
                      handleToggleActive(host.id, host.is_active)
                    }
                  />
                  <span
                    className={`font-medium ${!host.is_active ? "text-muted-foreground" : ""}`}
                  >
                    {host.host}
                  </span>
                </div>
                <form action={(formData) => handleDelete(host.id, formData)}>
                  <input type="hidden" name="id" value={host.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={pendingId === host.id}
                  >
                    {pendingId === host.id ? (
                      "Deleting..."
                    ) : (
                      <>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </>
                    )}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
