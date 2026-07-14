import { NextRequest, NextResponse } from 'next/server';
import { customFilas } from '@/lib/store';

export async function GET() {
  return NextResponse.json({ categorias: customFilas });
}

export async function POST(req: NextRequest) {
  try {
    const { categoria, fila } = await req.json();
    if (!categoria || !categoria.trim() || !fila || !fila.trim()) {
      return NextResponse.json({ error: 'Categoria e Fila são obrigatórios.' }, { status: 400 });
    }

    const catName = categoria.trim();
    const filaName = fila.trim();

    // Find if category exists
    let catObj = customFilas.find(c => c.nome.toLowerCase() === catName.toLowerCase());
    if (!catObj) {
      catObj = { nome: catName, filas: [] };
      customFilas.push(catObj);
    }

    // Check if fila already exists in this category
    const exists = catObj.filas.some(f => f.toLowerCase() === filaName.toLowerCase());
    if (exists) {
      return NextResponse.json({ error: 'Esta fila já existe nesta categoria.' }, { status: 400 });
    }

    catObj.filas.push(filaName);

    return NextResponse.json({ success: true, categorias: customFilas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
