---
title: Nuxt Image
description: Render content images through Nuxt Image and IPX
---

Nuxt Image can resize and optimise content images, as the module registers its cache folder as a Nuxt layer:

:nuxt-img{src="shared/sicilian-fish-stew.jpg" :placeholder="20"}

```md
:nuxt-img{src="shared/sicilian-fish-stew.jpg" :placeholder="20"}
```

This works because the playground makes `<NuxtImg>` a global component in `nuxt.config.ts`, so markdown can use it.

## All content images

To render all content images with Nuxt Image, replace `app/components/content/ProseImg.vue` with the one in `app/components/temp/`.

See the [docs](https://github.com/davestewart/nuxt-content-assets#nuxt-image) for more info.
