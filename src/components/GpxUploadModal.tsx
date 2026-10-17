import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { DEFAULT_GPX_DATA } from '../data/defaultRoute';

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
  const [pasteContent, setPasteContent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
    onLoadGpx(DEFAULT_GPX_DATA, 'Paroby Rte');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
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
              Upload any GPX track from Strava, RideWithGPS, Garmin, or Komoot
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Drag & Drop Box */}
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

        {/* Or Paste */}
        <div className="my-4 flex items-center gap-2 text-xs text-slate-500">
          <div className="h-px bg-slate-800 flex-1" />
          <span>or paste raw GPX XML</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <textarea
          rows={3}
          value={pasteContent}
          onChange={(e) => setPasteContent(e.target.value)}
          placeholder="Paste <gpx ...> ... </gpx> here..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleLoadDefault}
            className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors"
          >
            Load Test Route (Paroby Rte)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
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
      </div>
    </div>
  );
};
