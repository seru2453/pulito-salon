import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../_supabaseAdmin';
import { hasAdminPassword, isAdminRequest } from '../_auth';

const allowedStatuses = ['pending', 'confirmed', 'completed', 'canceled'];

const reservationColumns = [
  'id',
  'name',
  'kana',
  'phone',
  'email',
  'service',
  'preferred_date',
  'preferred_time',
  'note',
  'status',
  'created_at',
].join(',');

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
    .from('reservations')
    .select(reservationColumns)
    .order('preferred_date', { ascending: true })
    .order('preferred_time', { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: '予約一覧の取得に失敗しました。' }, { status: 500 });
  }

  return NextResponse.json({ reservations: data });
}

export async function PATCH(request) {
  const supabase = createSupabaseAdminClient();
  if (!supabase || !hasAdminPassword()) {
    return unavailableResponse();
  }

  if (!isAdminRequest(request)) {
    return unauthorizedResponse();
  }

  const payload = await request.json();
  const id = typeof payload.id === 'string' ? payload.id : '';
  const status = typeof payload.status === 'string' ? payload.status : '';

  if (!id || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: '更新内容が正しくありません。' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select(reservationColumns)
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: '予約ステータスの更新に失敗しました。' }, { status: 500 });
  }

  return NextResponse.json({ reservation: data });
}
