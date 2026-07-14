import { NextResponse } from 'next/server';
import { ticketHistory } from '@/lib/store';

export async function GET() {
  return NextResponse.json(ticketHistory);
}
