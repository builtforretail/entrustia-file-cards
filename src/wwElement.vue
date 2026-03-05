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

    <!-- Action Banner — shown when 1+ items selected -->
    <div v-if="selectedIds.length > 0" class="action-banner">

      <!-- AI suggestion banner (conditional) -->
      <div v-if="bannerType === 'accept-all'" class="ai-suggestion-row">
        <span class="ai-icon">💡</span>
        <span class="ai-text">
          <strong>Accept all folder suggestions</strong> for the selected files
        </span>
        <button class="btn-banner btn-banner--primary" type="button" @click="handleAcceptAll">
          Accept all suggestions
        </button>
      </div>

      <div v-else-if="bannerType === 'accept-and-move'" class="ai-suggestion-row">
        <span class="ai-icon">✨</span>
        <span class="ai-text">
          AI Suggestion: Move to <strong>{{ singleSuggestionFolderName }}</strong> folder
        </span>
        <button class="btn-banner btn-banner--primary" type="button" @click="handleAcceptAndMove">
          Accept &amp; Move
        </button>
      </div>

      <div v-else-if="bannerType === 'create-and-move'" class="ai-suggestion-row">
        <span class="ai-icon">✨</span>
        <span class="ai-text">
          AI suggestion: Create new folder called <strong>{{ singleSuggestionFolderName }}</strong>
        </span>
        <button class="btn-banner btn-banner--primary" type="button" @click="handleCreateAndMove">
          Create &amp; Move
        </button>
      </div>

      <!-- Manual action bar — always shown when selection active -->
      <div class="manual-action-row">
        <span class="select-folder-label">Select Folder:</span>
        <select class="folder-select" :value="moveFolderTarget" @change="handleMoveFolderChange">
          <option value="">Move to...</option>
          <option
            v-for="folder in moveableFolders"
            :key="folder.id"
            :value="folder.id"
          >{{ folder.name }}</option>
        </select>
        <button
          class="btn-banner btn-banner--primary"
          type="button"
          :disabled="!moveFolderTarget"
          @click="handleMoveFiles"
        >
          Move file(s)
        </button>
        <button class="btn-banner btn-banner--outline" type="button" @click="handleCancel">
          Cancel
        </button>
        <button class="btn-banner btn-banner--danger" type="button" @click="handleDeleteFiles">
          Delete files
        </button>
      </div>
    </div>

    <!-- Cards -->
    <div
      v-for="item in paginatedItems"
      :key="item.id"
      class="file-card"
      :class="{ 'file-card--selected': isSelected(item.id) }"
      :style="cardStyle"
    >
      <!-- Card Top Row: checkbox + actions -->
      <div class="card-top-row">
        <label class="checkbox-label">
          <input
            type="checkbox"
            class="card-checkbox"
            :checked="isSelected(item.id)"
            @change="toggleSelect(item.id, item)"
          />
        </label>
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
        >
          {{ item.name }}
        </span>
      </div>

      <!-- Actual Folder Name -->
      <div class="card-field">
        <span class="field-label" :style="labelStyle">Folder Name</span>
        <span class="field-value" :style="valueStyle">{{ item.folderName || '—' }}</span>
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
    const sourceFilter = ref('all');
    const currentPage = ref(1);

    // ── Selection state ───────────────────────────────────────────────
    const selectedIds = ref([]);
    const selectedRawItems = ref([]);

    // ── Hover / active button state ───────────────────────────────────
    const hoverState = ref({});
    const activeState = ref({});

    const setHover = (id, btn, val) => {
      hoverState.value = { ...hoverState.value, [id + '-' + btn]: val };
    };

    const setActive = (id, btn, val) => {
      activeState.value = { ...activeState.value, [id + '-' + btn]: val };
    };

    // ── Move folder target ────────────────────────────────────────────
    const moveFolderTarget = ref('');

    const handleMoveFolderChange = (e) => {
      moveFolderTarget.value = e.target.value;
    };

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

    // Folders available to move to — excludes current folder of the first selected item
    const moveableFolders = computed(() => {
      const list = foldersList.value;
      if (!selectedIds.value.length) return list;
      // Exclude the folder(s) that selected files are already in
      const currentFolderIds = selectedRawItems.value.map((r) => String(r.folder_id || ''));
      return list.filter((f) => !currentFolderIds.includes(String(f.id)));
    });

    // ── Processed items ───────────────────────────────────────────────
    const processedItems = computed(() => {
      const items = props.content?.data || [];
      const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

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

        // Resolve actual folder name from foldersList
        const folderName = folderNameById(item?.folder_id);

        // Verified: ai_folder_name is empty/null OR matches the current folder name
        const aiSuggestion = (item?.ai_folder_name || '').trim();
        const isVerified = !aiSuggestion || aiSuggestion.toLowerCase() === (folderName || '').toLowerCase();

        // New folder: has a suggestion AND it doesn't exist in foldersList
        const isNewFolder = !isVerified && !folderExistsByName(aiSuggestion);

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

    const totalPages = computed(() => {
      return Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value));
    });

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

    // Reset page when filters change
    watch([searchQuery, sourceFilter], () => { currentPage.value = 1; });

    // ── Selection helpers ─────────────────────────────────────────────
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
        selectedRawItems.value = selectedRawItems.value.filter(
          (r) => String(r.id) !== sid
        );
      }
      moveFolderTarget.value = '';
    };

    const toggleSelectAll = () => {
      if (allSelected.value) {
        selectedIds.value = [];
        selectedRawItems.value = [];
      } else {
        selectedIds.value = filteredItems.value.map((item) => String(item.id));
        selectedRawItems.value = filteredItems.value.map((item) => item._original || item);
      }
      moveFolderTarget.value = '';
    };

    // ── Banner logic ──────────────────────────────────────────────────
    // Get selected processed items (not just raw)
    const selectedProcessedItems = computed(() =>
      filteredItems.value.filter((item) => isSelected(item.id))
    );

    const bannerType = computed(() => {
      const sel = selectedProcessedItems.value;
      if (!sel.length) return null;

      const withSuggestions = sel.filter((item) => !item.isVerified && item.ai_folder_name);

      if (sel.length === 1) {
        const single = sel[0];
        if (!single.isVerified && single.ai_folder_name) {
          return single.isNewFolder ? 'create-and-move' : 'accept-and-move';
        }
        return null; // verified single — manual bar only
      }

      // Multiple selected
      if (withSuggestions.length > 0) {
        return 'accept-all';
      }
      return null; // all verified — manual bar only
    });

    const singleSuggestionFolderName = computed(() => {
      const sel = selectedProcessedItems.value;
      if (sel.length === 1) return sel[0].ai_folder_name || '';
      return '';
    });

    // ── Watch selection → expose internal variables ───────────────────
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

    // ── Action handlers ───────────────────────────────────────────────
    const handleAcceptAll = () => {
      const sel = selectedProcessedItems.value;
      const withSuggestions = sel.filter((item) => !item.isVerified && item.ai_folder_name);
      emit('trigger-event', {
        name: 'accept-suggestions',
        event: { selectedItems: withSuggestions.map((i) => i._original || i) },
      });
    };

    const handleAcceptAndMove = () => {
      const sel = selectedProcessedItems.value;
      if (!sel.length) return;
      emit('trigger-event', {
        name: 'accept-and-move',
        event: { file: sel[0]._original || sel[0], folderName: sel[0].ai_folder_name },
      });
    };

    const handleCreateAndMove = () => {
      const sel = selectedProcessedItems.value;
      if (!sel.length) return;
      emit('trigger-event', {
        name: 'create-and-move',
        event: { file: sel[0]._original || sel[0], newFolderName: sel[0].ai_folder_name },
      });
    };

    const handleMoveFiles = () => {
      if (!moveFolderTarget.value) return;
      const targetFolder = foldersList.value.find(
        (f) => String(f.id) === String(moveFolderTarget.value)
      );
      emit('trigger-event', {
        name: 'move-files',
        event: {
          selectedItems: selectedRawItems.value,
          targetFolderId: moveFolderTarget.value,
          targetFolder: targetFolder || null,
        },
      });
    };

    const handleDeleteFiles = () => {
      emit('trigger-event', {
        name: 'delete-files',
        event: { selectedItems: selectedRawItems.value },
      });
    };

    const handleCancel = () => {
      selectedIds.value = [];
      selectedRawItems.value = [];
      moveFolderTarget.value = '';
      emit('trigger-event', { name: 'cancel-selection', event: {} });
    };

    // ── Open / Edit / Name handlers ───────────────────────────────────
    const handleOpen = (item) => {
      const payload = item._original || item;
      setSelectedItem(payload);
      emit('trigger-event', { name: 'open-click', event: { file: payload } });
    };

    const handleEdit = (item) => {
      const payload = item._original || item;
      setSelectedItem(payload);
      emit('trigger-event', { name: 'edit-click', event: { file: payload } });
    };

    const handleNameClick = (item) => {
      const payload = item._original || item;
      setSelectedItem(payload);
      emit('trigger-event', { name: 'name-click', event: { file: payload } });
    };

    // ── Filter handlers ───────────────────────────────────────────────
    const handleSearchInput = (e) => { searchQuery.value = e.target.value; };
    const handleSourceChange = (e) => { sourceFilter.value = e.target.value; };
    const handleReset = () => { searchQuery.value = ''; sourceFilter.value = 'all'; };

    // ── Styles ────────────────────────────────────────────────────────
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

    return {
      // data
      processedItems,
      filteredItems,
      paginatedItems,
      // filter
      searchQuery,
      sourceFilter,
      handleSearchInput,
      handleSourceChange,
      handleReset,
      // pagination
      currentPage,
      totalPages,
      paginationInfo,
      goToPage,
      // selection
      selectedIds,
      isSelected,
      allSelected,
      someSelected,
      toggleSelect,
      toggleSelectAll,
      // banner
      bannerType,
      singleSuggestionFolderName,
      // action bar
      moveFolderTarget,
      moveableFolders,
      handleMoveFolderChange,
      // action handlers
      handleAcceptAll,
      handleAcceptAndMove,
      handleCreateAndMove,
      handleMoveFiles,
      handleDeleteFiles,
      handleCancel,
      // open/edit/name
      handleOpen,
      handleEdit,
      handleNameClick,
      // hover/active
      setHover,
      setActive,
      // styles
      containerStyle,
      cardStyle,
      getOpenButtonStyle,
      getEditButtonStyle,
      fileNameStyle,
      labelStyle,
      valueStyle,
      tagStyle,
      emptyStateStyle,
      // formatters
      formatDate,
      formatSize,
      // internal vars (returned so WeWeb can access)
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
}

/* ── Filter Bar ─────────────────────────────────────────────────────── */
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

/* ── Select All Row ─────────────────────────────────────────────────── */
.select-all-row {
  display: flex;
  align-items: center;
  padding: 4px 2px;
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

/* ── Action Banner ──────────────────────────────────────────────────── */
.action-banner {
  background: #f0faf5;
  border: 1px solid #c3e6d5;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-suggestion-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.ai-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.ai-text {
  flex: 1;
  min-width: 0;
  color: #1a1a1a;
  line-height: 1.4;
}

.manual-action-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.select-folder-label {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}

.folder-select {
  flex: 1;
  min-width: 100px;
  max-width: 180px;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #ffffff;
  outline: none;
  font-family: inherit;
  cursor: pointer;
}

.folder-select:focus {
  border-color: #2d6a4f;
}

.btn-banner {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  border: 1.5px solid transparent;
  transition: opacity 0.15s ease;
}

.btn-banner:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-banner--primary {
  background: #2d6a4f;
  color: #ffffff;
  border-color: #2d6a4f;
}

.btn-banner--primary:hover:not(:disabled) {
  background: #245a41;
  border-color: #245a41;
}

.btn-banner--outline {
  background: #ffffff;
  color: #374151;
  border-color: #d1d5db;
}

.btn-banner--outline:hover {
  background: #f9fafb;
}

.btn-banner--danger {
  background: #ffffff;
  color: #b91c1c;
  border-color: #fca5a5;
}

.btn-banner--danger:hover {
  background: #fef2f2;
}

/* ── Cards ──────────────────────────────────────────────────────────── */
.file-card {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow 0.15s ease;
}

.file-card--selected {
  border-color: #2d6a4f !important;
  box-shadow: 0 0 0 2px rgba(45, 106, 79, 0.15);
}

.card-top-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.card-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 1;
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
  flex: 1;
  justify-content: flex-end;
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
