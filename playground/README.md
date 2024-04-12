# Nuxt Content Assets Demo

## Overview

The playground shows off the module's main features:

- various relative path locations
- local and [external](https://content.nuxtjs.org/api/configuration#sources) content sources
- inline and `frontmatter` image paths
- image, link, video, iframe, and embed examples
- live reload; edit, crop or move images, video, embeds, etc

Additionally, configuration:

[//]: # (- `output`: custom output path)
- `imageSize`: image sizes passed by URL in frontmatter
- `debug`: see what the module is doing

And, components:

- example `<ContentGallery>` and `<ContentImage>` components
- example `<ProseImg />` component

## Running the playground

To view the playground locally, run:

```
npm run dev
```

To view the playground online, visit:

- https://stackblitz.com/github/davestewart/nuxt-content-assets?file=playground%2Fapp.vue

## Features

### Prose components

To view an example image [prose component](https://content.nuxtjs.org/api/components/prose/) passing generated attributes:

- move `components/temp/ProseImg.vue` to `components/content`
- restart the playground
