import { NextResponse } from 'next/server';
import { ticketHistory } from '@/lib/store';

export async function POST() {
  ticketHistory.length = 0; // Clear the array in-place
  return NextResponse.json({ ok: true, msg: 'Histórico limpo com sucesso.' });
}
