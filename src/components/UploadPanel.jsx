import React, { useState, useRef } from 'react';
import { extractText } from '../utils/fileParser';
import { analyzeWithClaude } from '../utils/claudeApi';

const SLOTS = [
  { key: 'statusReport', label: 'Weekly Status Report', type: 'PPTX', accept: '.pptx', hint: 'Weekly program status deck' },
  { key: 'steerco',      label: 'SteerCo Deck',          type: 'PPTX', accept: '.pptx', hint: 'Steering committee presentation' },
  { key: 'milestones',   label: 'Milestone Tracker',      type: 'XLSX', accept: '.xlsx', hint: 'Milestone & schedule workbook' },
  { key: 'pdm',          label: 'PDM Artifact Tracker',   type: 'XLSX', accept: '.xlsx', hint: 'Gate artifact status workbook' },
];

export default function UploadPanel({ onDataReady, onClose, getPrevSummary, onDemo }) {
  const [files, setFiles] = useState({});
  const [dragging, setDragging] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const inputRefs = useRef({});

  const setFile = (key, file) => {
    if (!file) return;
    setFiles(prev => ({ ...prev, [key]: file }));
    setError(null);
  };

  const removeFile = (key, e) => {
    e.stopPropagation();
    setFiles(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleDrop = (e, key) => {
    e.preventDefault();
    setDragging(null);
    const file = e.dataTransfer.files[0];
    if (file) setFile(key, file);
  };

  const handleAnalyze = async () => {
    const loaded = SLOTS.filter(s => files[s.key]);
    if (!loaded.length) {
      setError('Upload at least one document before analyzing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const texts = {};
      for (const slot of loaded) {
        setProgress(`Extracting ${slot.label}…`);
        texts[slot.label] = await extractText(files[slot.key]);
      }

      setProgress('Analyzing with Claude AI — this may take 30–60 seconds…');
      const prevSummary = getPrevSummary ? getPrevSummary() : null;
      const result = await analyzeWithClaude(texts, prevSummary);

      onDataReady(result);
    } catch (err) {
      setError(err.message || 'Analysis failed. Check your API key and try again.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const fileCount = SLOTS.filter(s => files[s.key]).length;

  return (
    <div className="upload-panel">
      <div className="upload-panel-inner">
        <div className="upload-header">
          <div>
            <h3 className="upload-title">Update This Week</h3>
            <p className="upload-desc">
              Upload one or more program documents. Claude AI will extract and analyze the content to populate every section of the dashboard.
            </p>
          </div>
        </div>

        <div className="upload-slots">
          {SLOTS.map(slot => {
            const file = files[slot.key];
            const isDragging = dragging === slot.key;
            return (
              <div
                key={slot.key}
                className={`upload-slot${isDragging ? ' upload-slot--drag' : ''}${file ? ' upload-slot--filled' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Upload ${slot.label}`}
                onDrop={e => !loading && handleDrop(e, slot.key)}
                onDragOver={e => { e.preventDefault(); !loading && setDragging(slot.key); }}
                onDragLeave={() => setDragging(null)}
                onClick={() => !loading && inputRefs.current[slot.key]?.click()}
                onKeyDown={e => e.key === 'Enter' && !loading && inputRefs.current[slot.key]?.click()}
              >
                <input
                  ref={el => (inputRefs.current[slot.key] = el)}
                  type="file"
                  accept={slot.accept}
                  onChange={e => setFile(slot.key, e.target.files[0])}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                />
                <div className="slot-top">
                  <span className="slot-type-badge">{slot.type}</span>
                  {file && (
                    <button
                      className="slot-remove"
                      onClick={e => removeFile(slot.key, e)}
                      aria-label="Remove file"
                    >✕</button>
                  )}
                </div>
                <div className="slot-label">{slot.label}</div>
                {file ? (
                  <div className="slot-filename">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6l3 3 5-5" stroke="#2d7a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {file.name}
                  </div>
                ) : (
                  <div className="slot-hint">{slot.hint}<br /><span>Drag &amp; drop or click to browse</span></div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="upload-error" role="alert">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="#b5261e" strokeWidth="1.5"/>
              <path d="M7 4v3.5M7 9.5v.5" stroke="#b5261e" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {loading && (
          <div className="upload-progress">
            <span className="progress-spinner" aria-hidden="true" />
            <span>{progress}</span>
          </div>
        )}

        <div className="upload-actions">
          {onDemo && (
            <button className="btn-demo" onClick={onDemo} disabled={loading} title="Populate dashboard with sample UOX program data — no API key required">
              Load Demo Data
            </button>
          )}
          <button className="btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={loading || fileCount === 0}
          >
            {loading
              ? 'Analyzing…'
              : fileCount > 0
              ? `Analyze ${fileCount} File${fileCount !== 1 ? 's' : ''}`
              : 'Select Files to Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
}
