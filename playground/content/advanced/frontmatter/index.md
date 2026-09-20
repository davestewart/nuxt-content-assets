---
image: ./turkey-casserole.jpg?a=1&b=2
---

# Frontmatter

> Image `src` from a `frontmatter` variable

The `image` frontmatter value `./turkey-casserole.jpg?a=1&b=2` is rewritten to an absolute path (keeping the query string) and can be bound to any component:

:img{:src="image" alt="Turkey & Pesto Casserole"}

```md
---
image: ./turkey-casserole.jpg?a=1&b=2
---

:img{:src="image" alt="Turkey & Pesto Casserole"}
```

Set `imageSize: 'src'` to have the module append `width` and `height` to frontmatter image paths as a query string.
