# Same folder

> Image in the same folder as the document

The image below is referenced as `italian-bean-stew.jpg` and lives next to this `index.md`:

![Italian Bean Stew](italian-bean-stew.jpg)

```md
![Italian Bean Stew](italian-bean-stew.jpg)
```

At build time the module copies the image to the public folder and rewrites the path to `/paths/same/italian-bean-stew.jpg`.
