<template>
  <div class="container is-max-desktop px-5 py-5">
    <NuxtLoadingIndicator :height="10" />
    <SiteNav />
    <div class="content">
      <ContentDoc
        :key="$route.path"
        :path="$route.path === '/' ? '/main' : $route.path"
      />
    </div>
  </div>
  <NuxtPage />
</template>

<style>
:root {
  --green: #2cb687;
}

body {
  margin-bottom: 10rem;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Dosis', sans-serif;
  font-weight: 700 !important;
}

.content h1 + blockquote {
  background: none;
  border: none;
  padding: 0;
  margin: -.75em 0 1.5rem !important;
  color: var(--green);
  font-weight: bold;
  font-size: .9em;
}

a, .breadcrumb a {
  color: var(--green);
}

img + p {
  margin-top: 1rem;
}

code {
  color: var(--green);
  font-size: 1em;
  padding: 2px 6px;
  border-radius: 4px;
}

pre {
  border-radius: 4px;
}

a:hover code {
  color: black;
}
</style>
