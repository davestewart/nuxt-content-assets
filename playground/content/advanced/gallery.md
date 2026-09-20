---
items:
  -
    title: Same folder
    image: ../paths/same/italian-bean-stew.jpg?a=1
  -
    title: Sub folder
    image: ../paths/sub/images/pesto-salmon-lentils.jpg
  -
    title: Assets folder
    image: ../assets/images/sicilian-fish-stew.jpg
  -
    title: Sibling folder
    image: frontmatter/turkey-casserole.jpg
---

# Gallery

> Custom gallery component using `frontmatter` data

Relative image paths in frontmatter arrays and objects are rewritten too, so they can be passed straight to components:

:content-gallery{:items="items"}

```md
:content-gallery{:items="items"}
```
