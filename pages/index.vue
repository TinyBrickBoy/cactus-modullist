<script setup>
const { public: { apiBase } } = useRuntimeConfig();

// Filter state
const tab = ref("all"); // all | addons | modpacks
const sort = ref("popular"); // popular | newest | az
const version = ref(""); // e.g. 1.21.1, empty = all
const page = ref(1);
const items = ref(20);

const tabs = [
  { id: "all", label: "All" },
  { id: "addons", label: "Addons" },
  { id: "modpacks", label: "Modpacks" },
];

const sorts = [
  { id: "popular", label: "Popular" },
  { id: "newest", label: "Newest" },
  { id: "az", label: "A–Z" },
];

// Available Minecraft versions for the dropdown (from the API).
const { data: versionData } = await useFetch(`${apiBase}/versions`, {
  key: "cactus-versions",
});
const versions = computed(() => versionData.value?.versions ?? []);

// Reset to page 1 whenever tab/sort/version changes.
watch([tab, sort, version], () => {
  page.value = 1;
});

const query = computed(() => {
  const q = { sort: sort.value };
  if (version.value) q.version = version.value;
  if (tab.value === "all") {
    q.page = page.value;
    q.items = items.value;
  }
  return q;
});

const endpoint = computed(() => `${apiBase}/${tab.value}`);

const { data, pending, error, refresh } = await useFetch(endpoint, {
  query,
  key: "cactus-list",
});

const projects = computed(() => data.value?.results ?? []);
const total = computed(() => data.value?.total ?? data.value?.count ?? 0);
const totalPages = computed(() => data.value?.total_pages ?? 1);
const showPagination = computed(() => tab.value === "all" && totalPages.value > 1);

function go(delta) {
  const next = page.value + delta;
  if (next >= 1 && next <= totalPages.value) page.value = next;
}
</script>

<template>
  <div>
    <section class="hero">
      <h1>Cactusmod Addons and Modpacks</h1>
      <p>
        Every Modrinth project that depends on the
        <a href="https://modrinth.com/project/NV8eFz7D" target="_blank" rel="noopener">
          Cactus Mod</a
        >
        — straight from the API.
      </p>
    </section>

    <section class="controls">
      <div class="tabs">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="tab"
          :class="{ active: tab === t.id }"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <div class="filters">
        <select v-model="version" class="input" aria-label="Minecraft version">
          <option value="">All versions</option>
          <option v-for="v in versions" :key="v" :value="v">{{ v }}</option>
        </select>
        <select v-model="sort" class="input" aria-label="Sort order">
          <option v-for="s in sorts" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
      </div>
    </section>

    <p v-if="!pending && !error" class="count">
      {{ total }} project{{ total === 1 ? "" : "s" }}
    </p>

    <div v-if="pending" class="state">Loading …</div>
    <div v-else-if="error" class="state error">
      Failed to load the API.
      <button class="retry" @click="refresh()">Try again</button>
    </div>
    <div v-else-if="!projects.length" class="state">No projects found.</div>

    <div v-else class="grid">
      <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
    </div>

    <nav v-if="showPagination" class="pagination">
      <button :disabled="page <= 1" @click="go(-1)">← Previous</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="go(1)">Next →</button>
    </nav>
  </div>
</template>

<style scoped>
.hero {
  margin-bottom: 28px;
}

.hero h1 {
  margin: 0 0 8px;
  font-size: clamp(28px, 5vw, 40px);
}

.hero p {
  margin: 0;
  color: var(--text-dim);
  max-width: 60ch;
}

.hero a {
  color: var(--accent);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.tabs {
  display: inline-flex;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px;
  gap: 4px;
}

.tab {
  border: 0;
  background: transparent;
  color: var(--text-dim);
  padding: 7px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.12s, color 0.12s;
}

.tab.active {
  background: var(--accent);
  color: #08240a;
}

.filters {
  display: flex;
  gap: 10px;
}

.input {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 10px;
  padding: 9px 12px;
  outline: none;
  cursor: pointer;
}

.input:focus {
  border-color: var(--accent-soft);
}

.count {
  color: var(--text-dim);
  font-size: 14px;
  margin: 0 0 14px;
}

.state {
  padding: 48px 0;
  text-align: center;
  color: var(--text-dim);
}

.state.error {
  color: #ff8a8a;
}

.retry,
.pagination button {
  margin-left: 10px;
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.retry:hover,
.pagination button:not(:disabled):hover {
  border-color: var(--accent-soft);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  color: var(--text-dim);
}

.pagination button {
  margin: 0;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
