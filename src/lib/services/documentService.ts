import { supabase } from '../supabase';
import type { DocumentItem, DocumentInsert, DocumentType, AnalysisStatus } from '@/types';

export async function fetchAllDocuments(): Promise<DocumentItem[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('upload_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDocument(doc: DocumentInsert): Promise<DocumentItem> {
  const { data, error } = await supabase
    .from('documents')
    .insert(doc)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDocumentAnalysis(
  id: string,
  analysis: { summary: string; fields: Record<string, string> }
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({
      ai_summary: analysis.summary,
      ai_analysis: analysis.fields,
      analysis_status: 'analyzed' as AnalysisStatus,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function skipAnalysis(id: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ analysis_status: 'skipped' as AnalysisStatus })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

export function detectDocumentType(fileName: string, mimeType: string): DocumentType {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (mimeType.includes('pdf') || ext === 'pdf') return 'pdf';
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['txt', 'md', 'rtf', 'doc', 'docx'].includes(ext) || mimeType.startsWith('text/')) return 'text';
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateDemoAnalysis(fileName: string): { summary: string; fields: Record<string, string> } {
  const lower = fileName.toLowerCase();
  if (lower.includes('bill') || lower.includes('electricity') || lower.includes('water') || lower.includes('gas')) {
    return {
      summary: 'This appears to be a utility bill. The document shows a monthly charge with a due date. Key details have been extracted below for your reference. You can set a reminder for the due date or add this amount to your expenses.',
      fields: {
        'Provider': 'Sample Utility Company',
        'Amount': '₹1,240 (estimated)',
        'Due Date': 'Within 15 days',
        'Account Number': 'XXXX-XXXX-1234',
        'Billing Period': 'Last month',
      },
    };
  }
  if (lower.includes('insurance') || lower.includes('policy')) {
    return {
      summary: 'This appears to be an insurance document. It contains policy details, coverage information, and renewal dates. Please review the key information extracted below.',
      fields: {
        'Policy Type': 'Sample Insurance Policy',
        'Provider': 'Sample Insurance Provider',
        'Premium': '₹8,500/year (estimated)',
        'Renewal Date': 'Annual',
        'Policy Number': 'XXXX-XXXX-5678',
      },
    };
  }
  if (lower.includes('report') || lower.includes('medical') || lower.includes('health')) {
    return {
      summary: 'This appears to be a medical or health report. Key findings and recommendations are typically included. Please consult your doctor for proper interpretation.',
      fields: {
        'Document Type': 'Medical Report',
        'Date': 'Recent',
        'Key Findings': 'See full document',
        'Recommendation': 'Follow up with doctor',
      },
    };
  }
  return {
    summary: 'This document has been added to your library. AI analysis is running in demo mode — when a real AI provider is configured, this will automatically extract key information, dates, amounts, and action items from your documents.',
    fields: {
      'Document Name': fileName,
      'Type': 'General Document',
      'Status': 'Demo analysis — configure an AI provider for full analysis',
    },
  };
}
