// src/services/middleware-settings.ts
// This file is specifically for providing settings to the middleware in an Edge-safe way.

export interface MinimalSystemSettings {
  maintenanceMode: boolean;
  // Add other settings ONLY if CRITICALLY needed by middleware AND can be sourced Edge-safely
  // (e.g., from Edge Config or environment variables).
}

const defaultMinimalSettings: MinimalSystemSettings = {
  maintenanceMode: false,
};

/**
 * Asynchronously retrieves minimal system settings crucial for middleware decisions.
 * This function is designed to be 100% Edge Runtime safe and lightweight.
 *
 * It currently returns default values. For dynamic maintenance mode visible to middleware
 * without a full redeploy, consider integrating with Vercel Edge Config, Cloudflare KV,
 * or a similar Edge-compatible data store. Reading from environment variables is also
 * an option but typically requires a redeploy or environment update to change.
 *
 * @returns A promise that resolves to a MinimalSystemSettings object.
 */
export async function getMinimalSettingsForMiddleware(): Promise<MinimalSystemSettings> {
  // In a production scenario, you might fetch this from Vercel Edge Config or a similar service.
  // Example: const maintenanceMode = await edgeConfig.get('maintenanceMode');
  // For now, we return defaults to ensure Edge safety.
  console.log(`[MiddlewareSettings] Providing default minimal settings for Edge middleware.`);
  return { ...defaultMinimalSettings };
}
