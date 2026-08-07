# Modelo de dados

## Estado da implementação

O esquema está versionado em `supabase/migrations`. A migração inicial cria as entidades abaixo, índices de busca e integridade, triggers de atualização e políticas de Row Level Security; uma segunda migração cobre as chaves estrangeiras com os índices recomendados pelo Performance Advisor. As duas migrações estão aplicadas ao projeto `mfuvmiyclvrkspdtbahy`. A conexão é descrita em `docs/supabase-setup.md`.

## Entidades propostas

### `profiles`

Complementa `auth.users` com nome de exibição e preferências.

### `households`

Representa uma biblioteca familiar. Campos principais: `id`, `name`, `created_by`, `created_at`.

### `household_members`

Relaciona usuários autenticados ao household e define papel, como `admin` ou `member`.

### `owners`

Proprietários selecionáveis para exemplares. Podem estar ligados a um usuário ou ser um registro coletivo, como “Casa”. Dados iniciais: Michele, Ayra, Fabio, Denise e Casa.

### `locations`

Locais físicos hierárquicos ou descritivos, por exemplo “Sala > Estante branca > Prateleira 2”.

### `works`

Dados conceituais compartilhados entre exemplares: título, subtítulo, autores, descrição, idioma e gêneros.

### `editions`

Dados de uma edição: `work_id`, ISBN-10, ISBN-13, editora, ano, edição, formato e capa.

### `copies`

Exemplar físico: `edition_id`, `household_id`, `owner_id`, `location_id`, condição, observações, data de aquisição e estado ativo/arquivado.

### `reading_statuses`

Estado de leitura de uma pessoa para uma obra: `unread`, `want_to_read`, `reading`, `read` ou `abandoned`, com datas opcionais.

### `loans`

Empréstimo de um exemplar: destinatário, contato opcional, data de saída, previsão, devolução e observações. Um empréstimo sem `returned_at` está ativo.

### `wishlist_items`

Desejos do household: título, autores, ISBN opcional, prioridade, notas e estado de compra.

## Relacionamentos essenciais

```text
household 1--N owners
household 1--N locations
work 1--N editions
edition 1--N copies
owner 1--N copies
location 1--N copies
work 1--N reading_statuses
copy 1--N loans
household 1--N wishlist_items
```

## Restrições e índices

- ISBN armazenado somente com dígitos e validado quando informado;
- índice por `household_id` em todas as consultas familiares;
- busca por título normalizado, autores e ISBN;
- no máximo um empréstimo ativo por exemplar, por índice único parcial;
- no máximo um status de leitura por pessoa e obra;
- nomes de proprietários únicos dentro do mesmo household, sem diferenciar maiúsculas;
- exclusão lógica para exemplares que possuam histórico.

## Duplicidade

Uma correspondência de ISBN no mesmo household é uma duplicidade exata de edição, mas o sistema deve permitir múltiplos exemplares após confirmação. Sem ISBN, o sistema compara título e autores normalizados e apresenta um aviso, nunca uma exclusão automática.

## Row Level Security

As políticas devem permitir leitura e escrita somente quando `auth.uid()` for membro do household relacionado. Alterações de membros e configurações ficam restritas a administradores. Buckets de capas seguem a mesma separação lógica por household.
