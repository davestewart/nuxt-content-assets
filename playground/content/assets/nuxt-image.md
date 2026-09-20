# Nuxt Image

> Using Nuxt Image with content assets

This is a single example of using Nuxt Image:

:nuxt-img{src="images/sicilian-fish-stew.jpg" :placeholder="20"}

It requires `NuxtImg` to be registered as a global component so MDC can resolve it; the playground does this with a `components:extend` hook in `nuxt.config.ts`.

To make all content images Nuxt Image:

- create a `<ProseImg>` component in `app/components/content`
- you can copy the one from `app/components/temp` to test it out

The module registers its assets cache as a Nuxt layer, so IPX can serve the copied images without any further configuration.

See the [docs](https://github.com/davestewart/nuxt-content-assets#nuxt-image) for more info.

> **Note:** the image on the [Home](/) page is also rendered using Nuxt Image – but directly from the `/public` folder.
