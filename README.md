# Minha Biblioteca

Aplicação web responsiva para organizar a biblioteca particular de uma família. A experiência é mobile first: cadastrar, conferir e localizar um livro deve levar poucos segundos.

## Visão do produto

O sistema reunirá os livros de **Michele, Ayra, Fabio, Denise e Casa**, mantendo os proprietários dinâmicos para futuras inclusões. Cada exemplar poderá registrar sua localização física, situação de leitura e histórico de empréstimos.

O produto prevê:

- cadastro manual e cadastro rápido por ISBN/código de barras;
- cadastro por foto em uma etapa futura;
- busca por título, autor, ISBN, gênero, proprietário e localização;
- localização física do exemplar dentro de casa;
- status de leitura por pessoa: não lido, quero ler, lendo, lido ou abandonado;
- empréstimos com destinatário, data, devolução e quantidade de dias em posse;
- wishlist compartilhada;
- alerta de possível duplicidade antes de cadastrar ou comprar um livro.

## Stack prevista

- Next.js e React;
- TypeScript;
- Supabase para autenticação, PostgreSQL e armazenamento de imagens;
- aplicação web responsiva com prioridade para celular.

## Começando

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

No Windows PowerShell, use `Copy-Item .env.example .env.local` no lugar de `cp`.

As variáveis esperadas estão em `.env.example`. Nunca adicione ao repositório uma chave `service_role`, tokens ou credenciais reais.

## Estrutura

```text
src/app/                 Aplicação Next.js (App Router)
src/components/          Componentes reutilizáveis
src/services/            Integrações e regras de acesso a dados
src/types/               Tipos compartilhados
src/utils/               Funções utilitárias
public/                  Arquivos públicos
supabase/migrations/     Evolução versionada do banco
supabase/seed/           Dados iniciais de desenvolvimento
tests/                   Testes automatizados
docs/                    Produto, arquitetura e regras
```

## Documentação

- [PRD](docs/PRD.md)
- [Arquitetura](docs/architecture.md)
- [Banco de dados](docs/database.md)
- [Regras de negócio](docs/business-rules.md)
- [Histórias de usuário](docs/user-stories.md)
- [Configuração do Supabase](docs/supabase-setup.md)

## Estado do projeto

Fundação inicial do MVP, com esquema Supabase versionado e clientes SSR preparados. O backlog é acompanhado pelas Issues do GitHub.
