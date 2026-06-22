<template>
  <footer class="footer">
    <div class="container">
      <span>Daten von der Modrinth-API · Cactus Mod</span>
      <span>tbb@onthepixel.net</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--border);
  color: var(--text-dim);
  font-size: 13px;
}

.footer .container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 20px 0;
}
</style>
