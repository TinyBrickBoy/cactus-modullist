<script setup>
const props = defineProps({
  project: { type: Object, required: true },
});

const downloads = computed(() => formatNumber(props.project.downloads));

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n ?? 0);
}
</script>

<template>
  <a class="card" :href="project.link" target="_blank" rel="noopener">
    <div class="top">
      <h3 class="title">{{ project.title }}</h3>
      <span class="badge" :class="project.type">{{ project.type }}</span>
    </div>

    <p class="summary">{{ project.summary || "Keine Beschreibung." }}</p>

    <ul v-if="project.tags.length" class="tags">
      <li v-for="tag in project.tags.slice(0, 5)" :key="tag">{{ tag }}</li>
    </ul>

    <div class="meta">
      <span title="Downloads">⬇ {{ downloads }}</span>
      <span v-if="project.author" title="Autor">👤 {{ project.author }}</span>
    </div>
  </a>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
  transition: transform 0.12s ease, background 0.12s ease, border-color 0.12s ease;
}

.card:hover {
  transform: translateY(-3px);
  background: var(--card-hover);
  border-color: var(--accent-soft);
}

.top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.title {
  margin: 0;
  font-size: 17px;
}

.badge {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 9px;
  border-radius: 999px;
}

.badge.addon {
  background: rgba(87, 200, 77, 0.15);
  color: var(--accent);
}

.badge.modpack {
  background: rgba(216, 162, 58, 0.15);
  color: var(--modpack);
}

.summary {
  margin: 0;
  color: var(--text-dim);
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tags li {
  font-size: 11px;
  color: var(--text-dim);
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 7px;
}

.meta {
  display: flex;
  gap: 16px;
  margin-top: auto;
  padding-top: 4px;
  font-size: 13px;
  color: var(--text-dim);
}
</style>
