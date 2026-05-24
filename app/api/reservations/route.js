import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../_supabaseAdmin';

const requiredFields = ['name', 'kana', 'phone', 'email', 'service', 'date', 'time'];
const bookedStatuses = ['pending', 'confirmed'];

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request) {
  const payload = await request.json();
  const reservation = {
    name: sanitizeString(payload.name),
    kana: sanitizeString(payload.kana),
    phone: sanitizeString(payload.phone),
    email: sanitizeString(payload.email),
    service: sanitizeString(payload.service),
    preferred_date: sanitizeString(payload.date),
    preferred_time: sanitizeString(payload.time),
    note: sanitizeString(payload.note),
    status: 'pending',
  };

  const missing = requiredFields.filter((field) => !sanitizeString(payload[field]));
  if (missing.length > 0) {
    return NextResponse.json({ error: '必須項目を入力してください。' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    console.info('Supabase env vars are not configured. Reservation accepted in demo mode.', reservation);
    return NextResponse.json({ ok: true, mode: 'demo' });
  }

  const { data: existingReservation, error: existingError } = await supabase
    .from('reservations')
    .select('id')
    .eq('preferred_date', reservation.preferred_date)
    .eq('preferred_time', reservation.preferred_time)
    .in('status', bookedStatuses)
    .maybeSingle();

  if (existingError) {
    console.error(existingError);
    return NextResponse.json({ error: '空き状況の確認に失敗しました。時間をおいて再度お試しください。' }, { status: 500 });
  }

  if (existingReservation) {
    return NextResponse.json({ error: '選択した日時はすでに予約が入っています。別の時間を選択してください。' }, { status: 409 });
  }

  const { error } = await supabase.from('reservations').insert(reservation);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: '予約の保存に失敗しました。時間をおいて再度お試しください。' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: 'supabase' });
}
