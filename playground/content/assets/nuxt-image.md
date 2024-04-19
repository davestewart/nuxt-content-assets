# Nuxt image example

This is single example of using Nuxt Image:

:nuxt-img{src="images/sicilian-fish-stew.jpg" :placeholder="20"}

It requires:

- a global `NuxtImg.ts` component in `/components/content`
- this component proxies `NuxtImg` directly from the `@nuxt/image` module

To make all content images Nuxt Image:

- create a `<ProseImg>` component in `/components/content`
- you can copy the one from `/components/temp` to test it out

See the [docs](https://github.com/davestewart/nuxt-content-assets#nuxt-image) for more info.

> **Note:** the image on the [Home](/) page is also rendered using Nuxt Image – but directly from the `/public` folder.
> 
> Nuxt Content Assets changed how it supports Nuxt Image (from [config](https://github.com/davestewart/nuxt-content-assets/tree/172cc241ed43e06eeffabded226eb94da1bd0558#nuxt-image-compatibility) to [layers](https://github.com/davestewart/nuxt-content-assets#nuxt-image)) in `v1.4.0`.

