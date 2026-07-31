// Helper for Syncing with Google Sheets via Google Apps Script Webhook

export const getGoogleSheetsUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lomba_google_sheets_url');
    if (saved && saved.trim() !== '') return saved.trim();
  }
  return process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL || 'https://script.google.com/macros/s/AKfycby9085h9R04WAHmNNwNq8qcugdQDvPN2tKqVOLaNXfisJM5_Vv1GMiEgeAHKoCGVpNiWw/exec';
};

export const setGoogleSheetsUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lomba_google_sheets_url', url.trim());
  }
};

export const syncToGoogleSheets = async (scores: Record<string, any>, judgeNotes: Record<string, any>, customUrl?: string) => {
  const url = customUrl || getGoogleSheetsUrl();
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

export const testGoogleSheetsSync = async (targetUrl: string, sampleScores: Record<string, any>, sampleNotes: Record<string, any>): Promise<boolean> => {
  try {
    await fetch(targetUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        test: true,
        scores: sampleScores,
        judgeNotes: sampleNotes,
      }),
    });
    return true;
  } catch (err) {
    console.error('Test Google Sheets failed', err);
    return false;
  }
};
