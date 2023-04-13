# Code

> Path replacement skips invalid elements

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

