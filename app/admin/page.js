'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';

const statuses = [
  { value: 'pending', label: '未確認', icon: CircleDashed, className: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'confirmed', label: '確定', icon: CheckCircle2, className: 'bg-[#edf1ea] text-[#40513d] border-[#cdd8c7]' },
  { value: 'completed', label: '完了', icon: CheckCircle2, className: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'canceled', label: 'キャンセル', icon: XCircle, className: 'bg-red-50 text-red-700 border-red-200' },
];

const statusMap = Object.fromEntries(statuses.map((status) => [status.value, status]));
const timeSlots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00'];
const initialBlockForm = {
  date: '',
  time: '10:00',
  reason: '',
};

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${value}T00:00:00`));
}

function formatCreatedAt(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [blockForm, setBlockForm] = useState(initialBlockForm);
  const [savingBlock, setSavingBlock] = useState(false);
  const [deletingBlockId, setDeletingBlockId] = useState('');

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const loadReservations = async () => {
    setLoading(true);
    setError('');

    try {
      const reservationsResponse = await fetch('/api/admin/reservations', { cache: 'no-store' });
      const reservationsResult = await reservationsResponse.json();

      if (reservationsResponse.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!reservationsResponse.ok) {
        throw new Error(reservationsResult.error || '予約一覧の取得に失敗しました。');
      }

      setAuthenticated(true);
      setReservations(reservationsResult.reservations || []);

      const blocksResponse = await fetch('/api/admin/blocked-times', { cache: 'no-store' });
      const blocksResult = await blocksResponse.json();

      if (blocksResponse.status === 401) {
        setAuthenticated(false);
        return;
      }

      if (!blocksResponse.ok) {
        setBlocks([]);
        setError(blocksResult.error || 'ブロック時間の取得に失敗しました。');
        return;
      }

      setBlocks(blocksResult.blocks || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  const updateBlockForm = (event) => {
    setBlockForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const createBlock = async (event) => {
    event.preventDefault();
    setSavingBlock(true);
    setError('');

    try {
      const response = await fetch('/api/admin/blocked-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockForm),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ブロック時間の追加に失敗しました。');
      }

      setBlocks((current) => [...current, result.block].sort((a, b) => (
        `${a.blocked_date} ${a.blocked_time}`.localeCompare(`${b.blocked_date} ${b.blocked_time}`)
      )));
      setBlockForm((current) => ({ ...initialBlockForm, date: current.date }));
    } catch (blockError) {
      setError(blockError.message);
    } finally {
      setSavingBlock(false);
    }
  };

  const deleteBlock = async (id) => {
    setDeletingBlockId(id);
    setError('');

    try {
      const response = await fetch(`/api/admin/blocked-times?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ブロック時間の削除に失敗しました。');
      }

      setBlocks((current) => current.filter((block) => block.id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingBlockId('');
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const filteredReservations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const statusMatched = filter === 'all' || reservation.status === filter;
      const queryMatched = !normalizedQuery || [
        reservation.name,
        reservation.kana,
        reservation.phone,
        reservation.email,
        reservation.service,
        reservation.note,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));

      return statusMatched && queryMatched;
    });
  }, [filter, query, reservations]);

  const counts = useMemo(() => {
    return statuses.reduce((current, status) => ({
      ...current,
      [status.value]: reservations.filter((reservation) => reservation.status === status.value).length,
    }), { all: reservations.length });
  }, [reservations]);

  const submitLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ログインに失敗しました。');
      }

      setPassword('');
      await loadReservations();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    setError('');

    try {
      const response = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ステータスの更新に失敗しました。');
      }

      setReservations((current) => current.map((reservation) => (
        reservation.id === id ? result.reservation : reservation
      )));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId('');
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-[#fffdf9] px-4 py-10">
        <div className="mx-auto max-w-6xl text-sm font-bold text-[#6f6760]">予約情報を確認しています。</div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fffdf9] px-4 py-10">
        <form onSubmit={submitLogin} className="w-full max-w-sm rounded-lg border border-[#e7ddd3] bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[#9b5d3a]">ADMIN</p>
          <h1 className="mt-3 text-2xl font-bold text-[#24211d]">予約管理ログイン</h1>
          <label className="field-label mt-6">
            管理パスワード
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
          <button className="primary-button mt-5 w-full" type="submit" disabled={loading}>
            <LogIn className="h-4 w-4" />
            {loading ? '確認中' : 'ログイン'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf9] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-[#e7ddd3] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold text-[#9b5d3a]">ADMIN</p>
            <h1 className="mt-2 text-3xl font-bold text-[#24211d]">予約管理</h1>
          </div>
          <button className="secondary-button border-[#e7ddd3] text-[#24211d]" type="button" onClick={loadReservations} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            更新
          </button>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-lg border px-4 py-4 text-left ${filter === 'all' ? 'border-[#9b5d3a] bg-white' : 'border-[#e7ddd3] bg-white/70'}`}
          >
            <p className="text-sm font-bold text-[#6f6760]">すべて</p>
            <p className="mt-2 text-2xl font-bold">{counts.all}</p>
          </button>
          {statuses.map((status) => {
            const Icon = status.icon;
            return (
              <button
                key={status.value}
                type="button"
                onClick={() => setFilter(status.value)}
                className={`rounded-lg border px-4 py-4 text-left ${filter === status.value ? 'border-[#9b5d3a] bg-white' : 'border-[#e7ddd3] bg-white/70'}`}
              >
                <p className="flex items-center gap-2 text-sm font-bold text-[#6f6760]">
                  <Icon className="h-4 w-4" />
                  {status.label}
                </p>
                <p className="mt-2 text-2xl font-bold">{counts[status.value]}</p>
              </button>
            );
          })}
        </section>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative block md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f6760]" />
            <input
              className="field field-with-icon"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="名前・電話・メニューで検索"
            />
          </label>
          {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
        </div>

        <section className="mt-5 rounded-lg border border-[#e7ddd3] bg-white p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-[#9b5d3a]">UNAVAILABLE</p>
              <h2 className="mt-1 text-xl font-bold">脱毛予約を受けない時間</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f6760]">美容院の予約や外出で埋まっている時間を追加すると、お客様側の予約フォームでは選択できなくなります。</p>
            </div>
          </div>

          <form onSubmit={createBlock} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
            <label className="field-label">
              日付
              <input required className="field" type="date" name="date" value={blockForm.date} min={today} onChange={updateBlockForm} />
            </label>
            <label className="field-label">
              時間
              <select required className="field" name="time" value={blockForm.time} onChange={updateBlockForm}>
                {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </label>
            <label className="field-label">
              理由
              <input className="field" name="reason" value={blockForm.reason} onChange={updateBlockForm} placeholder="美容院予約、外出など" />
            </label>
            <button className="primary-button" type="submit" disabled={savingBlock}>
              <Plus className="h-4 w-4" />
              {savingBlock ? '追加中' : '追加'}
            </button>
          </form>

          <div className="mt-4 grid gap-2">
            {blocks.length === 0 ? (
              <p className="rounded-md bg-[#fffdf9] px-4 py-3 text-sm font-bold text-[#6f6760]">ブロック中の時間はありません。</p>
            ) : (
              blocks.map((block) => (
                <div key={block.id} className="flex flex-col gap-3 rounded-md border border-[#e7ddd3] bg-[#fffdf9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold">{formatDate(block.blocked_date)} {block.blocked_time}</p>
                    <p className="mt-1 text-sm text-[#6f6760]">{block.reason || '理由なし'}</p>
                  </div>
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
                    type="button"
                    onClick={() => deleteBlock(block.id)}
                    disabled={deletingBlockId === block.id}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingBlockId === block.id ? '解除中' : '解除'}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-lg border border-[#e7ddd3] bg-white">
          {filteredReservations.length === 0 ? (
            <div className="grid min-h-48 place-items-center text-sm font-bold text-[#6f6760]">該当する予約はありません。</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-[#f4eee7] text-xs font-bold text-[#6f6760]">
                  <tr>
                    <th className="px-4 py-3">希望日時</th>
                    <th className="px-4 py-3">お客様</th>
                    <th className="px-4 py-3">連絡先</th>
                    <th className="px-4 py-3">メニュー</th>
                    <th className="px-4 py-3">相談内容</th>
                    <th className="px-4 py-3">状態</th>
                    <th className="px-4 py-3">受付</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7ddd3]">
                  {filteredReservations.map((reservation) => {
                    const status = statusMap[reservation.status] || statusMap.pending;
                    const StatusIcon = status.icon;
                    return (
                      <tr key={reservation.id} className="align-top">
                        <td className="whitespace-nowrap px-4 py-4 font-bold">
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-[#9b5d3a]" />
                            {formatDate(reservation.preferred_date)}
                          </span>
                          <span className="mt-1 block text-[#6f6760]">{reservation.preferred_time}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold">{reservation.name}</p>
                          <p className="mt-1 text-xs text-[#6f6760]">{reservation.kana}</p>
                        </td>
                        <td className="px-4 py-4">
                          <a className="block font-bold text-[#24211d]" href={`tel:${reservation.phone}`}>{reservation.phone}</a>
                          <a className="mt-1 block text-xs text-[#6f6760]" href={`mailto:${reservation.email}`}>{reservation.email}</a>
                        </td>
                        <td className="px-4 py-4 font-bold">{reservation.service}</td>
                        <td className="max-w-[220px] px-4 py-4 leading-6 text-[#6f6760]">{reservation.note || 'なし'}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold ${status.className}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                          <select
                            className="field mt-2 min-w-32 py-2 text-xs"
                            value={reservation.status}
                            disabled={updatingId === reservation.id}
                            onChange={(event) => updateStatus(reservation.id, event.target.value)}
                          >
                            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-[#6f6760]">{formatCreatedAt(reservation.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
