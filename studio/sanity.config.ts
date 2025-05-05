import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'cc-portfolio',

  projectId: process.env.SANITY_PROJECT_ID || '8gdwrje8',
  dataset: process.env.SANITY_DATASET || 'development',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
    },
  },
})
