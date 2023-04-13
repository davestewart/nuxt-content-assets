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

:video{src="media/seaside.mp4"}
```

At build time the module [collates and serves](#how-it-works) assets and content together.

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

## Usage

### Overview

Use relative paths anywhere within your documents:

```mdx
Images
![image](image.jpg)

Links
[link](docs/article.txt)

Elements / components
:video{src="media/video.mp4"}

HTML
<iframe src="media/example.html" />
```

Relative paths can be defined in frontmatter – as long as they are the only value:

```mdx
---
title: Portfolio
images:
  - assets/image-1.jpg
  - assets/image-2.jpg
  - assets/image-3.jpg
---
```

These values can then be passed to components:

```markdown
:image-gallery{:data="images"}
```

See the Demo for [markup](demo/content/advanced/gallery.md) and [component](demo/components/content/ContentGallery.vue) examples.

### Live reload

In development, the module watches for asset additions, moves and deletes, and will update the browser live.

If you delete an asset, it will be greyed out in the browser until you replace the file or modify the path to it.

If you edit an image, video, embed or iframe source, the content will update immediately, which is useful if you're looking to get that design just right!

### Image sizing

You can [configure](#image-size) the module to add image size attributes to generated `<img>` tags:

```html
<img src="/image.jpg"
     style="aspect-ratio:640/480"
     width="640"
     height="480"
>
```

If you use [ProseImg](https://content.nuxtjs.org/api/components/prose) components, you can [hook into these values](demo/components/temp/ProseImg.vue) via the `$attrs` property:

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

If you pass [frontmatter](demo/content/advanced/gallery.md) to [custom components](demo/components/content/ContentImage.vue) set the `'url'` configuration option to encode size in the URL:

```
:image-gallery={:data="images"}
```

## Configuration

The module can be configured in your Nuxt configuration file:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  contentAssets: {    
    // inject image sizes into the rendered html
    imageSize: 'style',
    
    // treat these extensions as content
    contentExtensions: 'mdx? csv ya?ml json',
    
    // output debug messages
    debug: true,
  }
})
```

### Image size

You can add one or more image size hints to the generated images:

```ts
{
  imageSize: 'attrs url'
}
```

Pick from the following switches:

| Switch  | What it does                                                 |
| ------- | ------------------------------------------------------------ |
| `style` | Adds `style="aspect-ratio:..."` to any `<img>` tag           |
| `attrs` | Adds `width` and `height` attributes to any `<img>` tag      |
| `url`   | Adds a `?width=...&height=...` query string to image paths in frontmatter |

Note: if you add `attrs` only, include the following CSS in your app:

```css
img {
  max-width: 100%;
  height: auto;
}
```

### Content extensions

This setting tells Nuxt Content to ignore anything that is **not** one of these file extensions:

```
mdx? csv ya?ml json
```

This way, you can use any **other** file type as an asset, without needing to explicitly configure extensions.

Generally, you shouldn't need to touch this setting.

### Debug

If you want to see what the module does as it runs, set `debug` to true:

```ts
{
  debug: true
}
```

## How it works

When Nuxt builds, the module scans all content sources for assets, copies them to an accessible public assets folder, and indexes path and image metadata.

After Nuxt Content has run the parsed content is traversed, and both element attributes and frontmatter properties are checked to see if they resolve to the indexed asset paths.

If they do, then the attribute or property is rewritten with the absolute path. If the asset is an image, then the element or path is optionally updated with size attributes or size query string.

Finally, Nitro serves the site, and any requests made to the transformed asset paths should be picked up and the *copied* asset served by the browser.

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
