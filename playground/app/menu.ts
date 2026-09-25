import type { NavigationMenuItem } from '@nuxt/ui'

export const menu: NavigationMenuItem[][] = [
  [
    { label: 'Home', icon: 'i-lucide-house', to: '/' },
  ],
  [
    { label: 'Features', type: 'label' },
    { label: 'Paths', icon: 'i-lucide-folder-tree', to: '/paths' },
    { label: 'Media', icon: 'i-lucide-film', to: '/media' },
    { label: 'Frontmatter', icon: 'i-lucide-file-code', to: '/frontmatter' },
    { label: 'Srcset', icon: 'i-lucide-images', to: '/srcset' },
    { label: 'Nuxt Image', icon: 'i-lucide-image', to: '/nuxt-image' },
    { label: 'Live reload', icon: 'i-lucide-refresh-cw', to: '/live-reload' },
  ],
]
