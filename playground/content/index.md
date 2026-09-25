---
title: Playground
description: See each feature working, using the content in playground/content/
---

:nuxt-img{src="/splash.png" width="660" height="360" alt="Nuxt Content Assets" class="mx-auto"}

## How to use it

Each page in the menu demos one feature, showing the rendered result followed by the markdown that produced it.

To see what the module did:

- **Inspect the markup**: open your browser's dev tools and check the `src`, `width`, `height`, `style` and `srcset` attributes
- **Browse the source**: each page lives in its own folder in `playground/content/`, alongside its assets
- **Watch the terminal**: the playground sets `debug: true`, so the module logs every path it rewrites
- **Edit the files**: with the dev server running, add, change or delete assets and the page updates

## What to look for

| Page | Source | Check that |
|---|---|---|
| [Paths](/paths) | `content/paths/` | relative `src` paths are rewritten to `/paths/...` and `/shared/...`, and the absolute path is left alone |
| [Media](/media) | `content/media/` | `href` and `src` are rewritten to `/media/...`, and the PDF link gets `target="_blank"` |
| [Frontmatter](/frontmatter) | `content/frontmatter/` | components receive rewritten paths, such as `/frontmatter/turkey-casserole.jpg` |
| [Srcset](/srcset) | `content/srcset/` | the image gets a `srcset` listing `stew.jpg` and `stew@2x.jpg`, plus `sizes` |
| [Nuxt Image](/nuxt-image) | `content/nuxt-image.md` | the image `src` points to IPX, at `/_ipx/...` |
| [Live reload](/live-reload) | `content/live-reload/` | editing the image updates it, and its `width`, `height` and `aspect-ratio`, without a page reload |

## Configuration

The playground runs with the following options, set in `nuxt.config.ts`:

```ts
contentAssets: {
  imageSize: 'style attrs',
  debug: true,
}
```
