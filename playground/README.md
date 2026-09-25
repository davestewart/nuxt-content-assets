# Nuxt Content Assets Playground

## Overview

The playground demos the module's main features, one page each:

- **Paths**: relative paths from the same, sub and parent folders, and absolute paths
- **Media**: links, video, iframes and embeds
- **Frontmatter**: asset paths in frontmatter, passed to components
- **Srcset**: high resolution variants
- **Nuxt Image**: rendering content images with `<NuxtImg>`
- **Live reload**: add, edit and delete assets while the dev server runs
- **GitHub source**: content and images from a remote [collection source](https://content.nuxt.com/docs/collections/sources#repository-sources), at `/external`

Edge cases are covered by the unit and e2e tests in `/test`, rather than here.

## Running the playground

To view the playground locally, install its dependencies and run:

```
npm install --prefix ./playground
npm run dev
```

To view the playground online, visit:

- https://stackblitz.com/github/davestewart/nuxt-content-assets?file=playground%2Fapp%2Fapp.vue

## Structure

The playground uses [Nuxt UI](https://ui.nuxt.com) for its layout:

- `content.config.ts`: the content collection, with local and GitHub sources
- `app/app.vue`: header, sidebar and page layout
- `app/menu.ts`: the sidebar menu
- `app/pages/[...slug].vue`: queries and renders content
- `app/components/content/`: components used in markdown

Nuxt UI's `ProseImg` renders images through Nuxt Image and adds a zoom effect, so `app/components/content/ProseImg.vue` replaces it with a plain `<img>`, to show the markup the module outputs.

### Nuxt Image

To render all content images with Nuxt Image, replace `app/components/content/ProseImg.vue` with the one in `app/components/temp/`.
