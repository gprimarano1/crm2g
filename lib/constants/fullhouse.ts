// ================================================================
// Constantes da marca Full House — usadas em orçamentos públicos.
// Fonte: https://fullhousedecoracao.com.br/sobre/
// ================================================================

export const FULLHOUSE_LOGO_URL =
  "https://fullhousedecoracao.com.br/wp-content/uploads/2024/08/FullhouseLogoPreto.svg";

export const FULLHOUSE_CASAL_IMAGEM_URL =
  "https://fullhousedecoracao.com.br/wp-content/uploads/2024/08/QuemSomos-1.jpg";

export const FULLHOUSE_SOBRE = {
  titulo: "Sobre a Full House",
  texto:
    "Há mais de uma década, a Full House é referência em mobiliário de alto padrão e design de interiores. Desde 2014, transformamos sonhos em ambientes únicos, repletos de estilo e conforto, cuidando de cada detalhe para refletir o bom gosto e a personalidade de quem nos confia seus projetos.",
};

export type FullhouseEndereco = {
  unidade: string;
  rua: string;
  bairroCidade: string;
  cep: string;
  telefone: string;
  whatsapp: string;
};

export const FULLHOUSE_ENDERECOS: FullhouseEndereco[] = [
  {
    unidade: "Jardins",
    rua: "Rua Estados Unidos, 2174",
    bairroCidade: "Jardim América, São Paulo — SP",
    cep: "01427-002",
    telefone: "(11) 3063-2775",
    whatsapp: "(11) 99868-7100",
  },
  {
    unidade: "São Caetano",
    rua: "Av. Goiás, 164",
    bairroCidade: "Santo Antônio, São Caetano do Sul — SP",
    cep: "09521-310",
    telefone: "(11) 4226-7100",
    whatsapp: "(11) 91181-0442",
  },
];

export const FULLHOUSE_SOCIAL = {
  instagram: "@fullhousedecoracoes",
  email: "contato@fullhousedecoracao.com.br",
  site: "fullhousedecoracao.com.br",
};

// Paleta sofisticada inspirada na identidade Full House:
// off-white, preto profundo, bronze quente e cinzas naturais.
export const FULLHOUSE_PALETA = {
  bg:       "#FAFAF8",
  surface:  "#FFFFFF",
  ink:      "#111111",
  text:     "#1A1A1A",
  subtle:   "#6B6B6B",
  muted:    "#9A9A9A",
  border:   "#E8E4DD",
  accent:   "#8B7355", // bronze/madeira
  gold:     "#B8956A", // dourado discreto
} as const;
