# Regras de negócio

## Biblioteca e proprietários

1. Todo exemplar pertence a exatamente um household e um proprietário ativo.
2. Os proprietários iniciais são Michele, Ayra, Fabio, Denise e Casa.
3. “Casa” indica propriedade coletiva, não uma conta de usuário.
4. Um proprietário com exemplares vinculados deve ser desativado, não apagado.

## Catálogo e duplicidade

5. ISBN é opcional no cadastro manual e normalizado para conter apenas dígitos.
6. Antes de salvar ou incluir na wishlist, o sistema procura o ISBN no catálogo e na wishlist do household.
7. Encontrar o mesmo ISBN gera aviso explícito, mas não impede registrar um segundo exemplar.
8. Sem ISBN, título e autor normalizados geram uma sugestão de possível duplicidade.
9. Obra, edição e exemplar são conceitos distintos; dois exemplares podem compartilhar a mesma edição.

## Localização

10. Todo exemplar disponível deve ter uma localização física.
11. Durante um empréstimo, a localização cadastrada continua representando o lugar de devolução.

## Leitura

12. O status de leitura é individual por pessoa e obra, não por exemplar.
13. Os estados permitidos são não lido, quero ler, lendo, lido e abandonado.
14. Marcar como lido pode registrar a data de conclusão; releituras ficam para evolução posterior.

## Empréstimos

15. Um exemplar só pode ter um empréstimo ativo por vez.
16. O empréstimo exige destinatário e data de saída.
17. “Dias em posse” é a diferença entre a data de saída e hoje; após devolução, usa a data de devolução.
18. Devolver um livro encerra o empréstimo sem apagar o histórico.
19. Exemplares emprestados aparecem claramente nos resultados de busca e na detecção de duplicidade.

## Wishlist

20. Um item pode ser criado sem ISBN.
21. Ao adquirir um item, o fluxo deve oferecer a criação do exemplar e marcar o desejo como comprado.
22. Um livro já existente pode permanecer na wishlist somente após confirmação consciente.

## Segurança

23. Pessoas só acessam households dos quais sejam membros.
24. Segredos, tokens e chaves privilegiadas não podem ser enviados ao navegador nem versionados.

