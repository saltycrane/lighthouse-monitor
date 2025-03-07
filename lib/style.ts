import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * addAlphaToRgb - add an alpha value to an RGB color string, converting it to RGBA
 * @param rgbString - RGB color string in format "rgb(r, g, b)"
 * @param alpha - Alpha value between 0 and 1
 * @returns RGBA color string
 */
export function addAlphaToRgb(rgbString: string, alpha: number): string {
  // Extract RGB values using regex
  const rgbMatch = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

  if (!rgbMatch) {
    throw new Error('Invalid RGB color format. Expected "rgb(r, g, b)"');
  }

  // Get r, g, b values
  const r = parseInt(rgbMatch[1]);
  const g = parseInt(rgbMatch[2]);
  const b = parseInt(rgbMatch[3]);

  // Clamp alpha between 0 and 1
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  // Return RGBA string
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}

/**
 * darkenRgbColor - darken an RGB or RGBA color string by a specified percentage
 * @param rgbString - Color string in format "rgb(r, g, b)" or "rgba(r, g, b, a)"
 * @param percentage - Amount to darken, from 0 to 100
 * @returns Darkened RGB/RGBA color string
 */
export function darkenRgbColor(rgbString: string, percentage: number): string {
  // Extract RGB/RGBA values using regex
  // This handles both rgb(r, g, b) and rgba(r, g, b, a) formats
  const rgbMatch = rgbString.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/,
  );

  if (!rgbMatch) {
    throw new Error(
      'Invalid color format. Expected "rgb(r, g, b)" or "rgba(r, g, b, a)"',
    );
  }

  // Convert to numbers
  let [r, g, b] = [
    parseInt(rgbMatch[1]),
    parseInt(rgbMatch[2]),
    parseInt(rgbMatch[3]),
  ];
  const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : undefined;

  // Ensure percentage is between 0 and 100
  const darkFactor = Math.max(0, Math.min(100, percentage)) / 100;

  // Darken each component
  r = Math.max(0, Math.round(r * (1 - darkFactor)));
  g = Math.max(0, Math.round(g * (1 - darkFactor)));
  b = Math.max(0, Math.round(b * (1 - darkFactor)));

  // Return new RGB/RGBA string
  if (a !== undefined) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } else {
    return `rgb(${r}, ${g}, ${b})`;
  }
}
