# Nuxt Content Assets Playground

## Overview

The playground shows off the module's main features:

- various relative path locations
- local and [external](https://content.nuxt.com/docs/collections/sources#remote-source) content sources
- inline and `frontmatter` image paths
- image, link, video, iframe, and embed examples
- automatic `srcset` for high resolution images
- live reload; edit, crop or move images, video, embeds, etc

Additionally, configuration:

- `imageSize`: image size hints added to rendered images
- `debug`: see what the module is doing

And, components:

- example `<ContentGallery>` and `<ContentImage>` components
- example `<ProseImg />` component

## Notes

- The playground uses `@nuxt/image` 1.x. With `@nuxt/image` 2.1 (IPX 4 beta) `nuxi generate` stalled during prerendering of `_ipx` routes in this toolchain (Nuxt 4.5, Nitro 2.13), with or without this module enabled.
- Dependencies are installed from the repository root; the playground has no `node_modules` of its own.

## Running the playground

To view the playground locally, run:

```
npm run dev
```
