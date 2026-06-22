<template>
  <header class="header">
    <div class="container inner">
      <NuxtLink to="/" class="brand">
        <span class="logo" aria-hidden="true">🌵</span>
        <span class="brand-text">
          <strong>Cactus</strong>
          <small>Addons &amp; Modpacks</small>
        </span>
      </NuxtLink>
      <a
        class="source"
        href="https://modrinth.com/project/NV8eFz7D"
        target="_blank"
        rel="noopener"
      >
        Cactus auf Modrinth ↗
      </a>
    </div>
  </header>
</template>

<style scoped>
.header {
  border-bottom: 1px solid var(--border);
  background: rgba(15, 20, 16, 0.7);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 28px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-text strong {
  font-size: 18px;
}

.brand-text small {
  color: var(--text-dim);
  font-size: 12px;
}

.source {
  color: var(--accent);
  font-size: 14px;
  font-weight: 600;
}

.source:hover {
  text-decoration: underline;
}
</style>
