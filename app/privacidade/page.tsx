import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de privacidade do CRM 2G — saiba como tratamos seus dados pessoais.",
  robots: { index: true, follow: false },
};

const UPDATED_AT = "14 de maio de 2025";
const COMPANY = "CRM 2G";
const SITE = "crm2g.com";
const EMAIL_CONTATO = "contato@crm2g.com";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="border-b border-bg-border bg-bg-surface/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight text-text"
          >
            {COMPANY}
          </Link>
          <span className="text-xs text-text-muted">
            Atualizado em {UPDATED_AT}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display mb-2 text-3xl font-bold">
          Política de Privacidade
        </h1>
        <p className="mb-10 text-sm text-text-muted">
          Esta política descreve como o <strong>{COMPANY}</strong> coleta, usa e
          protege as informações dos usuários da plataforma disponível em{" "}
          <strong>{SITE}</strong>.
        </p>

        <Section title="1. Quem somos">
          <p>
            O {COMPANY} é uma plataforma de CRM (Customer Relationship
            Management) voltada para agências e profissionais de gestão de
            tráfego pago. Fornecemos ferramentas para gerenciamento de leads,
            campanhas, propostas comerciais e relatórios integrados ao Meta Ads.
          </p>
        </Section>

        <Section title="2. Dados que coletamos">
          <p>Coletamos informações necessárias para o funcionamento da plataforma:</p>
          <ul>
            <li>
              <strong>Dados de conta:</strong> nome, endereço de e-mail e senha
              (armazenada de forma criptografada) dos usuários administradores e
              clientes.
            </li>
            <li>
              <strong>Dados de leads:</strong> nome, telefone, e-mail, origem da
              campanha e histórico de interações de contatos cadastrados ou
              importados via Meta Ads.
            </li>
            <li>
              <strong>Dados de campanhas:</strong> métricas de desempenho
              (impressões, cliques, gastos, conversões) obtidas via API do Meta
              Ads.
            </li>
            <li>
              <strong>Dados de propostas:</strong> informações comerciais,
              valores, prazos e documentos inseridos pelos usuários.
            </li>
            <li>
              <strong>Dados técnicos:</strong> endereço IP, tipo de navegador,
              logs de acesso e cookies de sessão, utilizados para segurança e
              funcionamento da plataforma.
            </li>
          </ul>
        </Section>

        <Section title="3. Como usamos os dados">
          <p>Os dados coletados são utilizados exclusivamente para:</p>
          <ul>
            <li>Autenticação e controle de acesso dos usuários;</li>
            <li>
              Exibição de informações de leads, campanhas e métricas dentro da
              plataforma;
            </li>
            <li>Geração de propostas, relatórios e análises de desempenho;</li>
            <li>
              Integração com o Meta Ads para importação de leads e métricas de
              campanhas;
            </li>
            <li>
              Suporte ao cliente e melhoria contínua dos recursos da plataforma;
            </li>
            <li>Cumprimento de obrigações legais.</li>
          </ul>
          <p>
            Não vendemos, alugamos nem compartilhamos dados pessoais com
            terceiros para fins comerciais.
          </p>
        </Section>

        <Section title="4. Integrações com terceiros">
          <p>
            A plataforma se integra com os seguintes serviços externos, cada um
            com sua própria política de privacidade:
          </p>
          <ul>
            <li>
              <strong>Meta (Facebook) Ads:</strong> importação de leads via
              webhook e consulta de métricas de campanhas via API. Os dados
              transitam de acordo com os{" "}
              <a
                href="https://www.facebook.com/privacy/policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2"
              >
                Termos do Meta
              </a>
              .
            </li>
            <li>
              <strong>Supabase:</strong> banco de dados e autenticação. Os dados
              são armazenados em servidores seguros com criptografia em repouso e
              em trânsito.
            </li>
            <li>
              <strong>Anthropic (Claude AI):</strong> funcionalidades de
              inteligência artificial para análise e geração de conteúdo. Nenhum
              dado pessoal identificável é enviado sem necessidade.
            </li>
          </ul>
        </Section>

        <Section title="5. Cookies e sessão">
          <p>
            Utilizamos cookies estritamente necessários para manter a sessão
            autenticada do usuário. Não utilizamos cookies de rastreamento ou
            publicidade.
          </p>
          <p>
            Você pode configurar seu navegador para recusar cookies, porém isso
            impedirá o acesso à plataforma.
          </p>
        </Section>

        <Section title="6. Segurança dos dados">
          <p>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
          <ul>
            <li>Comunicação via HTTPS com TLS;</li>
            <li>Senhas armazenadas com hash (bcrypt) via Supabase Auth;</li>
            <li>Controle de acesso por perfis (admin e cliente);</li>
            <li>Row Level Security (RLS) no banco de dados;</li>
            <li>Chaves de API secretas armazenadas apenas no servidor.</li>
          </ul>
        </Section>

        <Section title="7. Retenção de dados">
          <p>
            Os dados são mantidos enquanto a conta estiver ativa. Após o
            encerramento, podemos reter informações pelo período exigido pela
            legislação aplicável (até 5 anos para registros fiscais e
            contratuais).
          </p>
        </Section>

        <Section title="8. Seus direitos (LGPD)">
          <p>
            De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018),
            você tem direito a:
          </p>
          <ul>
            <li>
              <strong>Acesso:</strong> solicitar cópia dos seus dados pessoais;
            </li>
            <li>
              <strong>Correção:</strong> atualizar dados incompletos ou
              desatualizados;
            </li>
            <li>
              <strong>Exclusão:</strong> solicitar a exclusão dos seus dados,
              salvo quando houver obrigação legal de retenção;
            </li>
            <li>
              <strong>Portabilidade:</strong> receber seus dados em formato
              estruturado;
            </li>
            <li>
              <strong>Revogação do consentimento:</strong> quando o tratamento
              for baseado em consentimento.
            </li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato pelo e-mail{" "}
            <a
              href={`mailto:${EMAIL_CONTATO}`}
              className="text-accent underline underline-offset-2"
            >
              {EMAIL_CONTATO}
            </a>
            .
          </p>
        </Section>

        <Section title="9. Alterações nesta política">
          <p>
            Podemos atualizar esta política periodicamente. A data de revisão é
            indicada no topo da página. Alterações relevantes serão comunicadas
            por e-mail ou por aviso na plataforma.
          </p>
        </Section>

        <Section title="10. Contato">
          <p>
            Em caso de dúvidas sobre esta política ou sobre o tratamento dos
            seus dados, entre em contato:
          </p>
          <p>
            <strong>E-mail:</strong>{" "}
            <a
              href={`mailto:${EMAIL_CONTATO}`}
              className="text-accent underline underline-offset-2"
            >
              {EMAIL_CONTATO}
            </a>
            <br />
            <strong>Site:</strong>{" "}
            <a
              href={`https://${SITE}`}
              className="text-accent underline underline-offset-2"
            >
              {SITE}
            </a>
          </p>
        </Section>
      </main>

      <footer className="border-t border-bg-border py-6 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} {COMPANY}. Todos os direitos reservados.
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display mb-3 text-xl font-semibold text-text">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-text-muted [&_a]:text-accent [&_strong]:text-text [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        {children}
      </div>
    </section>
  );
}
