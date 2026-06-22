<script setup>
const { public: { apiBase } } = useRuntimeConfig();

// Filter-State
const tab = ref("all"); // all | addons | modpacks
const sort = ref("popular"); // popular | newest | az
const version = ref(""); // z.B. 1.21.1, leer = alle
const page = ref(1);
const items = ref(20);

const tabs = [
  { id: "all", label: "Alle" },
  { id: "addons", label: "Addons" },
  { id: "modpacks", label: "Modpacks" },
];

const sorts = [
  { id: "popular", label: "Beliebt" },
  { id: "newest", label: "Neueste" },
  { id: "az", label: "A–Z" },
];

// Beim Wechsel von Tab/Sort/Version zurueck auf Seite 1.
watch([tab, sort, version], () => {
  page.value = 1;
});

const query = computed(() => {
  const q = { sort: sort.value };
  if (version.value.trim()) q.version = version.value.trim();
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
      <h1>Cactus Addons &amp; Modpacks</h1>
      <p>
        Alle Modrinth-Projekte, die von der
        <a href="https://modrinth.com/project/NV8eFz7D" target="_blank" rel="noopener">
          Cactus Mod</a
        >
        abhaengen — direkt aus der API.
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
        <input
          v-model="version"
          class="input"
          type="text"
          placeholder="MC-Version (z.B. 1.21.1)"
          inputmode="decimal"
        />
        <select v-model="sort" class="input">
          <option v-for="s in sorts" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
      </div>
    </section>

    <p v-if="!pending && !error" class="count">
      {{ total }} Projekt{{ total === 1 ? "" : "e" }}
    </p>

    <div v-if="pending" class="state">Lade …</div>
    <div v-else-if="error" class="state error">
      Fehler beim Laden der API.
      <button class="retry" @click="refresh()">Erneut versuchen</button>
    </div>
    <div v-else-if="!projects.length" class="state">Keine Projekte gefunden.</div>

    <div v-else class="grid">
      <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
    </div>

    <nav v-if="showPagination" class="pagination">
      <button :disabled="page <= 1" @click="go(-1)">← Zurueck</button>
      <span>Seite {{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="go(1)">Weiter →</button>
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
