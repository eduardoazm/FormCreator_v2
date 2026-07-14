import { NextRequest, NextResponse } from 'next/server';
import { activeJobs, addLog } from '@/lib/store';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const job = activeJobs.get(id);

  if (!job) {
    return NextResponse.json({ erro: 'Job não encontrado ou já expirado.' }, { status: 404 });
  }

  if (job.status === 'running') {
    job.status = 'cancelled';
    addLog(id, `🛑 Processo cancelado pelo usuário. Interrompendo na próxima etapa...`, 'WARNING');
    return NextResponse.json({ ok: true, msg: 'Solicitação de cancelamento enviada.' });
  }

  return NextResponse.json({ erro: `O processo já está em estado: ${job.status}` }, { status: 400 });
}
