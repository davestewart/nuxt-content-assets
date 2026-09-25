---
title: Srcset
description: High resolution variants are added to srcset automatically
---

For an image `stew.jpg`, if a sibling `stew@2x.jpg` exists, the rendered image gets a `srcset` with both files:

![Stew](stew.jpg)

```md
![Stew](stew.jpg)
```

Inspect the image to see the generated `srcset` and `sizes` attributes.

Variants are matched using the `srcset.pattern` option, which defaults to `{name}@{scale}x.{ext}`.
