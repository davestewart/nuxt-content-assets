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

## Demo

To clone and run the demo locally:

```bash
git clone https://github.com/davestewart/nuxt-content-assets.git
cd nuxt-content-assets
npm install && npm install --prefix ./demo
npm run dev
```

Then open the demo in your browser at <a href="http://localhost:3000" target="_blank">localhost:3000</a>.

To run the demo online, visit:

- https://stackblitz.com/github/davestewart/nuxt-content-assets?file=demo%2Fapp.vue

To browse the demo folder:

- https://github.com/davestewart/nuxt-content-assets/tree/main/demo

## Setup

Install the dependency:

```bash
npx nuxi@latest module add content-assets
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

See the Demo for [markup](demo/content/advanced/gallery.md) and [component](demo/components/content/ContentGallery.vue) examples.

### Live reload

In development, the module watches for asset additions, moves and deletes, and will update the browser live.

If you delete an asset, it will be greyed out in the browser until you replace the file or modify the path to it.

If you edit an image, video, embed or iframe source, the content will update immediately, which is useful if you're looking to get that design just right!

### Image sizing

#### HTML

The module is [preconfigured](#image-size) to pass image size hints (by default `style`) to generated `<img>` tags:

```html
<!-- imageSize: 'style' -->
<img src="/image.jpg" style="aspect-ratio:640/480">

<!-- imageSize: 'attrs' -->
<img src="/image.jpg" width="640" height="480">
```

Keeping this on prevents content jumps as your page loads.

#### Prose components

If you use [ProseImg](https://content.nuxtjs.org/api/components/prose) components, you can [hook into](demo/components/temp/ProseImg.vue) image size hints via the `$attrs` property:

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

If you pass [frontmatter](demo/content/advanced/gallery.md) to [custom components](demo/components/content/ContentImage.vue) set `imageSize` to `'src'` to encode values in `src`:

```
:image-content{:src="image"}
```

The component will receive the size information as a query string which you can extract and apply:

```html
<img class="image-content" src="/image.jpg?width=640&height=480">
```

See demo component [here](demo/components/content/ContentImage.vue).

### Nuxt Image compatibility

Nuxt Content Assets works with [Nuxt Image](https://image.nuxtjs.org/) with just a little configuration.

First, configure Nuxt Image to use Nuxt Content Asset's public folder:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  image: {
    dir: '.nuxt/content-assets/public'
  }
}
```

Then, create a `ProseImg` component like so:

```vue
<!-- components/content/ProseImg.vue -->
<template>
  <nuxt-img />
</template>
```

Any images rendered by Nuxt Content will now use Nuxt Image.

> For a per-image solution, check the [override](demo/components/content/NuxtImg.ts) in the demo folder.


## Configuration

The module has the following options:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  contentAssets: {    
    // inject image sizes into the rendered html
    imageSize: 'style',
    
    // treat these extensions as content
    contentExtensions: 'md csv ya?ml json',
    
    // output debug messages
    debug: false,
  }
})
```

### Image size

You can add one or more image size hints to the generated images:

```ts
{
  imageSize: 'style attrs src'
}
```

Pick from the following switches:

| Switch    | What it does                                                 |
| --------- | ------------------------------------------------------------ |
| `'style'` | Adds `style="aspect-ratio:..."` to any `<img>` tag           |
| `'attrs'` | Adds `width` and `height` attributes to any `<img>` tag      |
| `'src'`   | Adds `?width=...&height=...` to `src` attribute (frontmatter only) |
| `false`   | Disable image size hints                                     |

Note: if you add *only* `attrs`, include the following CSS in your app:

```css
img {
  max-width: 100%;
  height: auto;
}
```

### Content extensions

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

When Nuxt builds, the module scans all content sources for assets, copies them to an accessible public assets folder, and indexes path and image metadata.

After Nuxt Content has run, the parsed content is traversed, and both element attributes and frontmatter properties are checked to see if they resolve to the indexed asset paths.

If they do, then the attribute or property is rewritten with the absolute path. If the asset is an image, then the element or metadata is optionally updated with size attributes or a query string.

Finally, Nitro serves the site, and any requests made to the transformed asset paths should be picked up and the *copied* asset served by the browser.

In development, file watching propagates asset changes to the public folder, updates related cached content, and notifies the browser via web sockets to refresh any loaded images. 

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

## Troubleshooting

### Prepare script hangs

As of Nuxt `3.7` it seems there might be issues running prepare scripts for some modules:

- [nuxt/cli / nuxt prepare step hangs](https://github.com/nuxt/cli/issues/169)

If that's the case with you, fix Nuxt at `3.6.5` (if you can) and you should be fine.

Failing that, watch that ticket (or these ones):

- https://github.com/nuxt/cli/issues/185
- https://github.com/davestewart/nuxt-content-assets/issues/49

I'll update when there is more info.

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-content-assets/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-content-assets

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-content-assets.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-content-assets

[license-src]: https://img.shields.io/npm/l/nuxt-content-assets.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-content-assets

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
