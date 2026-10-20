import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Link, Loader2 } from 'lucide-react';
import { DEFAULT_GPX_DATA, DEFAULT_GPX_NAME } from '../data/defaultRoute';
import { fetchRwgpsRoute, extractRwgpsRouteId } from '../utils/rwgps';

interface GpxUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadGpx: (gpxContent: string, routeName?: string) => void;
}

export const GpxUploadModal: React.FC<GpxUploadModalProps> = ({
  isOpen,
  onClose,
  onLoadGpx,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'paste'>('url');
  const [rwgpsUrl, setRwgpsUrl] = useState('');
  const [isLoadingRwgps, setIsLoadingRwgps] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchRwgps = async () => {
    if (!rwgpsUrl.trim()) return;
    setErrorMsg(null);
    setIsLoadingRwgps(true);
    try {
      const { gpxXml, routeName } = await fetchRwgpsRoute(rwgpsUrl);
      onLoadGpx(gpxXml, routeName);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to import route from RideWithGPS.');
    } finally {
      setIsLoadingRwgps(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.includes('<gpx')) {
          setErrorMsg('The selected file does not appear to be a valid GPX file.');
          return;
        }
        onLoadGpx(text, file.name.replace(/\.[^/.]+$/, ''));
        onClose();
      } catch (err) {
        setErrorMsg('Failed to read the GPX file content.');
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    setErrorMsg(null);
    if (!pasteContent.trim() || !pasteContent.includes('<gpx')) {
      setErrorMsg('Please paste valid GPX XML content (must contain <gpx ...>).');
      return;
    }
    onLoadGpx(pasteContent.trim(), 'Imported GPX Route');
    onClose();
  };

  const handleLoadDefault = () => {
    onLoadGpx(DEFAULT_GPX_DATA, DEFAULT_GPX_NAME);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Load GPX Route</h3>
            <p className="text-xs text-slate-400">
              Import directly from RideWithGPS or upload a GPX file
            </p>
          </div>
        </div>

        {/* Import Mode Tabs */}
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800/80 mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setActiveTab('url'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'url'
                ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>RideWithGPS Link</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('file'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'file'
                ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('paste'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'paste'
                ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste XML</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: RideWithGPS URL Import */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                RideWithGPS Route Link or ID
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={rwgpsUrl}
                  onChange={(e) => setRwgpsUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFetchRwgps();
                    }
                  }}
                  placeholder="https://ridewithgps.com/routes/57299436"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleFetchRwgps}
                  disabled={!rwgpsUrl.trim() || isLoadingRwgps}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  {isLoadingRwgps ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Import</span>
                  )}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 Works with any public RideWithGPS route URL (e.g. <span className="font-mono text-slate-300">/routes/57299436</span> or export links).
            </p>
          </div>
        )}

        {/* Tab 2: File Upload */}
        {activeTab === 'file' && (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 cursor-pointer bg-slate-950/40 hover:bg-slate-950/70 transition-all text-center">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm font-semibold text-white">Select a GPX file</span>
            <span className="text-xs text-slate-500 mt-1">.gpx or .xml format</span>
            <input
              type="file"
              accept=".gpx,.xml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}

        {/* Tab 3: Raw Paste */}
        {activeTab === 'paste' && (
          <div className="space-y-2">
            <textarea
              rows={4}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste <gpx ...> ... </gpx> here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pasteContent.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors shadow-sm"
              >
                Load Pasted Route
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleLoadDefault}
            className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors"
          >
            Reset to Test Route ({DEFAULT_GPX_NAME})
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
