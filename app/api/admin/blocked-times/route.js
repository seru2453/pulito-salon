import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../_supabaseAdmin';
import { hasAdminPassword, isAdminRequest } from '../_auth';

const blockColumns = [
  'id',
  'blocked_date',
  'blocked_time',
  'reason',
  'created_at',
].join(',');

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function unauthorizedResponse() {
  return NextResponse.json({ error: '管理画面にログインしてください。' }, { status: 401 });
}

function unavailableResponse() {
  return NextResponse.json(
    { error: 'Supabase または管理パスワードの環境変数が未設定です。' },
    { status: 503 },
  );
}

export async function GET(request) {
  const supabase = createSupabaseAdminClient();
  if (!supabase || !hasAdminPassword()) {
    return unavailableResponse();
  }

  if (!isAdminRequest(request)) {
    return unauthorizedResponse();
  }

  const { data, error } = await supabase
    .from('reservation_blocks')
    .select(blockColumns)
    .order('blocked_date', { ascending: true })
    .order('blocked_time', { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'ブロック時間の取得に失敗しました。Supabase SQLを更新してください。' }, { status: 500 });
  }

  return NextResponse.json({ blocks: data });
}

export async function POST(request) {
  const supabase = createSupabaseAdminClient();
  if (!supabase || !hasAdminPassword()) {
    return unavailableResponse();
  }

  if (!isAdminRequest(request)) {
    return unauthorizedResponse();
  }

  const payload = await request.json();
  const block = {
    blocked_date: sanitizeString(payload.date),
    blocked_time: sanitizeString(payload.time),
    reason: sanitizeString(payload.reason) || null,
  };

  if (!block.blocked_date || !block.blocked_time) {
    return NextResponse.json({ error: '日付と時間を選択してください。' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reservation_blocks')
    .insert(block)
    .select(blockColumns)
    .single();

  if (error?.code === '23505') {
    return NextResponse.json({ error: 'この時間はすでにブロックされています。' }, { status: 409 });
  }

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'ブロック時間の追加に失敗しました。Supabase SQLを更新してください。' }, { status: 500 });
  }

  return NextResponse.json({ block: data });
}

export async function DELETE(request) {
  const supabase = createSupabaseAdminClient();
  if (!supabase || !hasAdminPassword()) {
    return unavailableResponse();
  }

  if (!isAdminRequest(request)) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '削除するブロック時間を指定してください。' }, { status: 400 });
  }

  const { error } = await supabase
    .from('reservation_blocks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'ブロック時間の削除に失敗しました。' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
