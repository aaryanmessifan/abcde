import { useEffect, useState, useRef } from 'react';
import { Plus, FileText, Image as ImageIcon, File, Trash2, Sparkles, Upload, X, Bell, Copy, Wallet } from 'lucide-react';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState, PageHeader } from '@/components/ui/Feedback';
import {
  fetchAllDocuments, createDocument, deleteDocument,
  detectDocumentType, formatFileSize, generateDemoAnalysis, updateDocumentAnalysis, skipAnalysis,
} from '@/lib/services/documentService';
import type { DocumentItem, DocumentInsert, DocumentType } from '@/types';
import { formatDateShort } from '@/lib/date';

const CATEGORIES = ['general', 'bills', 'insurance', 'medical', 'legal', 'property', 'personal', 'financial'];

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [analyzing, setAnalyzing] = useState<DocumentItem | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ summary: string; fields: Record<string, string> } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadData = async () => {
    try { const data = await fetchAllDocuments(); setDocuments(data); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteDocument(deleteTarget.id); setDeleteTarget(null); loadData(); }
    catch (err) { console.error(err); }
  };

  const handleAnalyze = async (doc: DocumentItem) => {
    setAnalyzing(doc);
    setAnalysisResult(null);
    setAnalysisLoading(true);
    // Demo analysis — simulates AI processing
    setTimeout(async () => {
      const result = generateDemoAnalysis(doc.name);
      setAnalysisResult(result);
      setAnalysisLoading(false);
      try { await updateDocumentAnalysis(doc.id, result); loadData(); }
      catch (err) { console.error(err); }
    }, 1500);
  };

  const handleSkipAnalysis = async (doc: DocumentItem) => {
    try { await skipAnalysis(doc.id); loadData(); }
    catch (err) { console.error(err); }
  };

  const filtered = documents.filter(doc => {
    if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false;
    if (search.trim()) { const q = search.toLowerCase(); if (!doc.name.toLowerCase().includes(q)) return false; }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      <PageHeader title="Smart Documents" subtitle="Upload and analyze your important documents." />

      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-2 flex-1">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="input-field flex-1" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field flex-shrink-0 cursor-pointer">
            <option value="all">All</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary text-sm flex items-center gap-2 flex-shrink-0">
          <Plus size={16} /> <span className="hidden sm:inline">Upload</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No documents yet" description="Upload PDFs, images, or text files to build your document library. AI analysis will extract key information automatically." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onDelete={() => setDeleteTarget(doc)} onAnalyze={() => handleAnalyze(doc)} onSkip={() => handleSkipAnalysis(doc)} />
          ))}
        </div>
      )}

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onSubmit={async (data) => { await createDocument(data); setShowUpload(false); loadData(); }} />

      <AnalysisModal
        open={!!analyzing}
        doc={analyzing}
        loading={analysisLoading}
        result={analysisResult}
        onClose={() => { setAnalyzing(null); setAnalysisResult(null); }}
      />

      <ConfirmDialog open={!!deleteTarget} title="Delete document?" message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function DocumentCard({ doc, onDelete, onAnalyze, onSkip }: { doc: DocumentItem; onDelete: () => void; onAnalyze: () => void; onSkip: () => void }) {
  const Icon = doc.type === 'pdf' ? File : doc.type === 'image' ? ImageIcon : FileText;
  const statusBadge = doc.analysis_status === 'analyzed'
    ? <span className="text-[10px] text-frost-400 bg-frost-500/10 px-2 py-0.5 rounded-md">Analyzed</span>
    : doc.analysis_status === 'skipped'
    ? <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">Skipped</span>
    : <span className="text-[10px] text-ember-400/70 bg-ember-500/10 px-2 py-0.5 rounded-md">Pending</span>;

  return (
    <div className="group card card-hover p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-100 truncate">{doc.name}</p>
            {statusBadge}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
            <span className="capitalize">{doc.type}</span>
            <span>·</span>
            <span>{formatFileSize(doc.file_size)}</span>
            <span>·</span>
            <span>{formatDateShort(doc.upload_date)}</span>
          </div>
          {doc.ai_summary && (
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{doc.ai_summary}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            {doc.analysis_status === 'pending' && (
              <>
                <button onClick={onAnalyze} className="text-xs text-ember-400 hover:text-ember-300 flex items-center gap-1 transition-colors">
                  <Sparkles size={12} /> Analyze
                </button>
                <button onClick={onSkip} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Skip</button>
              </>
            )}
            {doc.analysis_status === 'analyzed' && (
              <button onClick={onAnalyze} className="text-xs text-frost-400 hover:text-frost-300 flex items-center gap-1 transition-colors">
                <Sparkles size={12} /> View Analysis
              </button>
            )}
            {doc.analysis_status === 'skipped' && (
              <button onClick={onAnalyze} className="text-xs text-slate-500 hover:text-ember-400 flex items-center gap-1 transition-colors">
                <Sparkles size={12} /> Analyze Now
              </button>
            )}
            <button onClick={onDelete} className="text-xs text-slate-500 hover:text-red-400 ml-auto opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (data: DocumentInsert) => Promise<void> }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [fileSize, setFileSize] = useState(0);
  const [mimeType, setMimeType] = useState('application/octet-stream');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { if (open) { setName(''); setCategory('general'); setFileSize(0); setMimeType('application/octet-stream'); setError(null); } }, [open]);

  const handleFile = (file: File) => {
    setName(file.name);
    setFileSize(file.size);
    setMimeType(file.type || 'application/octet-stream');
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please select a file or enter a name'); return; }
    setSaving(true); setError(null);
    try {
      const type = detectDocumentType(name, mimeType);
      await onSubmit({ name: name.trim(), type, category, file_size: fileSize, mime_type: mimeType, storage_path: null, ai_summary: null, ai_analysis: null, analysis_status: 'pending' });
    } catch { setError('Failed to upload. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload Document" footer={<><button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Uploading...' : 'Upload'}</button></>}>
      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-ember-500/50 bg-ember-500/5' : 'border-white/[0.08] hover:border-white/[0.15]'}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        >
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.txt,.md,.rtf,.doc,.docx,image/*" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          <Upload size={28} className="text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-300">{name || 'Click or drag a file here'}</p>
          <p className="text-xs text-slate-500 mt-1">PDF, images, text documents</p>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Document Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Electricity Bill August" className="input-field w-full" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="input-field w-full cursor-pointer">
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}

function AnalysisModal({ open, doc, loading, result, onClose }: { open: boolean; doc: DocumentItem | null; loading: boolean; result: { summary: string; fields: Record<string, string> } | null; onClose: () => void }) {
  if (!doc) return null;

  return (
    <Modal open={open} onClose={onClose} title={`AI Analysis · ${doc.name}`} footer={<button className="btn-ghost" onClick={onClose}>Close</button>}>
      {loading ? (
        <div className="py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-ink-600" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-ember-500 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-300">Analyzing document...</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">DEMO MODE · Extracting key information</p>
            </div>
          </div>
        </div>
      ) : result ? (
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={15} className="text-ember-400" />
              <h3 className="text-sm font-display font-semibold text-white">AI Summary</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
          </div>
          <div>
            <h3 className="text-sm font-display font-semibold text-white mb-3">Important Information</h3>
            <div className="space-y-2">
              {Object.entries(result.fields).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 bg-white/[0.03] rounded-lg">
                  <span className="text-xs text-slate-400">{key}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-100">{value}</span>
                    <button onClick={() => navigator.clipboard?.writeText(value)} className="text-slate-500 hover:text-ember-400 transition-colors">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-display font-semibold text-white mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost text-sm flex items-center gap-2"><Bell size={14} /> Set Reminder</button>
              <button className="btn-ghost text-sm flex items-center gap-2"><Wallet size={14} /> Add to Expenses</button>
            </div>
          </div>
          <div className="text-xs text-amber-400/60 font-mono pt-2 border-t border-white/[0.04]">
            Demo analysis · Configure an AI provider in Settings for real document analysis
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
