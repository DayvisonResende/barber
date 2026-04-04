# Segurança em Apps Serverless com Supabase

Ao construir uma aplicação frontend pura (HTML, CSS, JS) conectada diretamente ao Supabase, a arquitetura é chamada de **Serverless** (ou cliente-servidor direto, sem um backend intermediário). Isso traz muita agilidade, mas muda a forma como pensamos sobre segurança.

A regra de ouro é: **nunca confie no cliente**. Como todo o código fonte (incluindo as chaves do Supabase) fica acessível no navegador, qualquer usuário pode abrir o console e tentar enviar dados manipulados diretamente para o seu banco.

Aqui estão os pontos mais importantes para garantir a segurança do FinnoTratoBarber:

## 1. Row Level Security (RLS) - O Coração da Segurança

Como a sua `URL` e a `anon_key` ficam expostas no código JavaScript, o Supabase precisa de uma forma de saber "quem pode ler ou escrever o quê". É aqui que entra o **Row Level Security (RLS)** do PostgreSQL.

O RLS permite criar políticas de segurança linha a linha no banco de dados.

*   **Regra de leitura (SELECT):** Um cliente (`role: client`) só deve conseguir ler os `agendamentos` onde o `user_id` seja o dele. O barbeiro (`role: barber`) pode ler todos.
*   **Regra de escrita (INSERT/UPDATE):** Um cliente só pode agendar um horário para si mesmo (o sistema bloqueia se ele tentar passar o ID de outro usuário).
*   **Nunca desative o RLS:** Se você desativar o RLS em uma tabela e usar a `anon_key` no frontend, **qualquer pessoa no mundo poderá apagar, ler ou editar todos os dados dessa tabela.**

Exemplo de Política (Policy) no Supabase:
> *"Permitir que usuários autenticados vejam apenas seus próprios agendamentos"*
> `auth.uid() = user_id`

### 🔧 Resolvendo Bloqueios RLS no FinnoTrato (Como configurar a tabela Barbers)

Sempre que no console aparecer `403 Forbidden` ou um `Status 204 com 0 linhas afetadas`, isso é 100% o RLS te protegendo e bloqueando a ação.
Para a nossa Automação da aba de **Contas** e a lixeira de exclusão funcionarem, você vai criar as seguintes regras no painel do Supabase:

1. Acesse https://supabase.com/dashboard/ e abra o projeto do FinnoTratoBarber.
2. Na barra lateral esquerda selecione **Authentication** (ou clique na engrenagem) e vá em **Policies** (Políticas RLS).
3. Desça até a tabela `barbers` (onde ocorreu os nossos bloqueios) e clique no botão **New Policy**.
4. Selecione a opção "*Create a policy from scratch*" (Criar do zero).

#### Regra A: Permitir a Inserção de Barbeiros (INSERT)
- **Policy Name:** Permite Admin inserir novos barbeiros
- **Allowed Operation:** `INSERT`
- **Target Roles:** `authenticated`
- **WITH CHECK expression:** Vá em frente e digite literalmente a palavra `true`. (Em um sistema robusto você digita a regra do admin, mas como é pra vc aprovar os testes agora pode liberar pra usuários validados no auth).
- Salve a Policy.

#### Regra B: Permitir Excluir Barbeiros (DELETE)
- Clique novamente em **New Policy** na `barbers`.
- **Policy Name:** Permite deletar barbeiros do sistema
- **Allowed Operation:** `DELETE`
- **Target Roles:** `authenticated`
- **USING expression:** `true`.
- Salve.

Após criar essas duas Policies para o INSERT e o DELETE da `barbers`, retorne ao aplicativo de testes. Pode usar o painel Contas e apagar agendamentos sem nunca mais esbarrar na parede do RLS!

## 2. A Diferença entre Chaves (`anon_key` vs `service_role_key`)

O Supabase fornece duas chaves principais na criação do projeto:

*   🟢 **`anon_key` (Chave Anônima/Pública):** É a chave que você vai colocar no seu `script.js`. Ela é feita para ser pública ou embutida no frontend. O poder dela é limitado pelas regras do RLS. Se o usuário não estiver logado, ele é considerado "anônimo".
*   🔴 **`service_role_key` (Chave de Serviço/Admin):** **NUNCA DEVE IR PARA O FRONTEND.** Essa chave ignora todas as regras de segurança (RLS) e tem poder absoluto sobre o banco de dados. Se alguém pegar essa chave, pode deletar tudo. Ela só deve ser usada em ambientes fechados (como um servidor backend próprio ou em Edge Functions).

## 3. Autenticação Segura e Gerenciamento de Sessão

*   Use o sistema de autenticação oficial do Supabase (`supabase.auth`).
*   Ele guarda os tokens de sessão com segurança (usando localStorage ou cookies seguros).
*   Sempre valide nos componentes da interface se o usuário atual (`supabase.auth.getUser()`) tem permissão para acessar a tela em questão (ex: o Barbeiro tentando acessar configurações exclusivas de admin).
*   Lembre-se: ocultar um botão com CSS/JS (`display: none`) não é segurança. O RLS é o que garante que, se o cara tentar fazer a ação via código, ele será bloqueado.

## 4. Validação e Restrições (Constraints) no Banco de Dados

Mesmo com um front-end bem feito que não deixa o usuário selecionar datas no passado, alguém pode forçar uma requisição com uma data retroativa pelo console do navegador.

Para evitar isso, você deve usar restrições no banco:
*   Não confie na validação apenas do JavaScript (frontend).
*   Crie "Constraints" nas colunas do PostgreSQL. Por exemplo, na tabela de `agendamentos`, crie uma regra do tipo `CHECK (data_agendamento >= CURRENT_DATE)`. Assim, mesmo que o usuário passe pela interface, o banco de dados recusa a inserção.
*   Garante que campos obrigatórios (como serviço escolhido, valor, etc) estejam com `NOT NULL`.

## 5. Proteção de Dados Pessoais

*   Não armazene senhas em plain-text (o Supabase Auth já cuida disso para você).
*   Se os usuários enviarem informações sensíveis (como telefone, endereço), garanta que a política RLS restringe extremamente quem pode ler os dados da tabela de `profiles` ou `usuarios`.

---

**Resumo da Ópera:** Construa a interface (HTML/CSS/JS) imaginando que um hacker está usando seu app com o console de desenvolvedor aberto. Deixe o JavaScript cuidar da beleza e da fluidez, e jogue toda a responsabilidade de "dizer o que pode ou não pode fazer" para o **RLS do Supabase**.
