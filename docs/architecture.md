# Arquitetura

## Visão geral

A primeira versão será um monólito web em Next.js, hospedável em uma plataforma compatível, com Supabase como backend gerenciado.

```text
Navegador mobile/desktop
        |
        v
Next.js (App Router + React + TypeScript)
        |
        +--> Supabase Auth
        +--> PostgreSQL + Row Level Security
        +--> Storage para capas e fotos futuras
        +--> Provedor externo de metadados por ISBN
```

## Camadas

- `src/app`: rotas, layouts, páginas e ações no servidor;
- `src/components`: interface reutilizável e acessível;
- `src/services`: clientes do Supabase, ISBN e operações de domínio;
- `src/types`: contratos de domínio e tipos gerados do banco;
- `src/utils`: normalização, datas e utilitários sem estado;
- `supabase/migrations`: esquema, funções, índices e políticas RLS;
- `tests`: testes unitários, de integração e de fluxos críticos.

## Fronteiras de segurança

- autenticação gerenciada pelo Supabase Auth;
- toda tabela familiar recebe `household_id` direta ou indiretamente;
- políticas RLS garantem que o usuário pertença ao household;
- operações administrativas e chaves privilegiadas nunca são executadas no navegador;
- chaves públicas ficam em variáveis `NEXT_PUBLIC_*`; a chave `service_role` não entra no repositório nem no bundle do cliente.

## Estratégia de dados

Separar **obra** de **exemplar** permite registrar dois exemplares do mesmo livro com proprietários, edições, localizações e empréstimos diferentes. ISBN identifica uma edição quando disponível, mas não é obrigatório para cadastros manuais.

Os status de leitura pertencem a uma pessoa e a uma obra. Empréstimos pertencem a um exemplar físico. A wishlist pertence ao household e pode referenciar uma obra ainda não cadastrada.

## Integrações

O serviço de ISBN é encapsulado pela interface interna `BookMetadataProvider`. A
primeira implementação usa a Search API da Open Library, com cache por 24 horas,
adequada ao volume baixo de uma biblioteca familiar. Isso permite trocar o
fornecedor ou combinar múltiplas fontes sem alterar as telas. Respostas externas
são validadas e normalizadas antes da persistência; se o provedor não responder,
o cadastro manual continua disponível.

## Scanner de código de barras

O scanner usa `MediaDevices.getUserMedia` somente depois do toque em **Usar a
câmera**. Os quadros são processados localmente no navegador por um leitor EAN-13
especializado em ISBN; nenhuma foto é enviada ou armazenada. Depois da leitura,
o código segue para o mesmo serviço de validação e consulta por ISBN.

O fluxo de câmera é suportado nas duas versões estáveis mais recentes do Chrome
e Edge no Android e do Safari no iOS, sempre em HTTPS. A digitação manual permanece
disponível em qualquer navegador quando não houver câmera, a permissão for negada
ou a leitura não funcionar.

## Evolução

Após o MVP, a arquitetura poderá incorporar processamento assíncrono de imagens para cadastro por foto, cache de metadados e observabilidade. Essas extensões não são pré-requisitos para a primeira entrega.

