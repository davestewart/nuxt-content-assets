---
title: Paths
description: Relative paths resolve from the document, absolute paths are left alone
---

## Same folder

![Italian Bean Stew](italian-bean-stew.jpg)

```md
![Italian Bean Stew](italian-bean-stew.jpg)
```

## Sub folder

![Pesto Salmon & Lentils](images/pesto-salmon-lentils.jpg)

```md
![Pesto Salmon & Lentils](images/pesto-salmon-lentils.jpg)
```

## Parent folder

![Sicilian Fish Stew](../shared/sicilian-fish-stew.jpg)

```md
![Sicilian Fish Stew](../shared/sicilian-fish-stew.jpg)
```

## Absolute path

Absolute paths aren't rewritten, so they must point to where the asset is served:

![Italian Bean Stew](/paths/italian-bean-stew.jpg)

```md
![Italian Bean Stew](/paths/italian-bean-stew.jpg)
```

::note
In `dev` the module serves assets from its cache. In `build` and `generate` they're copied to the output folder and served from there.
::
