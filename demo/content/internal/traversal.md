# Code

> Path replacement skips invalid elements

Images `width` / `height` and `style` attributes should not be overwritten:

:img{src="../advanced/frontmatter/turkey-casserole.jpg" width="300"}

Code should be skipped:

```js
function getAsset(srcDoc, relAsset) {
  const srcAsset = Path.join(Path.dirname(srcDoc), relAsset);
  return assets[srcAsset] || {};
}
```

Tables should be processed:

| Label                        | Image                                                                      |
|------------------------------|-----------------------------------------------------------------------------|
| This is a load of dummy text | :img{src="../advanced/frontmatter/turkey-casserole.jpg" style="width: 50%"} |
