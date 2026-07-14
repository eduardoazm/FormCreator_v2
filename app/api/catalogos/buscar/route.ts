import { NextRequest, NextResponse } from 'next/server';

const CATALOGOS = [
  "Sistemas > Infraestrutura » Equipamentos » Estação de Trabalho",
  "Sistemas > Infraestrutura » Equipamentos » Impressora",
  "Sistemas > Infraestrutura » Equipamentos » Monitor",
  "Sistemas > Infraestrutura » Equipamentos » Nobreak",
  "Sistemas > Infraestrutura » Equipamentos » Periféricos",
  "Sistemas > Infraestrutura » Equipamentos » Totem",
  "Sistemas > Infraestrutura » Redes e Conectividades",
  "Sistemas > Produtos » Integrações » Assinatura Digital",
  "Sistemas > Produtos » Integrações » Med.Place",
  "Sistemas > Produtos » Medplace » Treinamento Medplace",
  "Sistemas > Produtos » SX Anesthesia",
  "Sistemas > Produtos » SX Lis VFR » Treinamento Sx LIS",
  "Sistemas > Produtos » SX Sigma » Agenda",
  "Sistemas > Produtos » SX Sigma » Ambulatório",
  "Sistemas > Produtos » SX Sigma » APAC",
  "Sistemas > Produtos » SX Sigma » Atualização de Módulos",
  "Sistemas > Produtos » SX Sigma » BI",
  "Sistemas > Produtos » SX Sigma » Cadastro Gerais",
  "Sistemas > Produtos » SX Sigma » Centro Cirúrgico",
  "Sistemas > Produtos » SX Sigma » Compras",
  "Sistemas > Produtos » SX Sigma » Configurações",
  "Sistemas > Produtos » SX Sigma » Criação de Usuário Sx Sigma",
  "Sistemas > Produtos » SX Sigma » Faturamento SIASUS",
  "Sistemas > Produtos » SX Sigma » Faturamento SIHSUS",
  "Sistemas > Produtos » SX Sigma » Gerador de Documentos",
  "Sistemas > Produtos » SX Sigma » Gerador de Documentos (Edoc)",
  "Sistemas > Produtos » SX Sigma » Instalação SX Sigma",
  "Sistemas > Produtos » SX Sigma » Metas e Indicadores",
  "Sistemas > Produtos » SX Sigma » Painel Gerencial",
  "Sistemas > Produtos » SX Sigma » Painel Paciente",
  "Sistemas > Produtos » SX Sigma » Painel Senha",
  "Sistemas > Produtos » SX Sigma » Portal",
  "Sistemas > Produtos » SX Sigma » Prontuário Ambulatorial",
  "Sistemas > Produtos » SX Sigma » Prontuário Internação",
  "Sistemas > Produtos » SX Sigma » Recepção e Registro",
  "Sistemas > Produtos » SX Sigma » Requisições",
  "Sistemas > Produtos » SX Sigma » Reset de Senha",
  "Sistemas > Produtos » SX Sigma » SADT",
  "Sistemas > Produtos » SX Sigma » Suprimentos",
  "Sistemas > Produtos » SX Sigma » Treinamento Sx Sigma",
  "Sistemas > Produtos » SX Sigma » Vinculação de Usuário Sx Sigma",
  "Sistemas > Suporte Interno » Instalação de Impressoras",
  "Sistemas > Suporte Interno » Instalação de Programas/Aplicativos",
  "Sistemas > Suporte Interno » Ronda diária"
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  const filtered = CATALOGOS.filter((item) =>
    item.toLowerCase().includes(q)
  );

  return NextResponse.json({
    catalogos: filtered.map((item) => ({ nome: item })),
  });
}
