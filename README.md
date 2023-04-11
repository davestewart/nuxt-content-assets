# Nuxt Content Assets

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> Enable locally-located assets in Nuxt Content

<p align="center">
  <img src="https://raw.githubusercontent.com/davestewart/nuxt-content-assets/main/demo/content/splash.png" alt="Nuxt Content Assets logo">
</p>

## Overview

Nuxt Content Assets enables locally-located assets in [Nuxt Content](https://content.nuxtjs.org/):

```
+- content
    +- posts
        +- 2023-01-01
            +- index.md
            +- media
                +- featured.png
                +- mountains.jpg
                +- seaside.mp4
```

In your documents, reference assets with relative paths:

```markdown
---
title: Summer Holiday
featured: media/featured.png
---

I loved being in the mountains.

![mountains](media/mountains.png)

Almost as much as being in the sea!

<video src="media/seaside.mp4"></video>
```

The module supports a variety of [common tags](#how-it-works) and has additional goodies such as [image sizing](#image-sizing) and [live-reload](#live-reload).  

## Demo

To view the demo locally, run:

```
npm run dev
```

To view the demo online, visit:

- https://stackblitz.com/github/davestewart/nuxt-content-assets?file=demo%2Fapp.vue

You can browse the demo files in:

- https://github.com/davestewart/nuxt-content-assets/tree/main/demo

## Setup

Install the dependency:

```bash
npm install nuxt-content-assets
```

Configure `nuxt.config.ts`:

```js
export default defineNuxtConfig({
  modules: [
    'nuxt-content-assets', // make sure to add before content!
    '@nuxt/content',
  ]
})
```

Run the dev server or build and local assets should now be served alongside markdown content.

See the [How it works](#how-it-works) section for more information.

## Usage

### Overview

Use relative paths anywhere within your documents:

```mdx
![image](image.jpg)
<video src="media/video.mp4" />
```

Relative paths can be defined in frontmatter, as long as they are the only value:

```mdx
---
title: Portfolio Item 1
images:
  - assets/image-1.jpg
  - assets/image-2.jpg
  - assets/image-3.jpg
---
```

These values can then be passed to components:

```markdown
::gallery{:data="images"}
::
```

See the [Demo](demo/content/recipes/index.md) for a component example.

### Live reload

From version `0.9.0-alpha` assets are watched and live-reloaded!

Any additions, moves or deletes, or modifications to image content will be updated in the browser automatically.

### Image sizing

The module can prevent content jumps by optionally writing image size information to generated `<img>` tags:

```html
<img src="/image.jpg?width=640&height=480" width="640" height="480" style="aspect-ratio:640/480">
```

If you use [ProseImg](https://content.nuxtjs.org/api/components/prose) components, you can hook into these values via the `$attrs` property:

```vue
<template>
  <span class="image">
    <img :src="$attrs.src" :width="$attrs.width" :height="$attrs.height" />
  </span>
</template>

<script>
export default {
  inheritAttrs: false
}
</script>
```

For more information see the [configuration](#image-size) section and [Demo](demo/components/temp/ProseImg.vue) for an example.

## How it works

Nuxt Content Assets works by serving a _copy_ of your assets using [Nitro](https://nitro.unjs.io/guide/assets#custom-server-assets).

When Nuxt builds, the following happens:

- all content sources are scanned for valid assets
- found assets are copied to a temporary build folder
- relative paths in markdown are rewritten to point at this folder
- metadata such as image size is written to a lookup file
- finally, Nitro serves the folder for public access

Note only specific tags and attributes are targeted in the parsing phase for rewriting:

```html
<a href="...">
<img src="...">
<video src="...">
<audio src="...">
<source src="...">
<embed src="...">
<iframe src="...">
```

## Configuration

You can configure the module like so:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  'content-assets': {    
    // use aspect-ratio rather than attributes
    imageSize: 'style',
    
    // print debug messages to the console
    debug: true,
  }
})
```

Note that from version `0.9.0-alpha` the `output` location is no longer configurable; images are copied relative to their original locations. 

### Image size

You can add one or more image size hints to the generated images:

```ts
{
  imageSize: 'attrs url'
}
```

Pick from the following switches:

| Switch  | What it does                                                                 |
|---------|------------------------------------------------------------------------------|
| `style` | Adds `style="aspect-ratio:..."` to any `<img>` tag                           |
| `attrs` | Adds `width` and `height` attributes to any `<img>` tag                      |
| `url`   | Adds the `?width=...&height=...` query string to image frontmatter variables |

Note: if you add `attrs` only, include the following CSS in your app:

```css
img {
  max-width: 100%;
  height: auto;
}
```

### Debug

If you want to see what the module does as it runs, set `debug` to true:

```ts
{
  debug: true
}
```

## Development

Should you wish to develop the project, the scripts are:

Develop the module itself:

```bash
# install dependencies
npm install

# develop (runs using the demo)
npm run dev

# run eslint
npm run lint

# run vitest
npm run test
npm run test:watch
```

Build and check the demo:

```bash
# generate demo type stubs
npm run demo:prepare

# generate the demo output
npm run demo:generate

# serve the demo output
npm run demo:serve

# build the demo
npm run demo:build
```

Make a new release:

```bash
# release new version
npm run release

# dry run the release
npm run release:dry
```

Make sure to edit changelog and update `package.json` version first!

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-content-assets/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-content-assets

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-content-assets.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-content-assets

[license-src]: https://img.shields.io/npm/l/nuxt-content-assets.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-content-assets

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
