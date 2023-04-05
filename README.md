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

Nuxt Content Assets enables locally-located assets in your [Nuxt Content](https://content.nuxtjs.org/) folder:

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

Relative paths are defined by anything not starting with a slash or `http`, for example:

```
image.jpg
images/featured.png
../assets/cv.pdf
```

Note that only specific tags and attributes are targeted:

```html
<img src="...">
<video src="...">
<audio src="...">
<source src="...">
<embed src="...">
<iframe src="...">
<a href="...">
```

However, you can use relative paths in frontmatter:

```mdx
---
title: Portfolio Item 1
images:
  - images/image-1.jpg
  - images/image-2.jpg
  - images/image-3.jpg
---
```

Then pass these to components like so:

```markdown
::gallery{:images="images"}
::
```

> Note: to pass size hints in frontmatter, set the `imageSize` configuration [option](#image-size) to `'url'`

See the [Demo](demo/content/recipes/index.md) for an example.

### Supported assets

The following file extensions are targeted by default:

| Type   | Extensions                                                              |
|--------|-------------------------------------------------------------------------|
| Images | `png`, `jpg`, `jpeg`, `gif`, `svg`, `webp`                              |
| Media  | `mp3`, `m4a`, `wav`, `mp4`, `mov`, `webm`, `ogg`, `avi`, `flv`, `avchd` |
| Files  | `pdf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `odp`, `key`        |

See the [configuration](#output) section to modify or change this list, and the [Demo](demo/nuxt.config.ts) for an example.

### Images

The module can prevent content jumps by optionally writing image size information to generated `<img>` tags:

```html
<img src="/image.jpg?width=640&height=480" width="640" height="480" style="aspect-ratio:640/480">
```

If you use [ProseImg](https://content.nuxtjs.org/api/components/prose) components, you can pass these values to your own markup:

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

See the [configuration](#image-size) section to add this, and the [Demo](demo/components/temp/ProseImg.vue) for an example.

### Build

Once the dev server or build is running, the following happens:

- the module scans content folders for assets
- these are copied to a temporary build folder
- matching relative paths markdown are rewritten
- Nitro serves the assets from the new location

If you change any assets, you'll need to re-run the dev server / build (there is an [issue](https://github.com/davestewart/nuxt-content-assets/issues/1) open to look at this).

## Configuration

The module will run happily without configuration, but should you need to:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  'content-assets': {
    // where to generate and serve the assets from
    output: 'assets/content/[path]/[file]',
    
    // add additional extensions
    additionalExtensions: 'html',
    
    // completely replace supported extensions
    extensions: 'png jpg',
    
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
assets/content/[name]-[hash].[ext]
```

The first part of the path is where you want content assets to be served from:

```
assets/content/
```

The optional second part of the path indicates the relative location of each image: 

| Token       | Description                                | Example            |
|-------------|--------------------------------------------|--------------------|
| `[folder]`  | The relative folder of the file            | `posts/2023-01-01` |
| `[file]`    | The full filename of the file              | `featured.jpg`     |
| `[name]`    | The name of the file without the extension | `featured`         |
| `[hash]`    | A hash of the absolute source path         | `9M00N4l9A0`       |
| `[extname]` | The full extension with the dot            | `.jpg`             |
| `[ext]`     | The extension without the dot              | `jpg`              |

For example:

| Template                             | Output                                             |
|--------------------------------------|----------------------------------------------------|
| `assets/img/content/[folder]/[file]` | `assets/img/content/posts/2023-01-01/featured.jpg` |
| `assets/img/[name]-[hash].[ext]`     | `assets/img/featured-9M00N4l9A0.jpg`               |
| `content/[hash].[ext]`               | `content/9M00N4l9A0.jpg`                           |

Note that the module defaults to:

```
/assets/content/[folder]/[file]
```

### Extensions

You can add (or replace) supported extensions if you need to:

To add extensions, use `additionalExtensions`:

```ts
{
  additionalExtensions: 'html' // add support for html
}
```

To replace extensions, use `extensions`:

```ts
{
  extensions: 'png jpg' // serve png and jpg files only
}
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
