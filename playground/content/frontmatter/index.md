---
title: Frontmatter
description: Asset paths in frontmatter are rewritten too, so you can pass them to components
image: turkey-casserole.jpg
recipes:
  - title: Italian Bean Stew
    image: ../paths/italian-bean-stew.jpg
  - title: Pesto Salmon & Lentils
    image: ../paths/images/pesto-salmon-lentils.jpg
  - title: Sicilian Fish Stew
    image: ../shared/sicilian-fish-stew.jpg
  - title: Turkey & Pesto Casserole
    image: turkey-casserole.jpg
---

## Frontmatter variable

A top-level frontmatter property, bound to an image:

:img{:src="image" alt="Turkey & Pesto Casserole"}

```md
---
image: turkey-casserole.jpg
---

:img{:src="image" alt="Turkey & Pesto Casserole"}
```

## Component props

A path passed directly to a component prop:

:content-image{image="turkey-casserole.jpg" title="Turkey & Pesto Casserole"}

```md
:content-image{image="turkey-casserole.jpg" title="Turkey & Pesto Casserole"}
```

## Nested frontmatter

A list of items in frontmatter, passed to a gallery component:

:content-gallery{:items="recipes"}

```md
---
recipes:
  - title: Italian Bean Stew
    image: ../paths/italian-bean-stew.jpg
  - title: Pesto Salmon & Lentils
    image: ../paths/images/pesto-salmon-lentils.jpg
  ...
---

:content-gallery{:items="recipes"}
```

See `app/components/content/` for the components.
