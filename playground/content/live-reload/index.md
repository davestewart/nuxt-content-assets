---
title: Live reload
description: Add, edit and delete assets while the dev server runs
---

![Fish Stew](fish-stew.jpg)

With the dev server running, try the following in `playground/content/live-reload/`:

1. **Edit** `fish-stew.jpg`, for example crop or resize it; the image and its size hints update in the browser
2. **Add** a new image, then reference it from this page; it's copied and served as soon as you save
3. **Delete** an image; it's removed from the cache and stops being served

::tip
Resizing an image updates its `width`, `height` and `aspect-ratio` in place, without reloading the page.
::

::note
Nuxt Content only re-parses a page when its markdown changes, so a full refresh brings back the old size. Save this page, or restart the dev server, to update it.
::
