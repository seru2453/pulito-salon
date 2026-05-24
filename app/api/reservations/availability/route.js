import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../_supabaseAdmin';

const bookedStatuses = ['pending', 'confirmed'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: '日付を指定してください。' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ bookedTimes: [], mode: 'demo' });
  }

  const { data: reservations, error: reservationsError } = await supabase
    .from('reservations')
    .select('preferred_time')
    .eq('preferred_date', date)
    .in('status', bookedStatuses);

  if (reservationsError) {
    console.error(reservationsError);
    return NextResponse.json({ error: '空き状況の取得に失敗しました。' }, { status: 500 });
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('reservation_blocks')
    .select('blocked_time')
    .eq('blocked_date', date);

  if (blocksError && !['42P01', 'PGRST205'].includes(blocksError.code)) {
    console.error(blocksError);
    return NextResponse.json({ error: '空き状況の取得に失敗しました。' }, { status: 500 });
  }

  const bookedTimes = [
    ...new Set([
      ...reservations.map((reservation) => reservation.preferred_time),
      ...(blocks || []).map((block) => block.blocked_time),
    ]),
  ];

  return NextResponse.json({ bookedTimes, mode: 'supabase' });
}
