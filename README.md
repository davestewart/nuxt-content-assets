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

That's it!

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
![image](image.jpg)
<video src="media/video.mp4" />
```

Relative paths can also be passed in frontmatter, as long as they are the only value:

```mdx
---
title: Portfolio Item 1
images:
  - assets/image-1.jpg
  - assets/image-2.jpg
  - assets/image-3.jpg
---
```

These variables can then be passed to components:

```markdown
::gallery{:data="images"}
::
```

See the [Demo](demo/content/recipes/index.md) for an example.

### Images

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

### How it works

When Nuxt builds, the following happens:

- the module scans content source folders for assets
- found assets are copied to a temporary build folder
- after markdown is parsed, matching paths are rewritten
- finally, Nitro serves the copied assets via the new paths

Note only specific tags and attributes are targeted for rewriting:

```html
<a href="...">
<img src="...">
<video src="...">
<audio src="...">
<source src="...">
<embed src="...">
<iframe src="...">
```

If you modify any assets, you'll need to re-run the dev server / build (there is an [issue](https://github.com/davestewart/nuxt-content-assets/issues/1) open to look at this).

## Configuration

The module will run happily without configuration, but should you need to:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  'content-assets': {
    // where to generate and serve the assets from
    output: 'assets/content/[path]/[file]',
    
    // use aspect-ratio rather than attributes
    imageSize: 'style',
    
    // print debug messages to the console
    debug: true,
  }
})
```

### Output

The output path can be customised using a template string:

```
assets/[name]-[hash].[ext]
```

The first part of the path is where you want content assets to be served from:

```
assets/
```

The optional second part of the path indicates the relative location of each asset.

The table below shows replacements for the asset `content/posts/2023-01-01/featured.jpg`:

| Token       | Description                                                                                        | Example                    |
|-------------|----------------------------------------------------------------------------------------------------|----------------------------|
| `[key]`     | The config key of the source (see [sources](https://content.nuxtjs.org/api/configuration#sources)) | `content`                  |
| `[path]`    | The relative path of the source                                                                    | `content/posts/2023-01-01` |
| `[folder]`  | The relative path of the file's folder                                                             | `posts/2023-01-01`         |
| `[file]`    | The full filename of the file                                                                      | `featured.jpg`             |
| `[name]`    | The name of the file without the extension                                                         | `featured`                 |
| `[hash]`    | A hash of the absolute source path                                                                 | `9M00N4l9A0`               |
| `[extname]` | The full extension with the dot                                                                    | `.jpg`                     |
| `[ext]`     | The extension without the dot                                                                      | `jpg`                      |

For example:

| Template                     | Output                                         |
|------------------------------|------------------------------------------------|
| `assets/[path]/[file]`       | `assets/content/posts/2023-01-01/featured.jpg` |
| `assets/[folder]/[file]`     | `assets/posts/2023-01-01/featured.jpg`         |
| `assets/[name]-[hash].[ext]` | `assets/featured-9M00N4l9A0.jpg`               |
| `assets/[hash].[ext]`        | `assets/9M00N4l9A0.jpg`                        |

Note that the module defaults to:

```
/assets/[path]/[file]
```

### Image size

You can add image size hints to the generated images via attributes, style, or the URL.

To add `style` aspect-ratio:

```ts
{
  imageSize: 'style'
}
```

To add `width` and `height` attributes:

```ts
{
  imageSize: 'attrs'
}
```

If you add `attributes` only, include the following CSS in your app:

```css
img {
  max-width: 100%;
  height: auto;
}
```

To pass size hints as parameters in the URL (frontmatter only, see [Demo](demo/components/content/Gallery.vue)):

```ts
{
  imageSize: 'url'
}
```

Note that you can one, some or all keywords, i.e. `attrs url`.

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
