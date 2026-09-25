# Changelog

### v3.0.0

Nuxt Content 3 support. The module now targets `@nuxt/content` v3 only; for Nuxt Content 2 keep using `nuxt-content-assets@1`.

- Rewrite asset paths via Nuxt Content's `content:file:afterParse` hook (works for `minimark` and `hast` bodies) [#93](../../issues/93)
- Read collections and sources from `content.config.ts`, including `cwd` and remote git sources
- Copy assets and index them entirely in the build process; no Nitro plugin, sockets or storage layer
- Live reload over Vite's HMR channel instead of a separate websocket server
- Re-parse documents when assets change by contributing a fingerprint to Nuxt Content's parse cache key
- Drop the `unstorage`, `ws`, `listhen`, `debounce` and `unist-util-visit` dependencies
- Port the Nuxt UI playground and end-to-end tests from v1.9 to Nuxt Content 3 [#53](../../issues/53)
- Requires Node 20.19+

### v1.9.0

- Generate `srcset` and `sizes` for images with `@2x` / `@3x` variants [#106](../../issues/106)
- Register the assets cache as a Nuxt layer automatically, so Nuxt Image works without `extends` [#84](../../issues/84)
- Copy assets on `modules:done` so builds restored from `experimental.buildCache` still get assets [#88](../../issues/88)
- Only invalidate Nuxt Content's cache for documents affected by asset changes, rather than clearing it on every run [#18](../../issues/18)
- Live reload Nuxt Image images and `srcset` candidates [#77](../../issues/77)
- Respect `contentExtensions` when deciding which files are assets (custom transformer content is no longer copied to public)
- Process assets referenced inside headings
- Preserve query strings on frontmatter asset paths (previously only kept when `imageSize` included `src`)
- Fix relative path detection for `data:`, `mailto:` and anchor links
- Fix source keys containing non-word characters (e.g. `my-source`)
- Fix crash when rewriting cached documents with non-string frontmatter values
- Resolve the cache folder relative to the package rather than searching `node_modules`
- Fix authored `srcset` attributes being replaced by generated ones
- Add CI, typechecking, ESLint 9, more unit tests and end-to-end tests; upgrade `image-size` to v2; require Node 18.20+

### v1.8.3

- Update build to export types [#103](../../issues/103)

### v1.8.2

- Fix AST props check leading to skipping of asset processing [#102](../../issues/102)

### v1.8.1

- Fix ignore assets regexp generation [#98](../../issues/98)

### v1.8.0

- Strip ordering from asset paths [#57](../../issues/57)

### v1.7.0

- Add support for image path query strings [#41](../../issues/41)

### v1.6.0

- Support `avif`, `bmp` and `cur` image formats [#83](../../issues/83)

### v1.5.2

- Nuxt 4 compatibility

### v1.5.1

- Update dependencies

### v1.5.0

- Migrate to top-level `/content` directory [#85](../../issues/85)

### v1.4.4

- Prevent supported assets (`mdx json yml csv`) being copied to `public` [#63](../../issues/63)

### v1.4.3

- Refactor cache storage to support Nuxt Image [#76](../../issues/76)

### v1.4.2

- Fix splash image

### v1.4.1

- Skip sockets setup if content watch is disabled [#72](../../issues/72)

### v1.4.0

- Update Nuxt Image support to support multiple folders

### v1.3.7

- Update module builder [#69](../../issues/69)

### v1.3.5

- Close storage drivers when nuxt is closing [#49](../../issues/49)

### v1.3.4

- Opt in to `import.meta.*` properties (#66)
- Update Nuxt compatibility

### v1.3.3

- Fix Demo [#44](../../issues/44)

### v1.3.2

- Ensure paths always use forward slashes [#37](../../issues/37)

### v1.3.1

- Fix `ignores` bug preventing ordered content from displaying [#36](../../issues/36)

### v1.3.0

- Make compatible with Nuxt Image

### v1.2.1

- Fix broken user config

### v1.2.0

- Fix image size change and live-reload [#30](../../issues/30)

### v1.1.2

- Fix non-default watch port [#28](../../issues/28)

### v1.1.1

- Optimise image size hint processing [#25](../../issues/25)

### v1.1.0

- Change config `imageSize` option from `url` to `src`
- Allow disabling of config `imageSize` by passing `false`
- Improve style and query string addition to respect existing properties 

### v1.0.0

- Default to `aspect-ratio` for image size hints
- Fix bug with frontmatter size hints
- Retry websocket connection a maximum of 5 times in the client
- Log websocket url in build

### v0.10.3

- Prevent overwriting existing image size attributes [#16](../../issues/16)

### v0.10.2

- Optimise AST parsing [#14](../../issues/14)

### v0.10.1

- Respect ignored files and folders [#12](../../issues/12)

### v0.10.0

- Resolve paths for any element attribute [#5](../../issues/5)

### v0.9.0-beta

- Refactor of live reload
- Fixed ignore yaml issue [#9](../../issues/9)

### v0.9.0-alpha

- First draft of live reload using `unstorage` and local sockets

### v0.8.0

- Removed requirement to explicitly configure asset extensions [#2](../../issues/2)

### v0.7.0

- Added support for multiple sources [#5](../../issues/5)

### v0.6.1

- Fixed first-run issues [#4](../../issues/4)

### v0.6.0

- Added `imageSize: 'url'` preference to pass image size hints in frontmatter paths
- Updated demo with frontmatter component example

### v0.5.3

- Set compatibility info
- Add splash

### v0.5.2

- Change `imageAttrs` to `imageSize`
- Change assets path to full path

### v0.5.1

- Initial release
