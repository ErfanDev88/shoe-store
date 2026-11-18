'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import Pager from '@/components/Pager';
import { Spinner } from '@/components/ui';
import { api, fetcher, qs } from '@/lib/api';
import type { Paged, User } from '@/lib/types';
import { useErrorText } from '@/lib/use-fmt';
import { useAuth } from '@/stores/auth';

export default function AdminUsers() {
  const t = useTranslations();
  const err = useErrorText();
  const me = useAuth((s) => s.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, mutate } = useSWR<Paged<User>>(`/users${qs({ page, limit: 20, search })}`, fetcher);
  const patch = async (id: string, path: string, json: unknown) => { try { await api(`/users/${id}/${path}`, { method: 'PATCH', json }); await mutate(); } catch (e) { toast.error(err(e)); } };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="sr-only">{t('admin.nav.users')}</h2><input className="input max-w-xs" placeholder={t('nav.search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
      {!data ? <Spinner /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full"><thead className="border-b"><tr><th className="th">{t('admin.customer')}</th><th className="th">{t('auth.phone')} / {t('auth.email')}</th><th className="th">{t('admin.role')}</th><th className="th">{t('admin.active')}</th></tr></thead>
            <tbody className="divide-y">{data.items.map((u) => (
              <tr key={u.id}>
                <td className="td">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</td>
                <td className="td" dir="ltr">{u.phone}{u.phone && u.email ? ' · ' : ''}{u.email}</td>
                <td className="td"><select className="input w-36" disabled={u.id === me?.id} value={u.role} onChange={(e) => patch(u.id, 'role', { role: e.target.value })}>{['customer', 'support', 'content', 'admin'].map((r) => (<option key={r} value={r}>{t(`role.${r}`)}</option>))}</select></td>
                <td className="td"><input type="checkbox" disabled={u.id === me?.id} checked={u.isActive} onChange={(e) => patch(u.id, 'active', { isActive: e.target.checked })} /></td>
              </tr>))}</tbody></table>
          <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
