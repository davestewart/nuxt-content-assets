<template>
  <div class="container is-max-desktop px-5 py-5">
    <NuxtLoadingIndicator :height="10" />
    <SiteNav />
    <div class="content">
      <ContentDoc />
    </div>
  </div>
</template>

<style lang="scss">
$green: #2cb687;

body {
  margin-bottom: 10rem;
}

.content blockquote {
  background: none;
  border: none;
  padding: 0;
  margin: -.75em 0 1.5rem !important;
  color: $green;
  font-weight: bold;
  font-size: .9em;
}

a, .breadcrumb a {
  color: $green;
}
</style>
