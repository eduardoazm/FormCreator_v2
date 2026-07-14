import { NextRequest, NextResponse } from 'next/server';
import { customClientes } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  const filtered = customClientes.filter(
    (c) =>
      c.abreviatura.toLowerCase().includes(q) ||
      c.nome_completo.toLowerCase().includes(q)
  );

  return NextResponse.json({ clientes: filtered });
}

export async function POST(req: NextRequest) {
  try {
    const { abreviatura, nome_completo } = await req.json();
    if (!abreviatura || !nome_completo) {
      return NextResponse.json({ error: 'Abreviatura e nome completo são obrigatórios.' }, { status: 400 });
    }

    const exists = customClientes.some(
      (c) => c.abreviatura.toLowerCase() === abreviatura.toLowerCase().trim()
    );

    if (exists) {
      return NextResponse.json({ error: 'Cliente com esta abreviatura já existe.' }, { status: 400 });
    }

    customClientes.push({
      abreviatura: abreviatura.toUpperCase().trim(),
      nome_completo: nome_completo.trim()
    });

    return NextResponse.json({ success: true, clientes: customClientes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
