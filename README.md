# Nuxt Content Assets

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> Enable locally-located assets in Nuxt Content

<p align="center">
  <img src="https://raw.githubusercontent.com/davestewart/nuxt-content-assets/main/playground/public/splash.png" alt="Nuxt Content Assets logo">
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

### Features

Built on top of [Nuxt Content](https://github.com/nuxt/content/) and compatible with any Nuxt Content project or theme, including [Docus](https://github.com/nuxt-themes/docus).

User experience:

- co-locate assets with content files
- reference assets using relative paths
- supports any format (image, video, doc)

Developer experience:

- works with tags and custom components
- works in markdown and frontmatter
- file watching and asset live-reload
- image size injection
- zero config

## Playground

To test the module before installing, you can try out the Nuxt Content Assets playground.  

To clone and run locally:

```bash
git clone https://github.com/davestewart/nuxt-content-assets.git
cd nuxt-content-assets
npm install && npm install --prefix ./playground
npm run dev
```

Then open the playground in your browser at <a href="http://localhost:3000" target="_blank">localhost:3000</a>.

To run the playground online, visit:

- https://stackblitz.com/github/davestewart/nuxt-content-assets?file=playground%2Fapp.vue

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

See the playground for [markup](playground/content/advanced/gallery.md) and [component](playground/components/content/ContentGallery.vue) examples.

### Live reload

In development, the module watches for asset additions, moves and deletes, and will update the browser live.

If you delete an asset, it will be greyed out in the browser until you replace the file or modify the path to it.

If you edit an image, video, embed or iframe source, the content will update immediately, which is useful if you're looking to get that design just right!

> [!NOTE]
> Live reload does not currently work with Nuxt Image (see Issue #77).
> 
> If you need to iterate on image design, consider disabling Nuxt Image in development.

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

If you use [ProseImg](https://content.nuxtjs.org/api/components/prose) components, you can [hook into](playground/components/temp/ProseImg.vue) image size hints via the `$attrs` property:

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

If you pass [frontmatter](playground/content/advanced/gallery.md) to [custom components](playground/components/content/ContentImage.vue) set `imageSize` to `'src'` to encode values in `src`:

```
:image-content{:src="image"}
```

The component will receive the size information as a query string which you can extract and apply:

```html
<img class="image-content" src="/image.jpg?width=640&height=480">
```

See playground component [here](playground/components/content/ContentImage.vue).

### Nuxt Image

[Nuxt Image](https://image.nuxtjs.org/) is supported by adding Nuxt Content Asset's cache folder as a Nuxt Layer:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [
    'node_modules/nuxt-content-assets/cache',
  ],
}
```

To serve all images as Nuxt Image images, create a `ProseImg` component like so:

```vue
<!-- components/content/ProseImg.vue -->
<template>
  <nuxt-img />
</template>
```

See the playground folder for both the [global](playground/components/temp/ProseImg.vue) and a [per image](playground/components/content/NuxtImg.ts) solution.

## Configuration

The module has the following options:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  contentAssets: {    
    // inject image size hints into the rendered html
    imageSize: 'style',
    
    // treat these extensions as content
    contentExtensions: 'md csv ya?ml json',
    
    // output debug messages
    debug: false,
  }
})
```

### Image size

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

> [!Note]
> 
> Since `v1.4.1` image size hints are now opt-in. This was done to maximise compatibiility with Nuxt Image.  

### Content extensions

> [!NOTE]
> Generally, you shouldn't need to touch this setting

This setting tells Nuxt Content to ignore anything that is **not** one of these file extensions:

```
md csv ya?ml json
```

This way, you can use any **other** file type as an asset, without needing to explicitly configure extensions.

### Debug

If you want to see what the module does as it runs, set `debug` to true:

```ts
{
  debug: true
}
```

## How it works

When Nuxt builds, the module scans all content sources for assets, copies them to a temporary layer folder (`nuxt_modules/nuxt-content-assets/cache`), and indexes path and image metadata.

After Nuxt Content has run, the parsed content (`.nuxt/content-cache`) is traversed, and both element attributes and frontmatter properties are checked to see if they resolve to the previously-indexed asset paths.

If they do, then the attribute or property in Nuxt Content's cache is rewritten with the absolute path. If the asset is an image, then the element or metadata is optionally updated with size attributes or a query string.

Finally, Nitro serves the site, and any requests made to the transformed asset paths should be picked up and the *copied* asset served by the browser.

In development, a watch process propagates asset changes to the cache, updates the asset index, and notifies the browser via web sockets to refresh any loaded images. 

If Nuxt Image is used, the `_ipx/` endpoint serves images directly from the cache's public folder.

## Development

Should you wish to develop the project, you'll work with the following entities:

- [src](./src)<br>The module code itself
- [playground](./playground)<br>A standalone Nuxt app that reads the live module code
- [scripts](package.json)<br>A set of scripts to develop and publish the module

### Setup

To set up the project, run each of these scripts once:

```bash
# install dependencies
npm install

# copy the cache folder to the playground's node_modules (workaround required in development)
npm run dev:setup

# generate types for the module and playground (re-run if you install new packages)
npm run dev:prepare
```

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

# runs tests with vitest
npm run test
npm run test:watch
```

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
