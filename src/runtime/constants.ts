/**
 * Vite HMR event the build process sends asset updates on
 *
 * Lives under runtime/ so the client plugin can import it: runtime files ship as-is, while
 * src/types.ts is bundled into the module and ships as declarations only
 */
export const HMR_EVENT = 'nuxt-content-assets:update'
