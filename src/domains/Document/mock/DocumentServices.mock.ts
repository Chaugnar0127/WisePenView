import type {
  DocDisplayInfoResponse,
  IDocumentService,
  OnlyOfficeEditorConfigResponse,
  PendingDocItem,
} from '@/domains/Document';
import { DOCUMENT_PROCESS } from '@/domains/Document';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createMockPdfDataUrl(): string {
  const content = [
    'BT',
    '/F1 22 Tf',
    '72 720 Td',
    '(WisePen Course Material) Tj',
    '0 -36 Td',
    '/F1 12 Tf',
    '(This PDF is provided by DocumentServicesMock.) Tj',
    '0 -22 Td',
    '(The course viewer uses the same PDF renderer as Workspace.) Tj',
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  const offsets: number[] = [];
  let pdf = '%PDF-1.4\n';

  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  const xrefEntries = offsets
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n `)
    .join('\n');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xrefEntries}\n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return `data:application/pdf;base64,${btoa(pdf)}`;
}

const MOCK_PDF_PREVIEW_URL = createMockPdfDataUrl();

const uploadDocument: IDocumentService['uploadDocument'] = async (params) => {
  await delay(100);
  const now = Date.now();
  const documentId = `mock-doc-${now}`;
  params.onUploadInitialized?.({
    documentId,
    flashUploaded: false,
  });
  params.onUploadProgress?.(35);
  await delay(100);
  params.onUploadProgress?.(75);
  await delay(100);
  params.onUploadProgress?.(100);
  return documentId;
};

const listPendingDocs = async (): Promise<PendingDocItem[]> => {
  await delay(200);
  return [];
};

const syncPendingDocStatus: IDocumentService['syncPendingDocStatus'] = async (_documentId) => {
  await delay(200);
  return { status: DOCUMENT_PROCESS.READY };
};

const retryPendingDoc = async (_documentId: string): Promise<void> => {
  await delay(200);
};

const cancelPendingDoc = async (_documentId: string): Promise<void> => {
  await delay(200);
};

const getDocInfo = async (documentId: string): Promise<DocDisplayInfoResponse> => {
  await delay(200);
  return {
    docMetaInfo: {
      uploadMeta: {
        documentName: `mock-${documentId}.pdf`,
        uploaderId: '1',
        fileType: 'pdf',
        size: 1024 * 1024 * 2,
      },
      documentStatus: {
        status: 'SUCCESS',
      },
      maxPreviewPages: 20,
    },
    resourceInfo: {
      resourceId: documentId,
      resourceName: `mock-${documentId}.pdf`,
      ownerInfo: {
        nickname: 'Mock User',
        avatar: '',
        identityType: 0,
      },
      resourceType: 'pdf',
    },
    previewUrl: MOCK_PDF_PREVIEW_URL,
  };
};

const forkDocument: IDocumentService['forkDocument'] = async () => {
  await delay(200);
  return `mock-doc-copy-${Date.now()}`;
};

const getOnlyOfficeEditorConfig = async (
  resourceId: string
): Promise<OnlyOfficeEditorConfigResponse> => {
  await delay(200);
  return {
    sessionId: `mock-office-${resourceId}`,
    config: null,
  };
};

export const DocumentServicesMock: IDocumentService = {
  uploadDocument,
  listPendingDocs,
  syncPendingDocStatus,
  retryPendingDoc,
  cancelPendingDoc,
  getDocInfo,
  forkDocument,
  getOnlyOfficeEditorConfig,
};
