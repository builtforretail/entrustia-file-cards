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
          dropbox_path_lower: '/docs/internal uploads/essay.pdf',
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
            folder_id: 1,
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

    foldersList: {
      label: { en: 'Folders List' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [
        { id: 1, name: 'Documents' },
        { id: 2, name: 'Marketing Assets' },
      ],
      options: {
        expandable: false,
        item: {
          type: 'Object',
          defaultValue: { id: 1, name: 'Folder' },
          options: {
            item: {
              id: { label: { en: 'ID' }, type: 'Number' },
              name: { label: { en: 'Name' }, type: 'Text' },
            },
          },
        },
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Bind to FoldersList.data — used to resolve actual folder names and detect new AI-suggested folders.',
      },
      /* wwEditor:end */
    },

    currentFolderName: {
      label: { en: 'Current Folder Name' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: '',
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Bind to the name of the folder whose files are being displayed. Used to determine Verified vs Suggested status.',
      },
      /* wwEditor:end */
    },

    tenantMembersList: {
      label: { en: 'Tenant Members List' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: false,
        item: {
          type: 'Object',
          defaultValue: { user_id: 1, email: 'user@example.com' },
          options: {
            item: {
              user_id: { label: { en: 'User ID' }, type: 'Number' },
              email: { label: { en: 'Email' }, type: 'Text' },
            },
          },
        },
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Bind to TenantMembers.data — used to resolve internal uploader email from user_id.',
      },
      /* wwEditor:end */
    },

    publicSubmissionsList: {
      label: { en: 'Public Submissions List' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: false,
        item: {
          type: 'Object',
          defaultValue: { file_id: 1, email: 'submitter@example.com' },
          options: {
            item: {
              file_id: { label: { en: 'File ID' }, type: 'Number' },
              email: { label: { en: 'Email' }, type: 'Text' },
            },
          },
        },
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Bind to PublicSubmissionsList.data — used to resolve public portal uploader email from file_id.',
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

    pageSize: {
      label: { en: 'Cards per Page' },
      type: 'Number',
      section: 'settings',
      defaultValue: 20,
      min: 5,
      max: 100,
      step: 5,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'number', tooltip: 'Number of file cards to show per page (default 20).' },
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

    cardBorderColor: {
      label: { en: 'Card Border Colour' },
      type: 'Color',
      section: 'style',
      defaultValue: '#e5e7eb',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'string', tooltip: 'Border colour of each card.' },
      /* wwEditor:end */
    },

    cardBorderRadius: {
      label: { en: 'Card Border Radius' },
      type: 'Number',
      section: 'style',
      defaultValue: 8,
      min: 0,
      max: 32,
      step: 1,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'number', tooltip: 'Border radius in pixels.' },
      /* wwEditor:end */
    },

    cardGap: {
      label: { en: 'Card Gap (px)' },
      type: 'Number',
      section: 'style',
      defaultValue: 12,
      min: 0,
      max: 64,
      step: 1,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'number', tooltip: 'Vertical gap between cards in pixels.' },
      /* wwEditor:end */
    },

    fontSize: {
      label: { en: 'Font Size (px)' },
      type: 'Number',
      section: 'style',
      defaultValue: 14,
      min: 10,
      max: 24,
      step: 1,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'number', tooltip: 'Base font size in pixels.' },
      /* wwEditor:end */
    },

    labelTextColor: {
      label: { en: 'Label Text Colour' },
      type: 'Color',
      section: 'style',
      defaultValue: '#6b7280',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'string', tooltip: 'Colour for field labels.' },
      /* wwEditor:end */
    },

    valueTextColor: {
      label: { en: 'Value Text Colour' },
      type: 'Color',
      section: 'style',
      defaultValue: '#111827',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: 'string', tooltip: 'Colour for field values.' },
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
    {
      name: 'selection-change',
      label: { en: 'On selection change' },
      event: { selectedItems: [], selectedCount: 0 },
    },
    {
      name: 'accept-suggestions',
      label: { en: 'On Accept all suggestions' },
      event: { selectedItems: [] },
    },
    {
      name: 'accept-and-move',
      label: { en: 'On Accept & Move (single existing folder)' },
      event: { file: null, folderName: '' },
    },
    {
      name: 'create-and-move',
      label: { en: 'On Create & Move (new folder)' },
      event: { file: null, newFolderName: '' },
    },
    {
      name: 'move-files',
      label: { en: 'On Move file(s)' },
      event: { selectedItems: [], targetFolderId: null, targetFolder: null },
    },
    {
      name: 'delete-files',
      label: { en: 'On Delete files' },
      event: { selectedItems: [] },
    },
    {
      name: 'cancel-selection',
      label: { en: 'On Cancel selection' },
      event: {},
    },
  ],
};
