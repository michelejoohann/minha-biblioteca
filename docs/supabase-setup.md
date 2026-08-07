# Configuração do Supabase

Esta etapa conecta a base local a um projeto Supabase sem versionar credenciais.

## Estado atual

- Projeto: `minha-biblioteca` (`mfuvmiyclvrkspdtbahy`)
- Região: `us-east-1`
- Migrações remotas: `initial_schema` e `add_fk_indexes`
- Segurança: nenhuma recomendação aberta no Security Advisor após a aplicação
- Ambiente local: configurado em `.env.local`, arquivo ignorado pelo Git

## 1. Criar o projeto

1. Entre em [supabase.com](https://supabase.com/) e crie uma organização, se necessário.
2. Crie um projeto chamado `minha-biblioteca` na região mais próxima dos usuários. Este projeto já foi criado para o ambiente atual.
3. Guarde a senha do banco em um gerenciador de senhas. Ela não deve entrar no GitHub.

## 2. Configurar o ambiente local

No painel do projeto, abra **Connect** e copie apenas:

- Project URL;
- Publishable key.

Copie `.env.example` para `.env.local` e preencha os dois valores:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

Não use uma chave `service_role` no navegador ou em arquivos versionados.

## 3. Aplicar o banco

O esquema versionado está em `supabase/migrations`. Depois que o Supabase CLI estiver instalado e autenticado:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

O primeiro household criado por uma pessoa autenticada recebe automaticamente:

- a pessoa criadora como administradora;
- Michele, Ayra, Fabio, Denise e Casa como proprietários;
- “Casa” marcada como propriedade coletiva.

## 4. Segurança

Todas as tabelas expostas usam Row Level Security. As políticas verificam a associação da pessoa ao household; alterações de membros e exclusões estruturais ficam restritas a administradores.

Antes de usar dados reais, validar as políticas no ambiente de desenvolvimento com duas contas pertencentes a households diferentes.
