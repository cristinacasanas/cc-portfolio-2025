import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.VITE_SANITY_PROJECT_ID || '8gdwrje8',
    dataset: process.env.VITE_SANITY_DATASET || 'development',
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: true,
})
