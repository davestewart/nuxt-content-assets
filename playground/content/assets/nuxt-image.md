# Nuxt image example

This is single example of using Nuxt Image:

:nuxt-img{src="assets/images/sicilian-fish-stew.jpg" :placeholder="20"}

It requires:

- a global `NuxtImg.ts` component in `/components/content`
- this component proxies `NuxtImg` directly from the `@nuxt/image` module

To make all content images Nuxt Image, create a `<ProseImg>` component.

See the [docs](https://github.com/davestewart/nuxt-content-assets#nuxt-image-compatibility) for more info.
