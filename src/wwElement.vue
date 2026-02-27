<template>
  <div class="file-cards-wrapper" :style="wrapperStyle">
    <div
      v-for="file in processedFiles"
      :key="file.id"
      class="file-card"
      :style="cardStyle"
    >
      <!-- Action Buttons -->
      <div class="card-actions">
        <button
          class="btn-open"
          :style="openBtnStyle"
          @click="handleOpen(file)"
        >
          Open
        </button>
        <button
          class="btn-edit"
          :style="editBtnStyle"
          @click="handleEdit(file)"
        >
          Edit
        </button>
      </div>

      <!-- Source Badge -->
      <div v-if="props.content?.showSource !== false" class="card-row card-row--badge">
        <span class="badge badge--internal">Internal</span>
      </div>

      <!-- File Name -->
      <div class="card-row">
        <span class="card-label">File Name</span>
        <span
          class="card-value card-value--link"
          :style="linkStyle"
          @click="handleNameClick(file)"
        >{{ file.name || file.original_filename || '—' }}</span>
      </div>

      <!-- AI Folder Suggestion -->
      <div class="card-row">
        <span class="card-label">AI Folder Suggestion</span>
        <span class="card-value">{{ file.ai_folder_name || '—' }}</span>
      </div>

      <!-- AI Tags -->
      <div class="card-row card-row--tags">
        <span class="card-label">AI Tags</span>
        <div class="tags-wrap">
          <template v-if="Array.isArray(file.ai_tags) && file.ai_tags.length">
            <span
              v-for="(tag, i) in file.ai_tags"
              :key="i"
              class="tag"
              :style="tagStyle"
            >{{ tag }}</span>
          </template>
          <span v-else class="card-value">—</span>
        </div>
      </div>

      <!-- Upload Date -->
      <div class="card-row">
        <span class="card-label">Upload Date</span>
        <span class="card-value">{{ formatDate(file.created_at) }}</span>
      </div>

      <!-- File Size -->
      <div class="card-row">
        <span class="card-label">File Size</span>
        <span class="card-value">{{ formatSize(file.size_bytes) }}</span>
      </div>

      <!-- AI Summary -->
      <div v-if="props.content?.showAiSummary !== false" class="card-row">
        <span class="card-label">AI Summary</span>
        <span class="card-value card-value--summary">{{ file.ai_summary || '—' }}</span>
      </div>

      <!-- Dropbox Path (optional) -->
      <div v-if="props.content?.showDropboxPath === true" class="card-row">
        <span class="card-label">Dropbox Path</span>
        <span class="card-value card-value--mono">{{ file.dropbox_path_lower || '—' }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!processedFiles.length" class="empty-state">
      No files found.
      <span style="display:block;font-size:10px;color:#bbb;margin-top:4px;">
        Received: {{ Array.isArray(props.content?.data) ? props.content.data.length + ' items' : typeof props.content?.data }}
      </span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'EntrustiaFileCards',
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

    const processedFiles = computed(() => {
      try {
        const raw = props.content?.data;
        let items = [];
        if (Array.isArray(raw)) {
          items = raw;
        } else if (raw && typeof raw === 'object') {
          // Some WeWeb bindings wrap the array in a data property
          if (Array.isArray(raw.data)) items = raw.data;
          else return [];
        } else {
          return [];
        }

        return items.map((item) => {
          try {
            let tags = [];
            if (Array.isArray(item?.ai_tags)) {
              tags = item.ai_tags;
            } else if (typeof item?.ai_tags === 'string' && item.ai_tags.trim()) {
              try { tags = JSON.parse(item.ai_tags); } catch (e) { tags = []; }
            }
            if (!Array.isArray(tags)) tags = [];

            return {
              id: item?.id != null ? item.id : Math.random(),
              created_at: item?.created_at || '',
              name: item?.name || item?.original_filename || '',
              original_filename: item?.original_filename || '',
              drive_url: item?.drive_url || '',
              mime_type: item?.mime_type || '',
              size_bytes: item?.size_bytes != null ? item.size_bytes : 0,
              ai_tags: tags,
              ai_folder_name: item?.ai_folder_name || '',
              ai_summary: item?.ai_summary || '',
              dropbox_path_lower: item?.dropbox_path_lower || '',
              _raw: item,
            };
          } catch (e) {
            return {
              id: Math.random(),
              created_at: '',
              name: 'Error reading file',
              original_filename: '',
              drive_url: '',
              mime_type: '',
              size_bytes: 0,
              ai_tags: [],
              ai_folder_name: '',
              ai_summary: '',
              dropbox_path_lower: '',
              _raw: item,
            };
          }
        });
      } catch (e) {
        return [];
      }
    });

    const primaryColor = computed(() => props.content?.primaryColor || '#2d6a4f');
    const cardBg = computed(() => props.content?.cardBackground || '#ffffff');
    const radius = computed(() => props.content?.cardBorderRadius || '10px');

    const wrapperStyle = computed(() => ({
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      boxSizing: 'border-box',
    }));

    const cardStyle = computed(() => ({
      background: cardBg.value,
      borderRadius: radius.value,
      border: '1px solid #e5e7eb',
      padding: '14px 14px 10px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }));

    const openBtnStyle = computed(() => ({
      background: primaryColor.value,
      color: '#ffffff',
      border: 'none',
      borderRadius: '20px',
      padding: '6px 18px',
      fontWeight: '600',
      fontSize: '13px',
      cursor: 'pointer',
    }));

    const editBtnStyle = computed(() => ({
      background: 'transparent',
      color: primaryColor.value,
      border: '1.5px solid ' + primaryColor.value,
      borderRadius: '20px',
      padding: '6px 18px',
      fontWeight: '600',
      fontSize: '13px',
      cursor: 'pointer',
    }));

    const linkStyle = computed(() => ({
      color: primaryColor.value,
      fontWeight: '500',
      cursor: 'pointer',
      textDecoration: 'underline',
      wordBreak: 'break-all',
    }));

    const tagStyle = computed(() => ({
      background: primaryColor.value,
      color: '#ffffff',
      borderRadius: '12px',
      padding: '2px 10px',
      fontSize: '12px',
      fontWeight: '500',
    }));

    function formatDate(val) {
      if (!val) return '—';
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return year + '-' + month + '-' + day + ' ' + hours + ':' + mins;
      } catch (e) {
        return val;
      }
    }

    function formatSize(bytes) {
      if (bytes === null || bytes === undefined || bytes === '') return '—';
      const n = Number(bytes);
      if (isNaN(n)) return '—';
      if (n === 0) return '0 MB';
      if (n < 1024 * 1024) return (n / 1024).toFixed(2) + ' KB';
      return (n / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function handleOpen(file) {
      emit('trigger-event', { name: 'open-click', event: { file: file._raw } });
    }

    function handleEdit(file) {
      emit('trigger-event', { name: 'edit-click', event: { file: file._raw } });
    }

    function handleNameClick(file) {
      emit('trigger-event', { name: 'name-click', event: { file: file._raw } });
    }

    return {
      processedFiles,
      wrapperStyle,
      cardStyle,
      openBtnStyle,
      editBtnStyle,
      linkStyle,
      tagStyle,
      formatDate,
      formatSize,
      handleOpen,
      handleEdit,
      handleNameClick,
      /* wwEditor:start */
      isEditing,
      /* wwEditor:end */
    };
  },
};
</script>

<style scoped>
.file-cards-wrapper {
  width: 100%;
  box-sizing: border-box;
}

.file-card {
  box-sizing: border-box;
  width: 100%;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.btn-open,
.btn-edit {
  font-family: inherit;
  line-height: 1;
  transition: opacity 0.15s;
}

.btn-open:hover,
.btn-edit:hover {
  opacity: 0.85;
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 6px;
}

.card-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.card-row--badge {
  border-bottom: none;
  padding-bottom: 2px;
}

.card-row--tags {
  align-items: flex-start;
}

.card-label {
  font-size: 11px;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  padding-top: 2px;
  min-width: 110px;
}

.card-value {
  font-size: 13px;
  color: #1a1a1a;
  text-align: right;
  flex: 1;
}

.card-value--link {
  text-align: right;
}

.card-value--summary {
  font-size: 12px;
  color: #555;
  text-align: right;
  font-style: italic;
}

.card-value--mono {
  font-size: 11px;
  font-family: monospace;
  color: #555;
  text-align: right;
  word-break: break-all;
}

.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  border-radius: 12px;
  padding: 2px 10px;
  letter-spacing: 0.02em;
}

.badge--internal {
  background: #e8f4f0;
  color: #2d6a4f;
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
  text-align: center;
  color: #aaa;
  font-size: 14px;
  padding: 24px 0;
}
</style>
