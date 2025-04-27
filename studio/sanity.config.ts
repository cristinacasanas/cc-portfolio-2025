import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'cc-portfolio',

  projectId: 'xozw2ash',
  dataset: 'staging',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
