# Nuxt Content Assets

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> Enable locally-located assets in Nuxt Content

> [!IMPORTANT]
> Version 3 of this module supports **Nuxt Content 3**. If you are still on Nuxt Content 2, install `nuxt-content-assets@1` and see the [1.x README](https://github.com/davestewart/nuxt-content-assets/tree/1.x#readme).

<p align="center">
  <img src="https://raw.githubusercontent.com/davestewart/nuxt-content-assets/main/playground/public/splash.png" alt="Nuxt Content Assets logo">
</p>

## Overview

Nuxt Content Assets enables locally-located assets in [Nuxt Content](https://content.nuxt.com/):

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

### Features

Built on top of [Nuxt Content](https://github.com/nuxt/content/) v3 and compatible with any Nuxt Content project or theme, including [Docus](https://docus.dev/).

User experience:

- co-locate assets with content files
- reference assets using relative paths
- supports any format (image, video, doc)

Developer experience:

- works with tags and custom components
- works in markdown and frontmatter
- works with local, `cwd` and remote (git) collection sources
- file watching and asset live-reload
- image size and `srcset` injection
- Nuxt Image support
- zero config

## Playground

To test the module before installing, you can try out the Nuxt Content Assets playground.  

To clone and run locally:

```bash
git clone https://github.com/davestewart/nuxt-content-assets.git
cd nuxt-content-assets
npm install
npm run dev
```

Then open the playground in your browser at <a href="http://localhost:3000" target="_blank">localhost:3000</a>.

To run the playground online, visit:

- https://stackblitz.com/github/davestewart/nuxt-content-assets?file=playground%2Fapp%2Fapp.vue

To browse the playground folder:

- https://github.com/davestewart/nuxt-content-assets/tree/main/playground

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

> [!NOTE]
> The module must be listed **before** `@nuxt/content`. It contributes a fingerprint of your assets to Nuxt Content's parse cache so that documents are re-parsed when assets change; if Content sets up first, cached documents may keep stale paths until you edit them.

## Usage

### Overview

Use relative paths anywhere within your documents:

```md
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

```md
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

Both schema fields and free-form `meta` fields are rewritten.

See the playground for [markup](playground/content/advanced/gallery.md) and [component](playground/app/components/content/ContentGallery.vue) examples.

### Collections and sources

Assets are discovered from the same places Nuxt Content reads documents. For each collection source in `content.config.ts`, the module scans the source folder (the fixed part of the `include` glob, under `cwd` or `content/`) for any file that isn't a content file, and serves it under the source's `prefix`:

```ts
// content.config.ts
export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**',                    // assets served from /blog/...
    }),
    docs: defineCollection({
      type: 'page',
      source: {
        include: '**',
        cwd: '~~/packages/docs/content',    // assets served from /...
        prefix: '/docs',                    // ...or /docs/... when a prefix is set
      },
    }),
  },
})
```

Remote sources (`repository`) are cloned by Nuxt Content on first build; the module picks their assets up as soon as the first document from that source is parsed.

### Live reload

In development, the module watches for asset additions, moves and deletes, and will update the browser live.

If you delete an asset, it will be greyed out in the browser until you replace the file or modify the path to it.

If you edit an image, video, embed or iframe source, the content will update immediately, which is useful if you're looking to get that design just right!

### Image sizing

#### HTML

The module can pass image size hints to generated `<img>` tags:

```html
<!-- imageSize: 'style' -->
<img src="/image.jpg" style="aspect-ratio:640/480">

<!-- imageSize: 'attrs' -->
<img src="/image.jpg" width="640" height="480">
```

Turning this on prevents content jumps as your page loads.

> [!CAUTION]
> Don't use `imageSize: 'src'` in conjunction with Nuxt Image as it prevents the IPX module from correctly serving images, which causes static site generation to fail 

#### Prose components

If you use [ProseImg](https://content.nuxt.com/docs/components/prose) components, you can [hook into](playground/app/components/temp/ProseImg.vue) image size hints via the `$attrs` property:

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

#### Frontmatter

If you pass [frontmatter](playground/content/advanced/gallery.md) to [custom components](playground/app/components/content/ContentImage.vue) set `imageSize` to `'src'` to encode values in `src`:

```
:image-content{:src="image"}
```

The component will receive the size information as a query string which you can extract and apply:

```html
<img class="image-content" src="/image.jpg?width=640&height=480">
```

See playground component [here](playground/app/components/content/ContentImage.vue).

### High resolution images

If you provide high resolution variants of an image alongside the original, the module will generate `srcset` and `sizes` attributes automatically:

```
+- content
    +- posts
        +- index.md
        +- diagram.png
        +- diagram@2x.png
        +- diagram@3x.png
```

```md
![Diagram](diagram.png)
```

```html
<img
  src="/posts/diagram.png"
  srcset="/posts/diagram.png 480w, /posts/diagram@2x.png 960w, /posts/diagram@3x.png 1440w"
  sizes="(max-width: 480px) 100vw, 480px"
>
```

See the [configuration](#srcset) section to customise or disable this.

### Nuxt Image

[Nuxt Image](https://image.nuxtjs.org/) is supported out of the box; the module registers its assets cache as a Nuxt layer so IPX can serve the copied images.

> [!NOTE]
> Prior to `v1.9.0` you needed to add `node_modules/nuxt-content-assets/cache` to `extends` in your Nuxt config. This is no longer required, but is harmless if left in place.
>
> If your `ProseImg` forwards `$attrs` to `<NuxtImg>`, either exclude `srcset` and `sizes` or set `srcset: false`, as Nuxt Image generates its own.

To serve all images as Nuxt Image images, create a `ProseImg` component like so:

```vue
<!-- components/content/ProseImg.vue -->
<template>
  <nuxt-img />
</template>
```

See the playground folder for both the [global](playground/app/components/temp/ProseImg.vue) and a [per image](playground/app/components/content/NuxtImg.ts) solution.

## Configuration

The module has the following options:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  contentAssets: {    
    // inject image size hints into the rendered html
    imageSize: 'style',
    
    // treat these extensions as content
    contentExtensions: 'mdx? csv ya?ml json',

    // generate srcset attributes for images with high resolution variants
    srcset: true,

    // output debug messages
    debug: false,
  }
})
```

### Image size

> [!Note]
>
> Since `v1.4.1` image size hints are now opt-in. This was done to maximise compatibiility with Nuxt Image.

You can add one _or more_ image size hints to the generated images:

```ts
{
  imageSize: 'style attrs src'
}
```

Pick from the following switches:

| Switch    | What it does                                                       |
|-----------|--------------------------------------------------------------------|
| `'style'` | Adds `style="aspect-ratio:..."` to any `<img>` tag                 |
| `'attrs'` | Adds `width` and `height` attributes to any `<img>` tag            |
| `'src'`   | Adds `?width=...&height=...` to `src` attribute (frontmatter only) |

Note: if you add *only* `attrs`, include the following CSS in your app:

```css
img {
  max-width: 100%;
  height: auto;
}
```

### Content extensions

> [!NOTE]
> Generally, you shouldn't need to touch this setting, however, if you're looking to support custom content types [by way of transformers](https://content.nuxt.com/docs/advanced/transformers) then you'll need to add those extensions here.

This setting tells the module which files in a collection's source folder are content rather than assets:

```
mdx? csv ya?ml json
```

Anything **else** found in the folder is copied to the public folder and treated as an asset. Dot-prefixed files and folders, and anything matching a source's `exclude` globs, are skipped.

### Srcset

By default, the module looks for `@2x` and `@3x` variants of each image and, where found, generates `srcset` and `sizes` attributes on rendered `<img>` tags (see [High resolution images](#high-resolution-images)).

Pass an object to customise the behaviour, or `false` to disable it:

```ts
{
  srcset: {
    // naming pattern for variants; tokens are {name}, {scale} and {ext}
    pattern: '{name}@{scale}x.{ext}',

    // scale multipliers to look for
    scales: [2, 3],

    // template for the sizes attribute; {width} is the base image's width (or false to omit)
    sizes: '(max-width: {width}px) 100vw, {width}px',
  }
}
```

Note that `srcset` is only added to plain `<img>` tags, as Nuxt Image generates its own.

### Debug

If you want to see what the module does as it runs, set `debug` to true:

```ts
{
  debug: true
}
```

## How it works

When Nuxt starts, the module reads your `content.config.ts` (the same way Nuxt Content does), scans each collection source folder for non-content files, copies them to a cache folder within the package (`node_modules/nuxt-content-assets/cache/public`), and indexes path and image metadata.

As Nuxt Content parses each document (via its `content:file:afterParse` hook) both element attributes and frontmatter properties are checked to see if they resolve to indexed assets. If they do, the attribute or property is rewritten with the absolute public path before the document is stored in Nuxt Content's database. If the asset is an image, the element is optionally updated with size attributes, `srcset` or a query string.

Nuxt Content caches parsed documents between runs. The module contributes a fingerprint of the asset index to that cache key, so adding, removing or resizing assets re-parses documents on the next start.

Nitro serves the copied assets as public assets, and the cache folder is registered as a Nuxt layer so that Nuxt Image's `_ipx/` endpoint can find them in development.

In development, the module watches source folders for asset changes, updates the copy and index, and notifies the browser over Vite's HMR channel to refresh affected images, videos and embeds.

### Limitations

- In development, if you add or resize an image **after** the document referencing it has been parsed, the browser refreshes the image but the stored document keeps the old path or size until you save the document or restart the dev server. Nuxt Content does not currently expose a way for modules to re-parse individual documents.
- Remote (git) sources are only scanned once Nuxt Content has cloned them, so on a completely fresh build their assets are indexed when the first document from that source is parsed.

## Development

Should you wish to develop the project, you'll work with the following entities:

- [src](./src)<br>The module code itself
- [playground](./playground)<br>A standalone Nuxt 4 / Nuxt Content 3 app that reads the live module code
- [scripts](package.json)<br>A set of scripts to develop and publish the module

### Setup

To set up the project, run each of these scripts once:

```bash
# install dependencies
npm install

# generate types for the module and playground (re-run if you install new packages)
npm run dev:prepare
```

The playground uses Node's built-in SQLite driver (`sqliteConnector: 'native'`), so it needs Node 22.5 or later.

### Development

To develop the module, utilise the supplied playground app:

```bash
# compile the module, run and serve the playground
npm run dev

# generate the playground
npm run dev:generate

# build the playground
npm run dev:build

# serve the generated/built playground
npm run dev:preview
```

Check your code quality using these tools:

```bash
# lint your code with eslint
npm run lint

# check types
npm run typecheck

# runs tests with vitest
npm run test
npm run test:watch
```

These also run in CI on every pull request.

### Publishing

> [!IMPORTANT]
> Before publishing, be sure to update the [version](package.json) and [changelog](CHANGELOG.md)!

To build and publish, run following scripts as required:

```bash
# lint, test, build, and dry-run publish
npm run release:dry

# lint, test, build and publish
npm run release
```

## Maintenance

This module was created using the Nuxt [Module Builder](https://github.com/nuxt/module-builder) command:

```bash
npx nuxi init -t module nuxt-content-assets
```

This created the module code from the starter template found here:

- https://github.com/nuxt/starter/tree/module

Both [Nuxi](https://github.com/nuxt/cli) and the module's dependencies and scripts are updated fairly regularly, so from time to time this module may need to be updated to keep in sync. So far, this has meant just updating the dependencies and scripts, which are found in the starter template code mentioned above.

Note that the build/release scripts are slightly modified from the originals; build is now separated, and release now doesn't use [changelogen](https://github.com/unjs/changelogen), or automatically add tags and push to GitHub.

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-content-assets/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-content-assets

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-content-assets.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-content-assets

[license-src]: https://img.shields.io/npm/l/nuxt-content-assets.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-content-assets

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
