import { NextRequest } from 'next/server';
import { activeJobs } from '@/lib/store';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const job = activeJobs.get(id);

  if (!job) {
    return new Response('Job not found', { status: 404 });
  }

  // Set up headers for Server-Sent Events (SSE)
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  let lastIndex = 0;

  const stream = new ReadableStream({
    start(controller) {
      // Send any accumulated and new logs
      const sendNewLogs = () => {
        const currentJob = activeJobs.get(id);
        if (!currentJob) {
          try {
            controller.close();
          } catch (e) {}
          return true; // stop interval
        }

        while (lastIndex < currentJob.logs.length) {
          const log = currentJob.logs[lastIndex];
          const payload = JSON.stringify({
            msg: log.msg,
            nivel: log.nivel,
            chamadoIdx: log.chamadoIdx,
          });
          controller.enqueue(`data: ${payload}\n\n`);
          lastIndex++;
        }

        if (currentJob.status !== 'running') {
          // Send completion event
          const donePayload = JSON.stringify({
            status: currentJob.status,
          });
          controller.enqueue(`event: done\ndata: ${donePayload}\n\n`);
          try {
            controller.close();
          } catch (e) {}
          return true; // stop interval
        }
        return false;
      };

      // Send initial batch
      const finished = sendNewLogs();
      if (finished) return;

      const interval = setInterval(() => {
        const stop = sendNewLogs();
        if (stop) {
          clearInterval(interval);
        }
      }, 300);

      // Handle stream cancellation (e.g., client disconnected)
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, { headers });
}
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
