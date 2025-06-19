import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import { Folder } from 'lucide-react'

export default defineConfig({
  name: 'default',
  title: 'cc-portfolio',

  projectId: process.env.VITE_SANITY_PROJECT_ID || '7sdw728e',
  dataset: process.env.VITE_SANITY_DATASET || 'production',

  plugins: [
    structureTool({
       structure: (S, context) => {
        return S.list()
          .title('Content')
          .items([
            orderableDocumentListDeskItem({type: 'categories', S, context, title: 'Categories', icon: Folder}),
            orderableDocumentListDeskItem({type: 'projects', S, context, title: 'Projects', icon: Folder}),
            S.listItem()
              .title('About')
              .icon(Folder)
              .child(
                S.documentTypeList('about')
                  .title('About')
              ),
            orderableDocumentListDeskItem({type: 'network', S, context, title: 'Network', icon: Folder}),
            S.listItem()
              .title('Lab')
              .icon(Folder)
              .child(
                S.documentTypeList('lab')
                  .title('Lab')
              ),
          ])
      },
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes
  }
})
