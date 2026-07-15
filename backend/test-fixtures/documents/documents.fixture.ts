export const documentUploadFixtures = {
  validPdf: {
    filename: 'pitch-deck.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024,
    company_id: '11111111-1111-1111-1111-111111111111',
  },
  oversized: {
    filename: 'large.pdf',
    mime_type: 'application/pdf',
    size_bytes: 51 * 1024 * 1024,
  },
};
