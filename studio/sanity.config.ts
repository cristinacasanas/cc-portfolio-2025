import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import { Folder } from 'lucide-react'

export default defineConfig({
  name: 'default',
  title: 'cc-portfolio',

  projectId: process.env.VITE_SANITY_PROJECT_ID || '8gdwrje8',
  dataset: process.env.VITE_SANITY_DATASET || 'production',

  plugins: [
    visionTool(),
    structureTool({
       structure: (S, context) => {
        return S.list()
          .title('Content')
          .items([
            orderableDocumentListDeskItem({type: 'categories', S, context, title: 'Categories', icon: Folder}),
            orderableDocumentListDeskItem({type: 'projects', S, context, title: 'Projects', icon: Folder}),
            orderableDocumentListDeskItem({type: 'about', S, context, title: 'About', icon: Folder}),
            orderableDocumentListDeskItem({type: 'network', S, context, title: 'Network', icon: Folder}),
            orderableDocumentListDeskItem({type: 'lab', S, context, title: 'Lab', icon: Folder}),
          ])
      },
    })
  ],

  schema: {
    types: schemaTypes
  }
})
