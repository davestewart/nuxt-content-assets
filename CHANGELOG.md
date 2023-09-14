# Changelog

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
