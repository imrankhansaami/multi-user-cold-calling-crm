export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input.trim();
}

export async function createSpreadsheet(token: string, title: string = 'SprintDial CRM Call Logs'): Promise<{ id: string; sheetName: string }> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title }
    })
  });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }
  
  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const sheetName = data.sheets?.[0]?.properties?.title || 'Sheet1';
  
  // Set headers in the new spreadsheet
  const range = `'${sheetName}'!A1:J1`;
  const initializeHeadersRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[
        'Caller ID',
        'Caller Name',
        'Timestamp',
        'Lead Name',
        'Phone',
        'Outcome',
        'Notes',
        'Follow Up Date',
        'Duration (s)',
        'Recording Link'
      ]]
    })
  });

  if (!initializeHeadersRes.ok) {
    console.warn('Failed to construct column headers on newly created Google Sheet.');
  }
  
  return { id: spreadsheetId, sheetName };
}

export async function appendCallLog(token: string, spreadsheetId: string, sheetName: string, logItem: any): Promise<boolean> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = `'${sheetName}'!A:J`;
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[
          logItem.callerId || '',
          logItem.callerName || '',
          logItem.timestamp || '',
          logItem.leadName || '',
          logItem.phone || '',
          logItem.outcome || '',
          logItem.notes || '',
          logItem.followUpDate || '',
          logItem.duration || 0,
          logItem.recordingLink || ''
        ]]
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Failed to append call log:', error);
    return false;
  }
}

export async function appendMultipleCallLogs(token: string, spreadsheetId: string, sheetName: string, logs: any[]): Promise<boolean> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = `'${sheetName}'!A:J`;
  const rows = logs.map(logItem => [
    logItem.callerId || '',
    logItem.callerName || '',
    logItem.timestamp || '',
    logItem.leadName || '',
    logItem.phone || '',
    logItem.outcome || '',
    logItem.notes || '',
    logItem.followUpDate || '',
    logItem.duration || 0,
    logItem.recordingLink || ''
  ]);
  
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Failed to append multiple logs:', error);
    return false;
  }
}

export async function isSpreadsheetValid(token: string, spreadsheetId: string): Promise<{ valid: boolean; sheetName: string; error?: string }> {
  try {
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (!cleanId) {
      return { valid: false, sheetName: '', error: 'Spreadsheet ID cannot be empty.' };
    }
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      return { valid: false, sheetName: '', error: `HTTP ${res.status}: Spreadsheet not found. Double check sharing access.` };
    }
    const data = await res.json();
    const sheetName = data.sheets?.[0]?.properties?.title || 'Sheet1';
    return { valid: true, sheetName };
  } catch (e: any) {
    return { valid: false, sheetName: '', error: e.message || 'CORS or Connection network error.' };
  }
}

export async function importLeadsFromSheet(token: string, spreadsheetId: string, sheetName: string): Promise<any[]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    throw new Error('Spreadsheet ID cannot be empty.');
  }
  const range = `'${sheetName}'!A1:Z500`;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch spreadsheet rows: ${errorText}`);
  }
  
  const data = await res.json();
  if (!data.values || data.values.length === 0) {
    return [];
  }
  
  const rows = data.values as string[][];
  const headers = rows[0].map(h => (h || '').trim().toLowerCase());
  
  // Attempt to map headers flexibly
  let nameIdx = headers.findIndex(h => h.includes('name') || h.includes('prospect') || h.includes('lead') || h.includes('contact'));
  let phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('number') || h.includes('tel') || h.includes('cell'));
  let companyIdx = headers.findIndex(h => h.includes('company') || h.includes('corp') || h.includes('firm') || h.includes('org'));
  
  // Intelligent fallbacks
  if (nameIdx === -1) nameIdx = 0;
  if (phoneIdx === -1) phoneIdx = headers.length > 1 ? 1 : 0;
  if (companyIdx === -1) companyIdx = headers.length > 2 ? 2 : -1;
  
  const importedLeads: any[] = [];
  
  // Parse rows (skip header row)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const name = row[nameIdx] ? row[nameIdx].trim() : '';
    const phone = row[phoneIdx] ? row[phoneIdx].trim() : '';
    const company = companyIdx !== -1 && row[companyIdx] ? row[companyIdx].trim() : 'Google Sheets Contact';
    
    // Quick validation: must have both a name and phone as basic criteria
    if (name && phone) {
      importedLeads.push({
        id: `lead-imported-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        name,
        phone,
        company,
        status: 'New'
      });
    }
  }
  
  return importedLeads;
}
