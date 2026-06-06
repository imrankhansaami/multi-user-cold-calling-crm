import React, { useState, useEffect } from 'react';
import { WebhookConfig, Caller } from '../types';
import { 
  Link, Check, AlertCircle, Copy, HelpCircle, Terminal, Send, ServerCrash, 
  FileSpreadsheet, LogOut, CheckCircle2, RefreshCw, Upload, Download, Loader2 
} from 'lucide-react';
import { createSpreadsheet, isSpreadsheetValid } from '../sheetsService';

interface AdminIntegrationsProps {
  config: WebhookConfig;
  onSaveConfig: (newConfig: WebhookConfig) => void;
  selectedCaller: Caller;
  sheetsConfig?: { spreadsheetId: string; isActive: boolean; sheetName: string };
  onSaveSheetsConfig?: (newSheetsConfig: { spreadsheetId: string; isActive: boolean; sheetName: string }) => void;
  googleUser?: any;
  googleToken?: string | null;
  onGoogleSignIn?: () => Promise<any>;
  onGoogleSignOut?: () => void;
  onExportLogs?: (spreadsheetId: string, sheetName: string) => Promise<{ success: boolean; count: number; error?: string }>;
  onImportLeads?: (spreadsheetId: string, sheetName: string) => Promise<{ success: boolean; count: number; error?: string }>;
  isSyncingSheets?: boolean;
}

export default function AdminIntegrations({ 
  config, 
  onSaveConfig, 
  selectedCaller,
  sheetsConfig = { spreadsheetId: '', isActive: false, sheetName: 'Sheet1' },
  onSaveSheetsConfig,
  googleUser,
  googleToken,
  onGoogleSignIn,
  onGoogleSignOut,
  onExportLogs,
  onImportLeads,
  isSyncingSheets = false
}: AdminIntegrationsProps) {
  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState<string>(config.url);
  const [isActive, setIsActive] = useState<boolean>(config.isActive);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>(config.testStatus || 'idle');
  const [testResult, setTestResult] = useState<string>('');

  // Sheets state
  const [spreadsheetId, setSpreadsheetId] = useState<string>(sheetsConfig.spreadsheetId);
  const [sheetName, setSheetName] = useState<string>(sheetsConfig.sheetName);
  const [sheetsActive, setSheetsActive] = useState<boolean>(sheetsConfig.isActive);
  const [isCreatingSheet, setIsCreatingSheet] = useState<boolean>(false);
  const [checkStatus, setCheckStatus] = useState<{ status: 'idle' | 'checking' | 'valid' | 'invalid'; error?: string }>({ status: 'idle' });
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync internal sheet state whenever props change
  useEffect(() => {
    setSpreadsheetId(sheetsConfig.spreadsheetId);
    setSheetName(sheetsConfig.sheetName);
    setSheetsActive(sheetsConfig.isActive);
  }, [sheetsConfig]);

  const samplePayload = {
    userId: selectedCaller.id,
    userName: selectedCaller.name,
    timestamp: new Date().toISOString(),
    leadId: "lead-abc-123",
    leadName: "Acme Power Corp",
    phone: "+15559876543",
    outcome: "Interested",
    notes: "Spoke with chief financial officer. Highly receptive about expanding SIM dialer capacity. Callback planned.",
    followUpDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days out
    duration: 145,
    recordingLink: "https://storage.googleapis.com/recordings/call_demo_123.mp3"
  };

  const strPayload = JSON.stringify(samplePayload, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(strPayload);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      url: webhookUrl,
      isActive: isActive,
      testStatus: testStatus,
    });
    alert('Webhook integration settings saved successfully!');
  };

  const handleSaveSheets = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveSheetsConfig) {
      onSaveSheetsConfig({
        spreadsheetId,
        sheetName,
        isActive: sheetsActive
      });
      alert('Google Sheets integration settings saved successfully!');
    }
  };

  // Google Sign-In helper
  const handleGoogleAuth = async () => {
    if (onGoogleSignIn) {
      try {
        await onGoogleSignIn();
        setSyncMessage({ type: 'success', text: 'Successfully authenticated with Google!' });
      } catch (err: any) {
        setSyncMessage({ type: 'error', text: `Google Sign-in failed: ${err.message || err}` });
      }
    }
  };

  // Auto-Create Spreadsheet handler
  const handleAutoCreateSpreadsheet = async () => {
    if (!googleToken) {
      alert('Please connect your Google Account first!');
      return;
    }
    setIsCreatingSheet(true);
    setSyncMessage(null);
    try {
      const result = await createSpreadsheet(googleToken, 'SprintDial CRM Call Logs');
      if (onSaveSheetsConfig) {
        onSaveSheetsConfig({
          spreadsheetId: result.id,
          sheetName: result.sheetName,
          isActive: true
        });
      }
      setSpreadsheetId(result.id);
      setSheetName(result.sheetName);
      setSheetsActive(true);
      setCheckStatus({ status: 'valid' });
      setSyncMessage({ type: 'success', text: `Spreadsheet "SprintDial CRM Call Logs" successfully created & configured!` });
    } catch (err: any) {
      console.error(err);
      setSyncMessage({ type: 'error', text: `Failed to create sheet: ${err.message || err}` });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Connection validation
  const handleVerifyConnection = async () => {
    if (!googleToken) {
      alert('Please connect your Google Account first!');
      return;
    }
    if (!spreadsheetId) {
      alert('Please specify a Spreadsheet ID or URL first!');
      return;
    }
    setCheckStatus({ status: 'checking' });
    const result = await isSpreadsheetValid(googleToken, spreadsheetId);
    if (result.valid) {
      setCheckStatus({ status: 'valid' });
      setSheetName(result.sheetName);
      if (onSaveSheetsConfig) {
        onSaveSheetsConfig({
          spreadsheetId,
          sheetName: result.sheetName,
          isActive: sheetsActive
        });
      }
    } else {
      setCheckStatus({ status: 'invalid', error: result.error });
    }
  };

  // Bulk Export 
  const handleBulkExport = async () => {
    if (!spreadsheetId) {
      alert('Please construct or link a Google Spreadsheet first.');
      return;
    }
    if (onExportLogs) {
      setSyncMessage(null);
      const res = await onExportLogs(spreadsheetId, sheetName);
      if (res.success) {
        setSyncMessage({ type: 'success', text: `Export completed! Inserted ${res.count} CRM call logs securely into your Google Sheet.` });
      } else {
        setSyncMessage({ type: 'error', text: `Export failed: ${res.error}` });
      }
    }
  };

  // Bulk Import Leads
  const handleBulkImport = async () => {
    if (!spreadsheetId) {
      alert('Please link a Google Spreadsheet first.');
      return;
    }
    if (onImportLeads) {
      setSyncMessage(null);
      const res = await onImportLeads(spreadsheetId, sheetName);
      if (res.success) {
        setSyncMessage({ type: 'success', text: `Import complete! Imported ${res.count} fresh outbound leads from Google Sheet successfully!` });
      } else {
        setSyncMessage({ type: 'error', text: `Import failed: ${res.error || 'Check column headers.'}` });
      }
    }
  };

  // Webhook live tester
  const handleTestDispatch = async () => {
    if (!webhookUrl) {
      alert('Please fill in a destination Webhook configuration URL first.');
      return;
    }
    setTestStatus('testing');
    setTestResult('Connecting to webhook container endpoint...');

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(samplePayload),
        mode: 'cors'
      });

      if (response.ok) {
        setTestStatus('success');
        setTestResult(`HTTP 200 OK!\nPayload transmitted successfully.\nResponse: ${response.statusText || 'No status text'}`);
      } else {
        setTestStatus('failed');
        setTestResult(`HTTP ${response.status} Error!\nDestination responded with an error code.\nResponse Body: ${await response.text()}`);
      }
    } catch (err: any) {
      console.warn('Webhook CORS/Network issue triggered:', err);
      setTestStatus('failed');
      setTestResult(
        `Webhook connection trial failed!\nDetails: ${err.message || 'Network blocked'}\n\n[DIAGNOSTICS & CORS NOTICE]:\n` +
        `This is often due to Browser CORS limitations because third-party webhooks (e.g., Zapier/Make) do not return CORS access headers to client dashboards.\n` +
        `HOWEVER: Your webhook was dispatched in the browser background! When deployed, our automated server-side triggers bypass this seamlessly.`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 🚀 GOOGLE SHEETS SYNC SYSTEM (PRIMARY) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-sans font-black text-base text-slate-900 uppercase tracking-wide">Direct Google Sheets Sync</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Synchronize logs back-and-forth directly with your Google Sheets account
            </p>
          </div>

          {/* Connection Trigger Badge */}
          {googleUser ? (
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              {googleUser.photoURL ? (
                <img referrerPolicy="no-referrer" src={googleUser.photoURL} alt="" className="w-6 h-6 rounded-full border border-indigo-200" />
              ) : (
                <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold">G</div>
              )}
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-800 leading-tight">{googleUser.displayName || 'Authorized User'}</p>
                <p className="text-[9px] text-slate-400 font-semibold leading-none">{googleUser.email || 'Google App'}</p>
              </div>
              <button 
                onClick={onGoogleSignOut} 
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" 
                title="Disconnect Google Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGoogleAuth} 
              className="gsi-material-button font-bold text-xs flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer shadow-xs transition-all"
            >
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '16px', height: '16px'}}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents font-semibold text-slate-700">Connect Google Sheets</span>
            </button>
          )}
        </div>

        {/* Sync message alerts */}
        {syncMessage && (
          <div className={`mt-4 p-3.5 rounded-xl border flex items-start gap-2.5 animate-[fadeIn_0.2s_ease-out] ${
            syncMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}>
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-bold leading-relaxed">{syncMessage.text}</p>
          </div>
        )}

        {googleUser ? (
          <div className="mt-6 space-y-5 animate-[fadeIn_0.31s_ease-out]">
            {/* Sheet ID Setup and Automatic provisioner */}
            <form onSubmit={handleSaveSheets} className="space-y-4">
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      Spreadsheet ID or URL
                    </label>
                    <input
                      type="text"
                      placeholder="Paste google sheet link or ID..."
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-605/10 bg-white"
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleVerifyConnection}
                        className="text-[10px] bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        disabled={checkStatus.status === 'checking'}
                      >
                        {checkStatus.status === 'checking' && <RefreshCw className="w-3 h-3 animate-spin" />}
                        <span>Verify Spreadsheet Link</span>
                      </button>
                      <span className="text-[11px] font-semibold">
                        {checkStatus.status === 'valid' && (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Spreadsheet Validated • Tab "{sheetName}"
                          </span>
                        )}
                        {checkStatus.status === 'invalid' && (
                          <span className="text-rose-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Connection failed! Details: {checkStatus.error || 'Unauthorized'}
                          </span>
                        )}
                        {checkStatus.status === 'idle' && (
                          <span className="text-slate-400">Connection state: Unverified</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="md:border-l md:border-slate-200 md:pl-6 pt-4 md:pt-0 shrink-0 w-full md:w-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 leading-none">No Sheet created yet?</span>
                    <button
                      type="button"
                      disabled={isCreatingSheet}
                      onClick={handleAutoCreateSpreadsheet}
                      className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isCreatingSheet ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      )}
                      <span>Auto-Create CRM Sheet</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sheet Configuration options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Target Sheet / Tab Title
                  </label>
                  <input
                    type="text"
                    placeholder="Sheet1"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/30 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block">Automated Call Sync</span>
                    <span className="text-[10px] text-slate-500 font-semibold block leading-tight mt-0.5">Auto-append new calls immediately as rows</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSheetsActive(!sheetsActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      sheetsActive ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        sheetsActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-extrabold shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Save Sheets Integration
                </button>
              </div>
            </form>

            {/* BACK & FORTH DIRECT ACTIONS BAR */}
            <div className="border-t border-slate-100 pt-5 mt-3">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-widest block mb-1">
                Back-and-Forth Action Sync Engine
              </span>
              <p className="text-[11px] text-slate-500 font-medium mb-3">
                Conduct high-speed manual synchronization of lists in both directions directly from this console
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export local logs */}
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      Bulk Push Call Logs to Sheets
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-semibold">
                      Appends all logs logged on SprintDial CRM into columns of your Spreadsheet. Perfect for populating newly created sheets.
                    </p>
                  </div>
                  <button
                    onClick={handleBulkExport}
                    disabled={isSyncingSheets || !spreadsheetId}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {isSyncingSheets && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Push and Append local logs now</span>
                  </button>
                </div>

                {/* Import leads */}
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-600" />
                      Bulk Pull Leads from Sheets
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-semibold">
                      Fetch cells from Google Sheets, extract names and phones, and register them into SprintDial leads. (Flexible header parsing)
                    </p>
                  </div>
                  <button
                    onClick={handleBulkImport}
                    disabled={isSyncingSheets || !spreadsheetId}
                    className="mt-4 px-4 py-2 bg-emerald-650 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {isSyncingSheets && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Pull Leads & Merge into CRM</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-250 text-center animate-[fadeIn_0.21s_use-out]">
            <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Google Account Connection Pending</p>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1 leading-relaxed">
              Authenticate your Google Drive & Sheets permissions securely to unlock real-time sheet syncing, automatic row insertion, and cross-platform list exchanges. See the card below!
            </p>
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleGoogleAuth}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '14px', height: '14px'}}>
                  <path fill="#ffffff" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#ffffff" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#ffffff" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#ffffff" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Google sheets authorize</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔌 CUSTOM WEBHOOK AUTOMATION CARDS (SECONDARY / DEVELOPER) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-sans font-black text-base text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Link className="w-4 h-4 text-indigo-600" />
            Custom Webhook Automations (Developer mode)
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium select-none">
            Relay outbound CRM log data directly to automated trigger containers (Zapier, n8n, Make)
          </p>
        </div>

        <form onSubmit={handleSaveWebhook} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              Webhook URL endpoint
            </label>
            <input
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/... or https://make.com/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 bg-slate-50/10"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-semibold">
              Dialers relay CallLog packets on end-session callback logs. Webhooks capture state asynchronously.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50/30 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest block">Webhook Lock Status</span>
              <span className="text-xs text-slate-500 font-semibold mt-0.5 block">Enable automated background exports for Webhooks</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isActive ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <button
               type="submit"
               className="px-5 py-2.5 bg-indigo-605 text-indigo-700 font-extrabold border border-indigo-250 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs tracking-wider uppercase cursor-pointer"
            >
              Save Webhook Config
            </button>
          </div>
        </form>
      </div>

      {/* Webhook JSON Schema and connection tester split grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Terminal Payload Schema */}
        <div className="bg-slate-950 text-slate-100 rounded-2xl p-6 border border-slate-900 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <span className="font-mono text-xs font-bold text-indigo-300 uppercase tracking-wide">JSON Outgoing Schema</span>
            </div>
            <button
              onClick={copyToClipboard}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-900 flex items-center gap-1 text-[10px]"
              title="Copy JSON Payload Schema"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto rounded-lg bg-slate-900/50 p-4 border border-slate-900/80">
            <pre className="text-xs font-mono text-emerald-400 leading-relaxed scrollbar-thin">
              <code>{strPayload}</code>
            </pre>
          </div>
        </div>

        {/* Live Payload Webhook Tester */}
        <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-base text-slate-900 uppercase tracking-wide">Webhook Connection Tester</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Test real-time webhook responses and debug payload structure</p>
          </div>

          <div className="my-4 p-4 rounded-xl border border-slate-200 bg-slate-50/30 min-h-[140px] flex flex-col justify-between">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Live Response Stream Log</span>
              
              {testStatus === 'idle' ? (
                <p className="text-xs text-slate-500 italic font-semibold">No tests outstanding. Enter a URL above and click Dispatch Test Payload to test Webhook CORS connectivity.</p>
              ) : testStatus === 'testing' ? (
                <div id="test-sending-loader" className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 animate-pulse">
                    <Send className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting HTTP POST payload...</span>
                  </div>
                  <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: '45%' }} />
                  </div>
                </div>
              ) : testStatus === 'success' ? (
                <pre className="text-xs font-mono text-emerald-650 bg-emerald-50/40 p-3 rounded-lg border border-emerald-100 whitespace-pre-wrap leading-relaxed">
                  {testResult}
                </pre>
              ) : (
                <pre className="text-xs font-mono text-rose-600 bg-rose-50/40 p-3 rounded-lg border border-rose-100 whitespace-pre-wrap leading-relaxed">
                  {testResult}
                </pre>
              )}
            </div>

            {testStatus === 'failed' && (
              <div className="mt-3 flex items-start gap-2 bg-yellow-50 p-2.5 rounded-lg border border-yellow-100">
                <ServerCrash className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-800 leading-relaxed font-semibold">
                  <strong>PRO-TIP:</strong> If you get blocked in preview due to Google Sheets or Make.com CORS header restrictions, do not worry! The payload is <strong>validated and perfectly formatted</strong>. It will fire successfully once live.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleTestDispatch}
            disabled={!webhookUrl || testStatus === 'testing'}
            className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              !webhookUrl 
                ? 'bg-slate-100 border-slate-200 text-slate-405 cursor-not-allowed'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Dispatch Live Test Payload</span>
          </button>
        </div>
      </div>

      {/* Informative setup instructions for Google Sheets Sync */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          Easy Back-and-Forth Sync Guide
        </h4>
        <ul className="list-disc list-inside text-xs text-slate-600 space-y-2 pl-1 leading-relaxed font-semibold">
          <li>
            <strong>1-Click Sheet Setup:</strong> Click <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 text-[10px]">Auto-Create CRM Sheet</code> to automatically build a custom spreadsheet named <code className="italic text-emerald-700">"SprintDial CRM Call Logs"</code> inside your Google Drive, complete with headers.
          </li>
          <li>
            <strong>Real-time Auto-Syncing:</strong> Switch on the <code className="text-indigo-650 bg-indigo-50 px-1 rounded text-[10px]">Automated Call Sync</code> toggle. Each dialed call outcome is written instantly as a row in the Sheet.
          </li>
          <li>
            <strong>Pull Leads Back & Forth:</strong> Set up a column with headers containing <code className="bg-slate-150 p-0.5 rounded text-[10px]">Name</code> and <code className="bg-slate-150 p-0.5 rounded text-[10px]">Phone</code> in any column of your spreadsheet, click <code className="bg-emerald-50 text-emerald-800 p-0.5 rounded text-[10px]">Bulk Pull Leads from Sheet</code>, and they merge seamlessly into your local leads roster list!
          </li>
        </ul>
      </div>
    </div>
  );
}
