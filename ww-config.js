export default {
  editor: {
    label: 'Entrustia File Cards',
    icon: 'file',
  },
  properties: {
    data: {
      label: { en: 'File Data' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [
        {
          id: 1,
          created_at: '2026-01-23T22:01:00.000Z',
          tenant_id: 1,
          user_id: 1,
          folder_id: 1,
          name: 'essay.pdf',
          drive_url: 'https://dropbox.com/example',
          mime_type: 'application/pdf',
          size_bytes: 995328,
          ai_tags: ['General', 'Placeholder'],
          ai_folder_name: 'Documents',
          ai_summary: 'Sample AI summary text.',
          original_filename: 'essay.pdf',
          physical_filename: 'essay_abc123.pdf',
          dropbox_path_lower: '/docs/essay.pdf',
        },
      ],
      options: {
        expandable: true,
        getItemLabel(item) {
          return item.name || item.original_filename || ('File ' + (item.id || 'Unknown'));
        },
        item: {
          type: 'Object',
          defaultValue: {
            id: 1,
            name: 'file.pdf',
            mime_type: 'application/pdf',
            size_bytes: 0,
            ai_folder_name: '',
            ai_tags: [],
            ai_summary: '',
            drive_url: '',
            created_at: '',
          },
          options: {
            item: {
              id: { label: { en: 'ID' }, type: 'Number' },
              created_at: { label: { en: 'Created At' }, type: 'Text' },
              tenant_id: { label: { en: 'Tenant ID' }, type: 'Number' },
              user_id: { label: { en: 'User ID' }, type: 'Number' },
              folder_id: { label: { en: 'Folder ID' }, type: 'Number' },
              name: { label: { en: 'Name' }, type: 'Text' },
              drive_url: { label: { en: 'Drive URL' }, type: 'Text' },
              mime_type: { label: { en: 'MIME Type' }, type: 'Text' },
              size_bytes: { label: { en: 'Size (bytes)' }, type: 'Number' },
              ai_tags: { label: { en: 'AI Tags' }, type: 'Array' },
              ai_folder_name: { label: { en: 'AI Folder Name' }, type: 'Text' },
              ai_summary: { label: { en: 'AI Summary' }, type: 'Text' },
              original_filename: { label: { en: 'Original Filename' }, type: 'Text' },
              physical_filename: { label: { en: 'Physical Filename' }, type: 'Text' },
              dropbox_path_lower: { label: { en: 'Dropbox Path' }, type: 'Text' },
            },
          },
        },
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Bind to an array of file objects from your Xano collection.',
      },
      /* wwEditor:end */
    },

    dataIdFormula: {
      label: { en: 'ID Field' },
      type: 'Formula',
      section: 'settings',
      options: (content) => ({
        template:
          Array.isArray(content.data) && content.data.length > 0
            ? content.data[0]
            : null,
      }),
      defaultValue: { type: 'f', code: "context.mapping?.['id']" },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.data) || !content.data?.length || !boundProps.data,
    },

    dataNameFormula: {
      label: { en: 'Name Field' },
      type: 'Formula',
      section: 'settings',
      options: (content) => ({
        template:
          Array.isArray(content.data) && content.data.length > 0
            ? content.data[0]
            : null,
      }),
      defaultValue: { type: 'f', code: "context.mapping?.['name']" },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.data) || !content.data?.length || !boundProps.data,
    },

    showSource: {
      label: { en: 'Show Source Badge' },
      type: 'OnOff',
      section: 'settings',
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'boolean', tooltip: 'Show or hide the source badge (Internal / Portal).' },
      /* wwEditor:end */
    },

    showAiSummary: {
      label: { en: 'Show AI Summary' },
      type: 'OnOff',
      section: 'settings',
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'boolean', tooltip: 'Show or hide the AI Summary row.' },
      /* wwEditor:end */
    },

    showDropboxPath: {
      label: { en: 'Show Dropbox Path' },
      type: 'OnOff',
      section: 'settings',
      defaultValue: false,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'boolean', tooltip: 'Show or hide the Dropbox path row.' },
      /* wwEditor:end */
    },

    primaryColor: {
      label: { en: 'Primary Colour' },
      type: 'Color',
      section: 'style',
      defaultValue: '#2d6a4f',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'string', tooltip: 'Main brand colour used for buttons and accents.' },
      /* wwEditor:end */
    },

    cardBackground: {
      label: { en: 'Card Background' },
      type: 'Color',
      section: 'style',
      defaultValue: '#ffffff',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'string', tooltip: 'Background colour of each file card.' },
      /* wwEditor:end */
    },

    cardBorderRadius: {
      label: { en: 'Card Border Radius' },
      type: 'Length',
      section: 'style',
      defaultValue: '10px',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'string', tooltip: 'Border radius for each card.' },
      /* wwEditor:end */
    },
  },

  triggerEvents: [
    {
      name: 'open-click',
      label: { en: 'On Open click' },
      event: { file: null },
      default: true,
    },
    {
      name: 'edit-click',
      label: { en: 'On Edit click' },
      event: { file: null },
    },
    {
      name: 'name-click',
      label: { en: 'On File Name click' },
      event: { file: null },
    },
  ],
};
