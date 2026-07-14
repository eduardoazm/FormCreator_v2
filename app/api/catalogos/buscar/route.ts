import { NextRequest, NextResponse } from 'next/server';
import { customCatalogos } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  const filtered = customCatalogos.filter((item) =>
    item.toLowerCase().includes(q)
  );

  return NextResponse.json({
    catalogos: filtered.map((item) => ({ nome: item })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { nome } = await req.json();
    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'Nome do serviço é obrigatório.' }, { status: 400 });
    }

    const trimmedNome = nome.trim();
    const exists = customCatalogos.some(
      (item) => item.toLowerCase() === trimmedNome.toLowerCase()
    );

    if (exists) {
      return NextResponse.json({ error: 'Este item de catálogo já existe.' }, { status: 400 });
    }

    customCatalogos.push(trimmedNome);

    return NextResponse.json({ success: true, catalogos: customCatalogos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
