// Helper for Syncing with Google Sheets via Google Apps Script Webhook

export const getGoogleSheetsUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lomba_google_sheets_url');
    if (saved) return saved;
  }
  return process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL || 'https://script.google.com/macros/s/AKfycbxoTyxZ3HU6a-HEwd01BJI3-1ptdwohfWFso07pRYN7pI1Bj8tAEvbO-c0ShWTZcQEZCQ/exec';
};

export const syncToGoogleSheets = async (scores: Record<string, any>, judgeNotes: Record<string, any>) => {
  const url = getGoogleSheetsUrl();
  if (!url) return false;

  try {
    // Send as simple text/plain payload to bypass CORS preflight checks in Google Apps Script
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        scores,
        judgeNotes,
      }),
    });
    return true;
  } catch (err) {
    console.error('Failed to sync to Google Sheets', err);
    return false;
  }
};

export const fetchFromGoogleSheets = async () => {
  const url = getGoogleSheetsUrl();
  if (!url) return null;

  try {
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    // Ignore fetch errors
  }
  return null;
};
