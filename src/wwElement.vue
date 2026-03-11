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
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          :style="searchInputStyle"
        />
        <button
          v-if="searchQuery"
          class="filter-clear"
          type="button"
          @click="clearSearch"
          aria-label="Clear search"
        >✕</button>
      </div>
      <select class="filter-select" :value="sourceFilter" @change="handleSourceChange">
        <option value="all">All</option>
        <option value="internal">Internal</option>
        <option value="portal">Portal</option>
      </select>
      <button class="filter-reset" type="button" @click="handleReset">Reset</button>
    </div>

    <!-- Select All Row -->
    <div v-if="filteredItems.length > 0" class="select-all-row">
      <label class="checkbox-label">
        <input
          type="checkbox"
          class="card-checkbox"
          :checked="allSelected"
          :indeterminate.prop="someSelected && !allSelected"
          @change="toggleSelectAll"
        />
        <span class="select-all-text">{{ allSelected ? 'Deselect all' : 'Select all' }} ({{ filteredItems.length }})</span>
      </label>
    </div>

    <!-- Cards -->
    <div
      v-for="item in paginatedItems"
      :key="item.id"
      class="file-card"
      :class="{ 'file-card--selected': isSelected(item.id) }"
    >
      <!-- Checkbox row -->
      <div class="card-checkbox-row">
        <label class="checkbox-label">
          <input
            type="checkbox"
            class="card-checkbox"
            :checked="isSelected(item.id)"
            @change="toggleSelect(item.id, item)"
          />
        </label>
      </div>

      <!-- Source Badge -->
      <div class="card-field">
        <span class="field-label" :style="labelStyle">Source</span>
        <span class="field-value" :style="valueStyle">
          <span :class="item.source === 'Public' ? 'badge badge--public' : 'badge badge--internal'">{{ item.source }}</span>
        </span>
      </div>

      <!-- File Name -->
      <div class="card-field">
        <span class="field-label" :style="labelStyle">File Name</span>
        <span
          class="file-name"
          :style="fileNameStyle"
          role="button"
          tabindex="0"
          @click="handleNameClick(item)"
          @keydown.enter="handleNameClick(item)"
          @keydown.space.prevent="handleNameClick(item)"
        >{{ item.name }}</span>
      </div>

      <!-- AI Folder Suggestion -->
      <div class="card-field">
        <span class="field-label" :style="labelStyle">AI Folder Suggestion</span>
        <span class="field-value" :style="valueStyle">
          <template v-if="item.isVerified">
            <span class="verified-badge">✓ Verified</span>
          </template>
          <template v-else-if="item.ai_folder_name">
            <span class="suggested-badge">Suggested: {{ item.ai_folder_name }}</span>
          </template>
          <template v-else>
            <span>—</span>
          </template>
        </span>
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

      <!-- Uploader -->
      <div class="card-field">
        <span class="field-label" :style="labelStyle">Uploader</span>
        <span class="field-value" :style="valueStyle">{{ item.uploaderName || '—' }}</span>
      </div>

      <!-- AI Summary -->
      <div v-if="props.content && props.content.showAiSummary !== false" class="card-field card-field--summary">
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

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-row">
      <span class="pagination-info">{{ paginationInfo }}</span>
      <div class="pagination-controls">
        <button class="btn-page" type="button" :disabled="currentPage === 1" @click="goToPage(1)">«</button>
        <button class="btn-page" type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">‹</button>
        <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
        <button class="btn-page" type="button" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">›</button>
        <button class="btn-page" type="button" :disabled="currentPage === totalPages" @click="goToPage(totalPages)">»</button>
      </div>
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

    // ── Internal variables ────────────────────────────────────────────
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

    const { value: selectedItems, setValue: setSelectedItems } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: 'selectedItems',
        type: 'array',
        defaultValue: [],
      });

    const { value: selectedCount, setValue: setSelectedCount } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: 'selectedCount',
        type: 'number',
        defaultValue: 0,
      });

    // ── Filter state ──────────────────────────────────────────────────
    const searchQuery = ref('');
    const searchFocused = ref(false);
    const sourceFilter = ref('all');
    const currentPage = ref(1);

    // ── Selection state ───────────────────────────────────────────────
    const selectedIds = ref([]);
    const selectedRawItems = ref([]);

    // ── Component actions (callable from WeWeb workflows) ────────────────
    if (typeof wwLib?.wwVariable?.useComponentAction === 'function') {
      wwLib.wwVariable.useComponentAction({
        uid: props.uid,
        name: 'deselectAll',
        label: 'Deselect all',
        action: () => {
          selectedIds.value = [];
          selectedRawItems.value = [];
          setSelectedItems([]);
          setSelectedCount(0);
          emit('trigger-event', { name: 'cancel-selection', event: {} });
        },
      });
    }

    // ── Folders list helpers ──────────────────────────────────────────
    const foldersList = computed(() => {
      const list = props.content?.foldersList;
      return Array.isArray(list) ? list : [];
    });

    const folderNameById = (folderId) => {
      if (!folderId) return '';
      const match = foldersList.value.find((f) => String(f.id) === String(folderId));
      return match ? (match.name || '') : '';
    };

    const folderExistsByName = (name) => {
      if (!name) return false;
      return foldersList.value.some(
        (f) => (f.name || '').toLowerCase() === (name || '').toLowerCase()
      );
    };

    // ── Processed items ───────────────────────────────────────────────
    const processedItems = computed(() => {
      const items = props.content?.data || [];
      const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

      // Read all prop-derived lists at the top so Vue tracks them as reactive dependencies
      const membersList = Array.isArray(props.content?.tenantMembersList) ? props.content.tenantMembersList : [];
      const submissionsList = Array.isArray(props.content?.publicSubmissionsList) ? props.content.publicSubmissionsList : [];
      const currentFolderName = props.content?.currentFolderName || '';

      return items.map((item) => {
        const id = resolveMappingFormula(props.content?.dataIdFormula, item) || item?.id;
        const name = resolveMappingFormula(props.content?.dataNameFormula, item) || item?.name;

        let tags = [];
        if (Array.isArray(item?.ai_tags)) {
          tags = item.ai_tags;
        } else if (typeof item?.ai_tags === 'string' && item.ai_tags.trim()) {
          try { tags = JSON.parse(item.ai_tags); } catch (e) { tags = []; }
        }
        if (!Array.isArray(tags)) tags = [];

        const pathStr = (item?.dropbox_path_lower || item?.drive_url || '').toLowerCase();
        const source = pathStr.indexOf('public uploads') !== -1 ? 'Public' : 'Internal';

        const folderName = folderNameById(item?.folder_id) || currentFolderName;

        const aiSuggestion = (item?.ai_folder_name || '').trim();
        const isVerified = !aiSuggestion || aiSuggestion.toLowerCase() === (folderName || '').toLowerCase();
        const isNewFolder = !isVerified && !folderExistsByName(aiSuggestion);

        // Internal uploader: look up email from TenantMembers by user_id
        let uploaderName = '';
        if (item?.user_id) {
          const member = membersList.find((m) => String(m.user_id) === String(item.user_id));
          if (member) uploaderName = member.email || '';
        }
        // Public uploader: look up email from PublicSubmissions by file_id
        if (!uploaderName && item?.id) {
          const submission = submissionsList.find((s) => String(s.file_id) === String(item.id));
          if (submission) uploaderName = submission.email || '';
        }

        return {
          ...item,
          id: id || 'item-' + Math.random(),
          name: name || item?.original_filename || 'Untitled',
          folderName: folderName,
          ai_folder_name: aiSuggestion,
          ai_tags: tags,
          ai_summary: item?.ai_summary || '',
          created_at: item?.created_at || '',
          size_bytes: item?.size_bytes || 0,
          drive_url: item?.drive_url || '',
          dropbox_path_lower: item?.dropbox_path_lower || '',
          source: source,
          isVerified: isVerified,
          isNewFolder: isNewFolder,
          uploaderName: uploaderName,
          _original: item,
        };
      });
    });

    // ── Filtered items ────────────────────────────────────────────────
    const filteredItems = computed(() => {
      let items = processedItems.value;
      const q = (searchQuery.value || '').toLowerCase().trim();
      if (q) {
        items = items.filter((item) => (item.name || '').toLowerCase().indexOf(q) !== -1);
      }
      const s = sourceFilter.value;
      if (s === 'internal') {
        items = items.filter((item) => item.source === 'Internal');
      } else if (s === 'portal') {
        items = items.filter((item) => item.source === 'Public');
      }
      return items;
    });

    // ── Pagination ────────────────────────────────────────────────────
    const pageSize = computed(() => props.content?.pageSize || 20);

    const totalPages = computed(() =>
      Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value))
    );

    const paginatedItems = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      return filteredItems.value.slice(start, start + pageSize.value);
    });

    const paginationInfo = computed(() => {
      const total = filteredItems.value.length;
      const start = (currentPage.value - 1) * pageSize.value + 1;
      const end = Math.min(currentPage.value * pageSize.value, total);
      return start + ' to ' + end + ' of ' + total;
    });

    const goToPage = (page) => {
      currentPage.value = Math.max(1, Math.min(page, totalPages.value));
    };

    watch([searchQuery, sourceFilter], () => { currentPage.value = 1; });

    // ── Selection ─────────────────────────────────────────────────────
    const isSelected = (id) => selectedIds.value.indexOf(String(id)) !== -1;

    const allSelected = computed(() =>
      filteredItems.value.length > 0 &&
      filteredItems.value.every((item) => isSelected(item.id))
    );

    const someSelected = computed(() =>
      filteredItems.value.some((item) => isSelected(item.id))
    );

    const toggleSelect = (id, item) => {
      const sid = String(id);
      const idx = selectedIds.value.indexOf(sid);
      if (idx === -1) {
        selectedIds.value = [...selectedIds.value, sid];
        selectedRawItems.value = [...selectedRawItems.value, item._original || item];
      } else {
        selectedIds.value = selectedIds.value.filter((x) => x !== sid);
        selectedRawItems.value = selectedRawItems.value.filter((r) => String(r.id) !== sid);
      }
    };

    const toggleSelectAll = () => {
      if (allSelected.value) {
        selectedIds.value = [];
        selectedRawItems.value = [];
      } else {
        selectedIds.value = filteredItems.value.map((item) => String(item.id));
        selectedRawItems.value = filteredItems.value.map((item) => item._original || item);
      }
    };

    // ── Watch selection → expose internal variables + emit ────────────
    watch(selectedIds, () => {
      setSelectedItems(selectedRawItems.value);
      setSelectedCount(selectedIds.value.length);
      emit('trigger-event', {
        name: 'selection-change',
        event: {
          selectedItems: selectedRawItems.value,
          selectedCount: selectedIds.value.length,
        },
      });
    });

    watch(processedItems, (items) => { setItemCount(items.length || 0); }, { immediate: true });
    watch(filteredItems, (items) => { setFilteredCount(items.length || 0); }, { immediate: true });

    // ── Name click ────────────────────────────────────────────────────
    const handleNameClick = (item) => {
      const payload = item._original || item;
      setSelectedItem(payload);
      emit('trigger-event', { name: 'name-click', event: { file: payload } });
    };

    // ── Filter handlers ───────────────────────────────────────────────
    const handleSearchInput = (e) => { searchQuery.value = e.target.value; };
    const handleSourceChange = (e) => { sourceFilter.value = e.target.value; };
    const clearSearch = () => { searchQuery.value = ''; };
    const handleReset = () => { searchQuery.value = ''; sourceFilter.value = 'all'; };

    // ── Styles ────────────────────────────────────────────────────────
    const resolvedPrimaryColor = computed(() => props.content?.primaryColor || '#2d6a4f');

    const containerStyle = computed(() => ({
      display: 'flex',
      flexDirection: 'column',
      gap: '0px',
      width: '100%',
    }));

    const searchInputStyle = computed(() => ({
      borderColor: searchFocused.value ? (resolvedPrimaryColor.value) : '#e5e7eb',
      boxShadow: searchFocused.value ? ('0 0 0 3px ' + resolvedPrimaryColor.value + '22') : 'none',
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
      fontWeight: '600',
      textDecoration: 'underline',
      cursor: 'pointer',
      textAlign: 'right',
      flex: '1',
      wordBreak: 'break-all',
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

    // ── Formatters ────────────────────────────────────────────────────
    const formatDate = (val) => {
      if (!val && val !== 0) return '—';
      try {
        // Xano returns timestamps as millisecond integers; ISO strings also handled
        const n = Number(val);
        const d = (!isNaN(n) && n > 1000000000000) ? new Date(n) : new Date(val);
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

    return {
      processedItems,
      filteredItems,
      paginatedItems,
      searchQuery,
      searchFocused,
      sourceFilter,
      handleSearchInput,
      handleSourceChange,
      clearSearch,
      handleReset,
      searchInputStyle,
      currentPage,
      totalPages,
      paginationInfo,
      goToPage,
      selectedIds,
      isSelected,
      allSelected,
      someSelected,
      toggleSelect,
      toggleSelectAll,
      handleNameClick,
      containerStyle,
      cardStyle,
      fileNameStyle,
      labelStyle,
      valueStyle,
      tagStyle,
      emptyStateStyle,
      formatDate,
      formatSize,
      selectedItem,
      itemCount,
      filteredCount,
      selectedItems,
      selectedCount,
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
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Filter Bar ─────────────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
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
  z-index: 1;
}

.filter-input {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 30px 7px 30px;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #ffffff;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.filter-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-clear:hover {
  color: #374151;
}

.filter-select {
  flex-shrink: 0;
  padding: 7px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #ffffff;
  outline: none;
  font-family: inherit;
  cursor: pointer;
  max-width: 110px;
  transition: border-color 0.15s ease;
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

/* ── Select All Row ─────────────────────────────────────────────────── */
.select-all-row {
  display: flex;
  align-items: center;
  padding: 4px 2px 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.card-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #2d6a4f;
  flex-shrink: 0;
}

.select-all-text {
  font-size: 13px;
  color: #6b7280;
}

/* ── Cards ──────────────────────────────────────────────────────────── */
.file-card {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07), 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.file-card--selected {
  border-color: #2d6a4f !important;
  box-shadow: 0 0 0 2px rgba(45, 106, 79, 0.15), 0 2px 8px rgba(0, 0, 0, 0.06) !important;
}

.card-checkbox-row {
  display: flex;
  align-items: center;
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

.card-field--summary {
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
  flex: 1;
  justify-content: flex-end;
}

.field-value--summary {
  font-style: italic;
  font-weight: 400;
  text-align: right;
  line-height: 1.5;
}

.field-value--mono {
  font-family: monospace;
  font-size: 11px;
  word-break: break-all;
}

.file-name {
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  text-align: right;
  flex: 1;
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

.badge--public {
  display: inline-block;
  background: #e8f0fb;
  color: #1a56a0;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
}

.verified-badge {
  display: inline-block;
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
}

.suggested-badge {
  display: inline-block;
  background: #fef9c3;
  color: #854d0e;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
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

/* ── Empty state ────────────────────────────────────────────────────── */
.empty-state {
  width: 100%;
  padding: 32px 16px;
  text-align: center;
  box-sizing: border-box;
}

/* ── Pagination ─────────────────────────────────────────────────────── */
.pagination-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 8px 2px 4px;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-info {
  font-size: 12px;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-page {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  cursor: pointer;
  color: #374151;
  font-family: inherit;
  transition: background 0.1s ease;
}

.btn-page:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 12px;
  color: #6b7280;
  padding: 0 6px;
  white-space: nowrap;
}
</style>
