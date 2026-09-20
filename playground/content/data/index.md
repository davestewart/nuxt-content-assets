# Data files

> Data files should not be made public

This index file should render but none of the files in this folder should be copied to the `public` folder during build, so the following links should 404:

- [CSV.csv](/data/CSV.csv)
- [JSON.json](/data/JSON.json)
- [YAML.yml](/data/YAML.yml)

Files matching `contentExtensions` (`mdx? csv ya?ml json` by default) are treated as content, everything else as assets.

See:

- https://content.nuxt.com/docs/files
