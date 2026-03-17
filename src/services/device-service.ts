// ═══════════════════════════════════════════════════════════════
//  Device Wiki — Service Layer
//  §Phase 2 (G-1): JSON file-based device data loader
//
//  - Reads from src/content/devices/{slug}.json
//  - Validates with DeviceDataSchema (Zod)
//  - Server-side only (getStaticProps / getStaticPaths)
//  - NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import {
  DeviceDataSchema,
  parseDeviceData,
  type DeviceData,
  type DeviceParseResult,
} from '@/schemas/device';

// ─── Constants ───────────────────────────────────────────────

const DEVICES_DIR = path.join(process.cwd(), 'src', 'content', 'devices');

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Read and parse a single device JSON file.
 * Returns null if file doesn't exist or fails to parse.
 */
function readDeviceFile(slug: string): DeviceParseResult | null {
  const filePath = path.join(DEVICES_DIR, `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed: Record<string, unknown> = JSON.parse(raw) as Record<string, unknown>;
    return parseDeviceData(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[device-service] Failed to read ${slug}.json: ${message}`);
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Get a single device by slug.
 * Returns DeviceData or null if not found / invalid.
 */
export function getDevice(slug: string): DeviceData | null {
  const result = readDeviceFile(slug);

  if (!result) return null;

  if (!result.success) {
    console.warn(`[device-service] Validation failed for ${slug}:`, result.error);
    return null;
  }

  if (result.warnings.length > 0) {
    console.info(`[device-service] Warnings for ${slug}:`, result.warnings);
  }

  return result.data;
}

/**
 * Get a single device with full parse result (including warnings).
 */
export function getDeviceWithMeta(slug: string): DeviceParseResult | null {
  return readDeviceFile(slug);
}

/**
 * Get all available device slugs.
 * Reads directory listing, filters for .json files.
 */
export function getAllDeviceSlugs(): string[] {
  if (!fs.existsSync(DEVICES_DIR)) {
    console.warn('[device-service] Devices directory not found:', DEVICES_DIR);
    return [];
  }

  try {
    return fs
      .readdirSync(DEVICES_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[device-service] Failed to read devices directory: ${message}`);
    return [];
  }
}

/**
 * Get all devices with their data.
 * Skips invalid/missing files (best-effort).
 */
export function getAllDevices(): DeviceData[] {
  const slugs = getAllDeviceSlugs();
  const devices: DeviceData[] = [];

  for (const slug of slugs) {
    const device = getDevice(slug);
    if (device) {
      devices.push(device);
    }
  }

  return devices;
}

/**
 * Get devices by category.
 */
export function getDevicesByCategory(category: string): DeviceData[] {
  return getAllDevices().filter((d) => d.category === category);
}

/**
 * Get related devices for a given device slug.
 */
export function getRelatedDevices(slug: string): DeviceData[] {
  const device = getDevice(slug);
  if (!device) return [];

  const related: DeviceData[] = [];
  for (const relatedSlug of device.relatedDevices) {
    const relatedDevice = getDevice(relatedSlug);
    if (relatedDevice) {
      related.push(relatedDevice);
    }
  }
  return related;
}

/**
 * Validate DeviceDataSchema independently (for testing / CI).
 */
export function validateDeviceJSON(raw: Record<string, unknown>): DeviceParseResult {
  return parseDeviceData(raw);
}
