<template>
  <div class="container is-max-desktop px-5 py-5">
    <NuxtLoadingIndicator :height="10" />
    <SiteNav />
    <div class="content">
      <ContentDoc />
    </div>
  </div>
</template>

<style>
body {
  margin-bottom: 10rem;
}

a, .breadcrumb a {
  color: #2cb687;
}
</style>
