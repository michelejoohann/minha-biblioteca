# PRD — Minha Biblioteca

Versão 0.1

## 1. Visão

Minha Biblioteca é uma aplicação web responsiva para gerenciar a biblioteca particular de uma família. Ela deve responder rapidamente a três perguntas: “nós já temos este livro?”, “onde está o exemplar?” e “com quem ele está?”.

## 2. Público e contexto

O primeiro household é composto por Michele, Ayra, Fabio, Denise e Casa. “Casa” representa exemplares da biblioteca familiar, sem proprietário individual. A solução deverá aceitar novos proprietários sem alteração de código.

O uso principal será pelo celular, inclusive em livrarias, sebos e cômodos da casa.

## 3. Objetivos do MVP

- centralizar o catálogo familiar;
- reduzir compras duplicadas;
- cadastrar livros manualmente ou por ISBN/código de barras;
- localizar cada exemplar físico;
- acompanhar leitura individual;
- controlar empréstimos e o tempo fora de casa;
- manter uma wishlist compartilhada;
- oferecer busca e filtros rápidos em telas pequenas.

## 4. Escopo do MVP

### Acesso e família

- autenticação de usuários;
- criação de um household;
- proprietários iniciais Michele, Ayra, Fabio, Denise e Casa;
- isolamento dos dados por household.

### Catálogo

- cadastro manual de obra e exemplar;
- consulta de metadados por ISBN;
- leitura de código de barras pela câmera;
- edição e arquivamento de exemplares;
- título, subtítulo, autores, ISBN, editora, edição, ano, idioma, gêneros e capa;
- proprietário e localização física;
- detecção de ISBN já existente e aviso de possíveis duplicidades.

### Descoberta e uso

- busca textual e filtros;
- status de leitura por pessoa;
- empréstimos com data de saída, pessoa destinatária, situação e dias em posse;
- wishlist com prioridade e observações.

## 5. Fora do MVP

- cadastro automático por fotografia da capa ou lombada;
- recomendações com inteligência artificial;
- rede social, avaliações públicas ou marketplace;
- controle financeiro de compras;
- aplicativo nativo para iOS ou Android.

## 6. Requisitos não funcionais

- mobile first e responsivo;
- interface em português do Brasil;
- ações principais acessíveis com poucos toques;
- proteção dos dados por autenticação e Row Level Security;
- segredos somente em variáveis de ambiente;
- boa experiência em conexões móveis;
- acessibilidade básica: foco visível, contraste, rótulos e alvos de toque adequados.

## 7. Indicadores iniciais

- cadastro por ISBN concluído em até um minuto, sem contar falhas externas;
- resultado de busca percebido como imediato para uma biblioteca familiar;
- zero empréstimos ativos sem data de saída;
- alerta exibido sempre que o ISBN já existir no household;
- todas as entidades familiares protegidas contra acesso de outro household.

## 8. Riscos e decisões pendentes

- escolher a fonte de metadados de ISBN e sua estratégia de fallback;
- validar navegadores móveis compatíveis com leitura de código de barras;
- definir regras de convite e permissão entre adultos e crianças;
- decidir política de retenção para capas e registros arquivados.

