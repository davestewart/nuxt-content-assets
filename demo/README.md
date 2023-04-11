# Nuxt Content Assets Demo

## Overview

The demo shows off the module's main features:

- various relative path locations
- using inline and `frontmatter` image paths
- image, link, video, iframe, and embed examples
- local and [external](https://content.nuxtjs.org/api/configuration#sources) sources
- live reload; edit, crop or move images

Additionally, configuration:

[//]: # (- `output`: custom output path)
- `imageSize`: image sizes passed by URL in frontmatter
- `debug`: see what the module is doing

And, components:

- example `<Gallery>` component
- example `<ProseImg />` component

## Running the demo

To view the demo locally, run:

```
npm run dev
```

To view the demo online, visit:

- https://stackblitz.com/github/davestewart/nuxt-content-assets?file=demo%2Fapp.vue

## Features

### Prose components

To view an example image [prose component](https://content.nuxtjs.org/api/components/prose/) passing generated attributes:

- move `components/temp/ProseImg.vue` to `components/content`
- restart the demo
