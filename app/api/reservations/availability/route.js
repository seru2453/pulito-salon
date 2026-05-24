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

  const { data, error } = await supabase
    .from('reservations')
    .select('preferred_time')
    .eq('preferred_date', date)
    .in('status', bookedStatuses);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: '空き状況の取得に失敗しました。' }, { status: 500 });
  }

  const bookedTimes = [...new Set(data.map((reservation) => reservation.preferred_time))];

  return NextResponse.json({ bookedTimes, mode: 'supabase' });
}
