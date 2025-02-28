"use server";

import {
  createHost,
  deleteHost,
  createPathname,
  deletePathname,
  updatePathnameIsActive,
  updateHostIsActive,
} from "../lib/db";
import { revalidatePath } from "next/cache";

export async function addHost(formData: FormData) {
  const host = formData.get("host") as string;

  if (!host || typeof host !== "string") {
    return { error: "Host name is required" };
  }

  try {
    await createHost(host.trim());
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to add host:", error);
    return { error: "Failed to add host. It might already exist." };
  }
}

export async function removeHost(formData: FormData) {
  const hostId = formData.get("id") as string;

  if (!hostId || isNaN(parseInt(hostId))) {
    return { error: "Invalid host ID" };
  }

  try {
    await deleteHost(parseInt(hostId));
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete host:", error);
    return { error: "Failed to delete host" };
  }
}

export async function addPathname(formData: FormData) {
  const pathname = formData.get("pathname") as string;

  if (!pathname || typeof pathname !== "string") {
    return { error: "Pathname is required" };
  }

  try {
    await createPathname(pathname.trim());
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to add pathname:", error);
    return { error: "Failed to add pathname. It might already exist." };
  }
}

export async function removePathname(formData: FormData) {
  const pathnameId = formData.get("id") as string;

  if (!pathnameId || isNaN(parseInt(pathnameId))) {
    return { error: "Invalid pathname ID" };
  }

  try {
    await deletePathname(parseInt(pathnameId));
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete pathname:", error);
    return { error: "Failed to delete pathname" };
  }
}

export async function toggleHostActive(formData: FormData) {
  const hostId = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";

  if (!hostId || isNaN(parseInt(hostId))) {
    return { error: "Invalid host ID" };
  }
  try {
    await updateHostIsActive(parseInt(hostId), isActive);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update host active state:", error);
    return { error: "Failed to update host active state" };
  }
}

export async function togglePathnameActive(formData: FormData) {
  const pathnameId = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";

  if (!pathnameId || isNaN(parseInt(pathnameId))) {
    return { error: "Invalid pathname ID" };
  }
  try {
    await updatePathnameIsActive(parseInt(pathnameId), isActive);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update pathname active state:", error);
    return { error: "Failed to update pathname active state" };
  }
}
