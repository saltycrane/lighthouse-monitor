"use client";

import { Check, Plus, X } from "lucide-react";
import { useState, useRef } from "react";

import { addHost } from "../actions";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Heading } from "./ui/heading";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function AddHostForm() {
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    setIsPending(true);

    const result = await addHost(formData);

    setIsPending(false);
    if (result.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      setMessage({ text: "Host added successfully!", type: "success" });
      setTimeout(() => {
        setMessage(null);
      }, 5000);
      // Clear the form using the ref
      formRef.current?.reset();
    }
  }

  return (
    <div className="space-y-4">
      {/* Header row with heading and feedback message */}
      <div className="flex justify-between items-center mb-4">
        <Heading level={2}>Add New Host</Heading>

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
        <CardHeader />
        <CardContent>
          <form ref={formRef} action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="host">Host URL</Label>
              <Input
                type="text"
                id="host"
                name="host"
                placeholder="example.com"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Host
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
