<template>
  <div class="file-card-list" :style="containerStyle">

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-search-wrap">
        <span class="filter-search-icon">🔍</span>
        <input
          class="filter-input"
          type="text"
          placeholder="File Name"
          :value="searchQuery"
          @input="handleSearchInput"
        />
      </div>
      <select class="filter-select" :value="sourceFilter" @change="handleSourceChange">
        <option value="all">All</option>
        <option value="internal">Internal</option>
        <option value="portal">Portal</option>
      </select>
      <button class="filter-reset" type="button" @click="handleReset">Reset</button>
    </div>

    <!-- Cards -->
    <div
      v-for="item in filteredItems"
      :key="item.id"
      class="file-card"
      :style="cardStyle"
    >
      <!-- Action Row -->
      <div class="card-actions">
        <button
          class="btn-action btn-open"
          :style="getOpenButtonStyle(item.id)"
          type="button"
          @click="handleOpen(item)"
          @mouseenter="setHover(item.id, 'open', true)"
          @mouseleave="setHover(item.id, 'open', false)"
          @mousedown="setActive(item.id, 'open', true)"
          @mouseup="setActive(item.id, 'open', false)"
        >
          Open
        </button>
        <button
          class="btn-action btn-edit"
          :style="getEditButtonStyle(item.id)"
          type="button"
          @click="handleEdit(item)"
          @mouseenter="setHover(item.id, 'edit', true)"
          @mouseleave="setHover(item.id, 'edit', false)"
          @mousedown="setActive(item.id, 'edit', true)"
          @mouseup="setActive(item.id, 'edit', false)"
        >
          Edit
        </button>
      </div>

      <!-- Source Badge -->
      <div class="card-field">
        <span class="field-label" :style="labelStyle">Source</span>
        <span class="field-value" :style="valueStyle">
          <span class="badge badge--internal">Internal</span>
        </span>
      </div>

      <!-- File Name -->
      <div class="card-field file-name-field">
        <span
          class="file-name"
          :style="fileNameStyle"
          role="button"
          tabindex="0"
          @click="handleNameClick(item)"
          @keydown.enter="handleNameClick(item)"
          @keydown.space.prevent="handleNameClick(item)"
        >
          {{ item.name }}
        </span>
      </div>

      <!-- AI Folder Suggestion -->
      <div class="card-field">
        <span class="field-label" :style="labelStyle">AI Folder Suggestion</span>
        <span class="field-value" :style="valueStyle">{{ item.ai_folder_name || '—' }}</span>
      </div>

      <!-- AI Tags -->
      <div class="card-field card-field--tags">
        <span class="field-label" :style="labelStyle">AI Tags</span>
        <div class="tags-wrap">
          <template v-if="item.ai_tags && item.ai_tags.length">
            <span
              v-for="(tag, i) in item.ai_tags"
              :key="i"
              class="tag"
              :style="tagStyle"
            >{{ tag }}</span>
          </template>
          <span v-else class="field-value" :style="valueStyle">—</span>
        </div>
      </div>

      <!-- Upload Date -->
      <div class="card-field">
        <span class="field-label" :style="labelStyle">Upload Date</span>
        <span class="field-value" :style="valueStyle">{{ formatDate(item.created_at) }}</span>
      </div>

      <!-- File Size -->
      <div class="card-field">
        <span class="field-label" :style="labelStyle">File Size</span>
        <span class="field-value" :style="valueStyle">{{ formatSize(item.size_bytes) }}</span>
      </div>

      <!-- AI Summary -->
      <div v-if="props.content && props.content.showAiSummary !== false" class="card-field">
        <span class="field-label" :style="labelStyle">AI Summary</span>
        <span class="field-value field-value--summary" :style="valueStyle">{{ item.ai_summary || '—' }}</span>
      </div>

      <!-- Dropbox Path -->
      <div v-if="props.content && props.content.showDropboxPath === true" class="card-field">
        <span class="field-label" :style="labelStyle">Dropbox Path</span>
        <span class="field-value field-value--mono" :style="valueStyle">{{ item.dropbox_path_lower || '—' }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!filteredItems.length" class="empty-state" :style="emptyStateStyle">
      No files to display.
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue';

export default {
  name: 'FileCardList',

  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },

  emits: ['trigger-event'],

  setup(props, { emit }) {
    /* wwEditor:start */
    const isEditing = computed(() => props.wwEditorState?.isEditing);
    /* wwEditor:end */

    const { value: selectedItem, setValue: setSelectedItem } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: 'selectedItem',
        type: 'object',
        defaultValue: null,
      });

    const { value: itemCount, setValue: setItemCount } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: 'itemCount',
        type: 'number',
        defaultValue: 0,
      });

    const { value: filteredCount, setValue: setFilteredCount } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: 'filteredCount',
        type: 'number',
        defaultValue: 0,
      });

    // Filter state
    const searchQuery = ref('');
    const sourceFilter = ref('all');

    const hoverState = ref({});
    const activeState = ref({});

    const setHover = (id, btn, val) => {
      hoverState.value = { ...hoverState.value, [id + '-' + btn]: val };
    };

    const setActive = (id, btn, val) => {
      activeState.value = { ...activeState.value, [id + '-' + btn]: val };
    };

    const handleSearchInput = (e) => {
      searchQuery.value = e.target.value;
    };

    const handleSourceChange = (e) => {
      sourceFilter.value = e.target.value;
    };

    const handleReset = () => {
      searchQuery.value = '';
      sourceFilter.value = 'all';
    };

    const processedItems = computed(() => {
      const items = props.content?.data || [];
      const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

      return items.map((item) => {
        const id = resolveMappingFormula(props.content?.dataIdFormula, item) ?? item?.id;
        const name = resolveMappingFormula(props.content?.dataNameFormula, item) ?? item?.name;

        let tags = [];
        if (Array.isArray(item?.ai_tags)) {
          tags = item.ai_tags;
        } else if (typeof item?.ai_tags === 'string' && item.ai_tags.trim()) {
          try { tags = JSON.parse(item.ai_tags); } catch (e) { tags = []; }
        }
        if (!Array.isArray(tags)) tags = [];

        return {
          ...item,
          id: id || 'item-' + Math.random(),
          name: name || item?.original_filename || 'Untitled',
          ai_folder_name: item?.ai_folder_name || '',
          ai_tags: tags,
          ai_summary: item?.ai_summary || '',
          created_at: item?.created_at || '',
          size_bytes: item?.size_bytes || 0,
          drive_url: item?.drive_url || '',
          dropbox_path_lower: item?.dropbox_path_lower || '',
          _original: item,
        };
      });
    });

    const filteredItems = computed(() => {
      let items = processedItems.value;
      const q = (searchQuery.value || '').toLowerCase().trim();

      if (q) {
        items = items.filter((item) => (item.name || '').toLowerCase().indexOf(q) !== -1);
      }
      // Source filter: currently all files are Internal — wired up for future use
      // when a source field is added to the schema
      return items;
    });

    watch(processedItems, (items) => { setItemCount(items.length || 0); }, { immediate: true });
    watch(filteredItems, (items) => { setFilteredCount(items.length || 0); }, { immediate: true });

    const resolvedPrimaryColor = computed(() => props.content?.primaryColor || '#2d6a4f');
    const resolvedOutlineColor = computed(() => props.content?.outlineColor || '#2d6a4f');

    const darken = (hex, amount) => {
      const h = (hex || '#2d6a4f').replace('#', '');
      const num = parseInt(h.length === 3 ? h.split('').map(function(c) { return c + c; }).join('') : h, 16);
      const r = Math.max(0, (num >> 16) - amount);
      const g = Math.max(0, ((num >> 8) & 0xff) - amount);
      const b = Math.max(0, (num & 0xff) - amount);
      return '#' + [r, g, b].map(function(v) { return v.toString(16).padStart(2, '0'); }).join('');
    };

    const getOpenButtonStyle = (id) => {
      const isActive = activeState.value[id + '-open'];
      const isHovered = hoverState.value[id + '-open'];
      const base = resolvedPrimaryColor.value;
      const bg = isActive ? darken(base, 40) : isHovered ? darken(base, 20) : base;
      return {
        backgroundColor: bg,
        color: '#ffffff',
        borderColor: bg,
        fontSize: (props.content?.fontSize || 14) + 'px',
        boxShadow: isHovered && !isActive ? '0 2px 6px rgba(0,0,0,0.18)' : 'none',
        transform: isActive ? 'scale(0.97)' : 'scale(1)',
        transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease',
      };
    };

    const getEditButtonStyle = (id) => {
      const isActive = activeState.value[id + '-edit'];
      const isHovered = hoverState.value[id + '-edit'];
      const base = resolvedOutlineColor.value;
      const darkened = isActive ? darken(base, 40) : isHovered ? darken(base, 20) : base;
      return {
        backgroundColor: isHovered ? (isActive ? darken(base, 40) : darken(base, 20)) : '#ffffff',
        color: isHovered ? '#ffffff' : base,
        borderColor: darkened,
        fontSize: (props.content?.fontSize || 14) + 'px',
        boxShadow: isHovered && !isActive ? '0 2px 6px rgba(0,0,0,0.18)' : 'none',
        transform: isActive ? 'scale(0.97)' : 'scale(1)',
        transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease',
      };
    };

    const containerStyle = computed(() => ({
      display: 'flex',
      flexDirection: 'column',
      gap: (props.content?.cardGap || 12) + 'px',
      width: '100%',
    }));

    const cardStyle = computed(() => ({
      background: props.content?.cardBackground || '#ffffff',
      border: '1px solid ' + (props.content?.cardBorderColor || '#e5e7eb'),
      borderRadius: (props.content?.cardBorderRadius || 8) + 'px',
      fontSize: (props.content?.fontSize || 14) + 'px',
    }));

    const fileNameStyle = computed(() => ({
      color: props.content?.primaryColor || '#2d6a4f',
      fontSize: (props.content?.fontSize || 14) + 'px',
    }));

    const labelStyle = computed(() => ({
      color: props.content?.labelTextColor || '#6b7280',
      fontSize: (props.content?.fontSize || 14) + 'px',
    }));

    const valueStyle = computed(() => ({
      color: props.content?.valueTextColor || '#111827',
      fontSize: (props.content?.fontSize || 14) + 'px',
    }));

    const tagStyle = computed(() => ({
      background: props.content?.primaryColor || '#2d6a4f',
      color: '#ffffff',
      borderRadius: '12px',
      padding: '2px 10px',
      fontSize: '12px',
      fontWeight: '500',
    }));

    const emptyStateStyle = computed(() => ({
      color: props.content?.labelTextColor || '#6b7280',
      fontSize: (props.content?.fontSize || 14) + 'px',
    }));

    const formatDate = (val) => {
      if (!val) return '—';
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return year + '-' + month + '-' + day + ' ' + hours + ':' + mins;
      } catch (e) {
        return String(val);
      }
    };

    const formatSize = (bytes) => {
      const n = Number(bytes);
      if (!bytes && bytes !== 0) return '—';
      if (isNaN(n)) return '—';
      if (n === 0) return '0 MB';
      if (n < 1024 * 1024) return (n / 1024).toFixed(2) + ' KB';
      return (n / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const handleOpen = (item) => {
      const payload = item?._original || item;
      setSelectedItem(payload);
      emit('trigger-event', { name: 'open-click', event: { file: payload } });
    };

    const handleEdit = (item) => {
      const payload = item?._original || item;
      setSelectedItem(payload);
      emit('trigger-event', { name: 'edit-click', event: { file: payload } });
    };

    const handleNameClick = (item) => {
      const payload = item?._original || item;
      setSelectedItem(payload);
      emit('trigger-event', { name: 'name-click', event: { file: payload } });
    };

    return {
      processedItems,
      filteredItems,
      searchQuery,
      sourceFilter,
      handleSearchInput,
      handleSourceChange,
      handleReset,
      containerStyle,
      cardStyle,
      getOpenButtonStyle,
      getEditButtonStyle,
      fileNameStyle,
      labelStyle,
      valueStyle,
      tagStyle,
      emptyStateStyle,
      formatDate,
      formatSize,
      handleOpen,
      handleEdit,
      handleNameClick,
      setHover,
      setActive,
      selectedItem,
      itemCount,
      filteredCount,
      props,
      /* wwEditor:start */
      isEditing,
      /* wwEditor:end */
    };
  },
};
</script>

<style scoped>
.file-card-list {
  width: 100%;
  box-sizing: border-box;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.filter-search-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.filter-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  pointer-events: none;
  line-height: 1;
}

.filter-input {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 10px 7px 30px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #ffffff;
  outline: none;
  font-family: inherit;
}

.filter-input:focus {
  border-color: #2d6a4f;
}

.filter-select {
  flex-shrink: 0;
  padding: 7px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #ffffff;
  outline: none;
  font-family: inherit;
  cursor: pointer;
  max-width: 110px;
}

.filter-select:focus {
  border-color: #2d6a4f;
}

.filter-reset {
  flex-shrink: 0;
  background: none;
  border: none;
  color: #2d6a4f;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 2px;
  font-family: inherit;
  white-space: nowrap;
  text-decoration: underline;
}

.filter-reset:hover {
  color: #1a4a35;
}

/* Cards */
.file-card {
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 18px;
  border-radius: 999px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.btn-open {
  border: 1.5px solid transparent;
}

.btn-edit {
  border: 1.5px solid;
}

.file-name-field {
  margin-top: 2px;
}

.file-name {
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  display: inline;
}

.card-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 22px;
}

.card-field--tags {
  align-items: flex-start;
}

.field-label {
  font-weight: 400;
  flex-shrink: 0;
}

.field-value {
  font-weight: 500;
  text-align: right;
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-value--summary {
  font-style: italic;
  font-weight: 400;
}

.field-value--mono {
  font-family: monospace;
  font-size: 11px;
  word-break: break-all;
}

.badge--internal {
  display: inline-block;
  background: #e8f4f0;
  color: #2d6a4f;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
  flex: 1;
}

.tag {
  display: inline-block;
}

.empty-state {
  width: 100%;
  padding: 32px 16px;
  text-align: center;
  box-sizing: border-box;
}
</style>
