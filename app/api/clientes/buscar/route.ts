import { NextRequest, NextResponse } from 'next/server';

const CLIENTES = [
  {
    "abreviatura": "PZL",
    "nome_completo": "SES-AM - PZL - Policlinica Zeno Lanzini"
  },
  {
    "abreviatura": "HPSDAP",
    "nome_completo": "INDSH - SES-AM - HPSDAP - HPS Dr. Aristoteles Platao"
  },
  {
    "abreviatura": "FMT",
    "nome_completo": "SES-AM - FMT - Fundação de Medicina Tropical"
  },
  {
    "abreviatura": "MDND",
    "nome_completo": "SES-AM - MDND - Maternidade Dona Nazira Daou"
  },
  {
    "abreviatura": "HUFM",
    "nome_completo": "SES-AM - HUFM - Hosp. Universit. Francisca Mendes"
  },
  {
    "abreviatura": "MRAB",
    "nome_completo": "SES-AM - MRAB - Maternidade de Ref Ana Braga"
  },
  {
    "abreviatura": "ICAM",
    "nome_completo": "SES-AM - ICAM - Inst Saude da Crianca do Amazonas"
  },
  {
    "abreviatura": "SPA COROADO",
    "nome_completo": "SES-AM - SPA COROADO"
  },
  {
    "abreviatura": "SPA PDC",
    "nome_completo": "SES-AM - SPA PDC - SPA e Policlinica Dr. Danilo"
  },
  {
    "abreviatura": "HPSCZL",
    "nome_completo": "SES-AM - HPSCZL - HPS da Criança da Zona Leste"
  },
  {
    "abreviatura": "FHAM",
    "nome_completo": "SES-AM - FHAM - Fund Hospitalar Alfredo da Matta"
  },
  {
    "abreviatura": "HGM",
    "nome_completo": "SES-AM - HGM - Hospital Geral de Manacapuru"
  },
  {
    "abreviatura": "CAIC MHFG",
    "nome_completo": "SES-AM - CAIC MHFG - CAIC Maria H Freitas de Goes"
  },
  {
    "abreviatura": "PJSB",
    "nome_completo": "SES-AM - PJSB - Policlinica João dos Santos Braga"
  },
  {
    "abreviatura": "CECON",
    "nome_completo": "SES-AM CECON - Fundação CECON"
  },
  {
    "abreviatura": "HPSJLP",
    "nome_completo": "SES-AM - HPSJLP - HPS Dr Joao Lucio Pereira"
  },
  {
    "abreviatura": "SPA SR",
    "nome_completo": "SES-AM - SPA SR - SPA São Raimundo"
  },
  {
    "abreviatura": "SPA ZS",
    "nome_completo": "SES-AM - SPA ZS - SPA Zona Sul"
  },
  {
    "abreviatura": "MASM",
    "nome_completo": "SES-AM - MASM - Matern Azilda da Silva Marreiro"
  },
  {
    "abreviatura": "CAIMI DPL",
    "nome_completo": "SES-AM - CAIMI DPL - CAIMI Dr. Paulo Lima"
  },
  {
    "abreviatura": "SPA PDJL",
    "nome_completo": "SES-AM - SPA PDJL - SPA e Pol Dr. Jose Lins"
  },
  {
    "abreviatura": "FHAJ",
    "nome_completo": "SES-AM - FHAJ - Fundação Hospital Adriano Jorge"
  },
  {
    "abreviatura": "HPSCZO",
    "nome_completo": "SES-AM - HPSCZO  - HPS da Criança Zona Oeste"
  },
  {
    "abreviatura": "HIDF",
    "nome_completo": "SES-AM - HIDF - Hospital Infantil Dr Fajardo"
  },
  {
    "abreviatura": "PC",
    "nome_completo": "SES-AM - PC - Policlinica Codajas"
  },
  {
    "abreviatura": "HPSCZS",
    "nome_completo": "SES-AM - HPSCZS - HPS da Criança Zona Sul"
  },
  {
    "abreviatura": "PGGM",
    "nome_completo": "SES-AM - PGGM - Policlinica Gov Gilberto Mestrinh"
  },
  {
    "abreviatura": "CAIC AM",
    "nome_completo": "CAIC AM - CAIC Alexandre Montoril"
  },
  {
    "abreviatura": "PCF",
    "nome_completo": "SES-AM - PCF - Policlinica Cardoso Fontes"
  },
  {
    "abreviatura": "HPER",
    "nome_completo": "SES-AM HPER - Hosp Psiquiátrico Eduardo Ribeiro - (CESMAM)"
  },
  {
    "abreviatura": "CAIC JCM",
    "nome_completo": "SES-AM - CAIC JCM - CAIC Jose Carlos Mestrinho"
  },
  {
    "abreviatura": "MBM",
    "nome_completo": "SES-AM - MBM - Maternidade Balbina Mestrinho"
  },
  {
    "abreviatura": "HGR",
    "nome_completo": "SES-AM - HGR - Hospital Geraldo da Rocha"
  },
  {
    "abreviatura": "SPA JD",
    "nome_completo": "SES-AM - SPA JD - Joventina Dias"
  },
  {
    "abreviatura": "SPA ELIAMEME",
    "nome_completo": "SES-AM - SPA ELIAMEME RODRIGUES MADY"
  },
  {
    "abreviatura": "PAA",
    "nome_completo": "SES-AM - PAA - Policlinica Antonio Aleixo"
  },
  {
    "abreviatura": "MA",
    "nome_completo": "SES-AM - MA - Maternidade Alvorada"
  },
  {
    "abreviatura": "HCP",
    "nome_completo": "SES-AM - HCP - Hospital Chapot Prevost"
  },
  {
    "abreviatura": "UPAJR",
    "nome_completo": "SES-AM - UPAJR - UPA Jose Rodrigues"
  },
  {
    "abreviatura": "CAIC DJM",
    "nome_completo": "SES-AM - CAIC DJM - CAIC Dra Josephina de Mello"
  },
  {
    "abreviatura": "CAIC EM",
    "nome_completo": "SES-AM - CAIC EM - CAIC Edson Melo"
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  const filtered = CLIENTES.filter(
    (c) =>
      c.abreviatura.toLowerCase().includes(q) ||
      c.nome_completo.toLowerCase().includes(q)
  );

  return NextResponse.json({ clientes: filtered });
}
