import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ erro: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure the uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate a clean filename to avoid overwrite conflicts
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(uploadsDir, filename);

    // Save the file
    await fs.writeFile(filePath, buffer);

    // Return the public URL path
    const publicPath = `/uploads/${filename}`;

    return NextResponse.json({
      path: publicPath,
      nome: file.name,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { erro: `Falha ao fazer upload: ${message}` },
      { status: 500 }
    );
  }
}
