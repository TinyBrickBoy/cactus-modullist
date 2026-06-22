<template>
  <div class="app">
    <SiteHeader />
    <main class="container">
      <NuxtPage />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  padding: 32px 0 64px;
}
</style>
