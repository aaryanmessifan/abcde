import { useEffect, useState } from 'react';
import { Plus, Trash2, Phone, Mail, Cake, Heart, Calendar, Users, ImageIcon, Pencil } from 'lucide-react';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState, PageHeader } from '@/components/ui/Feedback';
import { fetchAllFamilyMembers, createFamilyMember, deleteFamilyMember, updateFamilyMember, fetchAllMemories, createMemory, deleteMemory } from '@/lib/services/familyService';
import { formatDateShort, daysUntil } from '@/lib/date';
import type { FamilyMember, FamilyMemberInsert, Memory, MemoryInsert } from '@/types';

type Tab = 'members' | 'memories';

export function FamilyPage() {
  const [tab, setTab] = useState<Tab>('members');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<FamilyMember | null>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [deleteMemoryTarget, setDeleteMemoryTarget] = useState<Memory | null>(null);

  const loadData = async () => {
    try {
      const [m, mem] = await Promise.all([fetchAllFamilyMembers(), fetchAllMemories()]);
      setMembers(m); setMemories(mem);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const upcomingBirthdays = members.filter(m => m.birthday).map(m => {
    const birthDate = new Date(m.birthday + 'T00:00:00');
    const now = new Date();
    let next = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    return { member: m, days: daysUntil(toDateString(next))!, nextDate: next };
  }).sort((a, b) => a.days - b.days).filter(b => b.days <= 30);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      <PageHeader title="Family Hub" subtitle="Your family, their important dates, and shared memories." />

      <div className="flex items-center gap-1 bg-ink-800/50 rounded-xl p-1 mb-5 w-fit">
        <button onClick={() => setTab('members')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'members' ? 'bg-ember-500/15 text-ember-400' : 'text-slate-400 hover:text-white'}`}>Members</button>
        <button onClick={() => setTab('memories')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'memories' ? 'bg-ember-500/15 text-ember-400' : 'text-slate-400 hover:text-white'}`}>Memories</button>
      </div>

      {upcomingBirthdays.length > 0 && tab === 'members' && (
        <div className="card p-4 mb-5 flex items-center gap-3">
          <Cake size={18} className="text-ember-400 flex-shrink-0" />
          <p className="text-sm text-slate-300">
            <span className="text-white font-medium">{upcomingBirthdays[0].member.name}'s</span> birthday is in <span className="text-ember-400">{upcomingBirthdays[0].days} day{upcomingBirthdays[0].days !== 1 ? 's' : ''}</span>.
            {upcomingBirthdays.length > 1 && ` Plus ${upcomingBirthdays.length - 1} more coming up.`}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : tab === 'members' ? (
        <>
          {members.length === 0 ? (
            <EmptyState icon={Users} title="No family members yet" description="Add your family members to keep track of birthdays, anniversaries, and important contacts." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {members.map(m => <MemberCard key={m.id} member={m} onEdit={() => setEditingMember(m)} onDelete={() => setDeleteMember(m)} />)}
            </div>
          )}
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-2 mt-3"><Plus size={16} /> Add Family Member</button>
        </>
      ) : (
        <>
          {memories.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No memories yet" description="Capture special moments and memories to treasure forever." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {memories.map(mem => <MemoryCard key={mem.id} memory={mem} onDelete={() => setDeleteMemoryTarget(mem)} />)}
            </div>
          )}
          <button onClick={() => setShowMemory(true)} className="btn-primary text-sm flex items-center gap-2 mt-3"><Plus size={16} /> Add Memory</button>
        </>
      )}

      <MemberFormModal open={showAdd || !!editingMember} onClose={() => { setShowAdd(false); setEditingMember(null); }} member={editingMember} onSubmit={async (data) => { if (editingMember) { await updateFamilyMember(editingMember.id, data); } else { await createFamilyMember(data); } setShowAdd(false); setEditingMember(null); loadData(); }} />
      <MemoryFormModal open={showMemory} onClose={() => setShowMemory(false)} onSubmit={async (data) => { await createMemory(data); setShowMemory(false); loadData(); }} />

      <ConfirmDialog open={!!deleteMember} title="Remove family member?" message={`Remove ${deleteMember?.name} from your family hub? This cannot be undone.`} confirmLabel="Remove" onConfirm={async () => { if (deleteMember) { await deleteFamilyMember(deleteMember.id); setDeleteMember(null); loadData(); } }} onCancel={() => setDeleteMember(null)} />
      <ConfirmDialog open={!!deleteMemoryTarget} title="Delete memory?" message="This memory will be permanently deleted." confirmLabel="Delete" onConfirm={async () => { if (deleteMemoryTarget) { await deleteMemory(deleteMemoryTarget.id); setDeleteMemoryTarget(null); loadData(); } }} onCancel={() => setDeleteMemoryTarget(null)} />
    </div>
  );
}

function MemberCard({ member, onEdit, onDelete }: { member: FamilyMember; onEdit: () => void; onDelete: () => void }) {
  const initials = member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="group card card-hover p-4">
      <div className="flex items-start gap-3">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ember-500/20 to-frost-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-display font-semibold text-ember-400">{initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100">{member.name}</p>
          <p className="text-xs text-slate-500">{member.relationship}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {member.birthday && <span className="text-xs text-slate-500 flex items-center gap-1"><Cake size={11} /> {formatDateShort(member.birthday)}</span>}
            {member.anniversary && <span className="text-xs text-slate-500 flex items-center gap-1"><Heart size={11} /> {formatDateShort(member.anniversary)}</span>}
            {member.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} /> {member.phone}</span>}
            {member.email && <span className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11} /> {member.email}</span>}
          </div>
          {member.notes && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{member.notes}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5"><Pencil size={13} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function MemoryCard({ memory, onDelete }: { memory: Memory; onDelete: () => void }) {
  return (
    <div className="group card card-hover p-4">
      {memory.photo_url && <img src={memory.photo_url} alt={memory.title} className="w-full h-32 rounded-xl object-cover mb-3" />}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100">{memory.title}</p>
          {memory.date && <p className="text-xs text-slate-500 mt-0.5">{formatDateShort(memory.date)}</p>}
          {memory.description && <p className="text-xs text-slate-400 mt-2 line-clamp-3">{memory.description}</p>}
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function MemberFormModal({ open, onClose, onSubmit, member }: { open: boolean; onClose: () => void; onSubmit: (data: FamilyMemberInsert) => Promise<void>; member: FamilyMember | null }) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(member?.name ?? ''); setRelationship(member?.relationship ?? ''); setBirthday(member?.birthday ?? '');
      setAnniversary(member?.anniversary ?? ''); setPhone(member?.phone ?? ''); setEmail(member?.email ?? '');
      setNotes(member?.notes ?? ''); setPhotoUrl(member?.photo_url ?? ''); setError(null);
    }
  }, [open, member]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError(null);
    try { await onSubmit({ name: name.trim(), relationship: relationship.trim() || 'family', birthday: birthday || null, anniversary: anniversary || null, phone: phone.trim() || null, email: email.trim() || null, notes: notes.trim() || null, photo_url: photoUrl.trim() || null }); }
    catch { setError('Failed to save. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={member ? 'Edit Family Member' : 'Add Family Member'} footer={<><button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
      <div className="space-y-4">
        <div><label className="block text-xs text-slate-400 mb-1.5">Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aaryan" className="input-field w-full" autoFocus /></div>
        <div><label className="block text-xs text-slate-400 mb-1.5">Relationship</label><input type="text" value={relationship} onChange={e => setRelationship(e.target.value)} placeholder="e.g. Grandson, Nephew, Son" className="input-field w-full" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-slate-400 mb-1.5">Birthday</label><input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="input-field w-full" /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Anniversary</label><input type="date" value={anniversary} onChange={e => setAnniversary(e.target.value)} className="input-field w-full" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-slate-400 mb-1.5">Phone</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className="input-field w-full" /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="input-field w-full" /></div>
        </div>
        <div><label className="block text-xs text-slate-400 mb-1.5">Photo URL (optional)</label><input type="text" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." className="input-field w-full" /></div>
        <div><label className="block text-xs text-slate-400 mb-1.5">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything special..." rows={2} className="input-field w-full resize-none" /></div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}

function MemoryFormModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (data: MemoryInsert) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setTitle(''); setDescription(''); setDate(''); setPhotoUrl(''); setError(null); } }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError(null);
    try { await onSubmit({ title: title.trim(), description: description.trim() || null, date: date || null, photo_url: photoUrl.trim() || null, family_member_id: null }); }
    catch { setError('Failed to save. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Memory" footer={<><button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Memory'}</button></>}>
      <div className="space-y-4">
        <div><label className="block text-xs text-slate-400 mb-1.5">Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Family Trip to Shimla" className="input-field w-full" autoFocus /></div>
        <div><label className="block text-xs text-slate-400 mb-1.5">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What makes this memory special?" rows={3} className="input-field w-full resize-none" /></div>
        <div><label className="block text-xs text-slate-400 mb-1.5">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-full" /></div>
        <div><label className="block text-xs text-slate-400 mb-1.5">Photo URL (optional)</label><input type="text" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." className="input-field w-full" /></div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}

function toDateString(date: Date): string {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
