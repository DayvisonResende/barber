Você é um agente de desenvolvimento responsável por manter, evoluir e documentar continuamente um aplicativo de barbearia.

Sua principal fonte de verdade é ESTE DOCUMENTO. Antes de executar qualquer ação, você DEVE sempre ler e considerar todo o conteúdo deste documento.

## OBJETIVO DO DOCUMENTO

Este documento serve como:

* Base de conhecimento completa do sistema
* Registro contínuo de progresso
* Controle de melhorias, falhas e decisões técnicas
* Planejamento de evolução do projeto

---

## REGRAS FUNDAMENTAIS

1. SEMPRE leia este documento antes de qualquer ação
2. SEMPRE atualize este documento após qualquer ação
3. NUNCA execute mudanças sem registrar antes e depois
4. ESCREVA de forma clara, técnica e organizada
5. PRIORIZE evolução contínua e melhoria do sistema

---

## ESTRUTURA DO DOCUMENTO

### 1. VISÃO GERAL DO APP

**Objetivo:** Gerenciamento completo de barbearia, permitindo agendamentos online por clientes e controle administrativo por barbeiros/gerentes.

**Público-alvo:** Proprietários de barbearias, barbeiros e clientes finais.

**Funcionalidades principais:**
* Autenticação e Perfis (Cliente/Barbeiro/Admin).
* Agendamento de Serviços com seleção de profissional e data.
* Gestão de Agenda em tempo real (visão de staff).
* Edição dinâmica de serviços em agendamentos ativos.
* Controle financeiro (Caixa, Payouts, Vales/Adiantamentos).
* PWA (Instalável, offline cache parcial).

**Tecnologias utilizadas:**
* **Frontend:** HTML5, CSS3 (Vanilla + Tailwind CDN), JavaScript Vanilla (Pattern State Management).
* **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Realtime).
* **Ícones:** Lucide Icons.
* **Fonts:** Inter (UI) e Pristina (Branding).

---

### 2. ESTADO ATUAL DO SISTEMA

**O que já está funcionando:**
* Fluxo completo de agendamento de ponta a ponta.
* Sistema de permissões (Role-based: Client vs Barber).
* Edição de preços e durações em tempo real pelo staff.
* Branding dinâmico com suporte a fontes específicas em áreas-chave.
* **Novo Sistema de Horários:** Escala flexível baseada em slots "Ativos", suporte a almoço configurável e exceções por data.
* **Comanda Digital Avançada:** Multiplicação dinâmica de valores por quantidade e atualização de preço em tempo real na UI.
* **Recuperação de Acesso Robusta:** Verificação de identidade tolerante a máscaras (CPF/Data) via Supabase RPC.
* **Segurança Fortalecida:** Row Level Security (RLS) ativo em tabelas críticas e função de exclusão profunda (deep delete) de usuários.

**O que está incompleto:**
* Sistema de fidelidade/pontos.
* Notificações Push via navegador (configuração de permissões concluída, mas envio em massa pendente).

**O que está com problemas:**
* **Sincronização:** O sistema usa *Polling* de 15 segundos em vez de *Supabase Realtime* nativo em algumas telas.

**Performance atual:** Estável, mas `api.js` e `views.js` ultrapassaram 2.5k linhas, exigindo refatoração em breve.

---

### 3. HISTÓRICO DE AÇÕES

* **2026-04-30:**
    * **Ação:** Implementação de Segurança RLS e Exclusão Profunda.
    * **Por que:** Tabelas de produtos e categorias estavam expostas. Barbeiros com muitos registros travavam a exclusão devido a dependências.
    * **Resultado:** Ativado RLS em `products`, `categories` e `barber_services`. Criada função RPC `admin_delete_user` (V9) que limpa 12+ tabelas em cascata (incluindo `push_subscriptions`).
* **2026-04-30:**
    * **Ação:** Otimização da Comanda Digital e Preços Dinâmicos.
    * **Por que:** Usuários precisavam adicionar múltiplos itens (ex: 3 Heineken) e ver o valor total antes de confirmar.
    * **Resultado:** Adicionado suporte a `qty` no backend e lógica de multiplicação automática `valor * qty` no frontend.
* **2026-04-30:**
    * **Ação:** Correção Crítica no Fluxo de Recuperação de Senha.
    * **Por que:** Dados salvos com máscara no banco (pontos/traços) impediam o login de quem digitava apenas números.
    * **Resultado:** Implementada busca inteligente via `.in()` que testa formatos limpos e mascarados simultaneamente.
* **2026-04-20:**
    * **Ação:** Refatoração Completa do Sistema de Agendamento (Rule-based).
    * **Por que:** O sistema anterior era manual e difícil de gerenciar. Agora o barbeiro define sua escala semanal uma única vez e o sistema gera os horários.
    * **Resultado:** Implementadas tabelas `barber_config`, `barber_slots` e `barber_exceptions`. UI de gestão redesenhada com seletor de slots e suporte a almoço/exceções.

---

### 4. ESQUEMA DE DADOS (REFERÊNCIA RÁPIDA)

**Tabelas Principais (Supabase):**
* `profiles`: Usuários (id, name, phone, role, cpf, birth_date).
* `appointments`: Agendamentos (id, date, time, barber_id, client_id, status, services).
* `transactions`: Financeiro (id, barber_id, amount, payment_method, completed_at).
* `barbers`: Mapeamento de staff (id, user_id, name, status).
* `barber_config`: Escala base (barber_id, work_start, work_end, working_days).
* `barber_slots`: Slots específicos ativos/inativos.
* `push_subscriptions`: Tokens de notificação (user_id, subscription_json).
* `products` / `categories` / `services`: Cadastros base do sistema.

---

### 5. PLANEJAMENTO (PRÓXIMOS PASSOS)

* **Tarefa:** Migração de Polling para Supabase Realtime Channels.
* **Prioridade:** Alta.
* **Justificativa:** Redução de latência e consumo de servidor.

* **Tarefa:** Modularização do Código (Split `api.js` e `views.js`).
* **Prioridade:** Média.
* **Justificativa:** Melhoria na manutenibilidade e velocidade de carregamento.

---

### 6. VULNERABILIDADES E SEGURANÇA

* **Vulnerabilidade:** Lógica de negócio (Cálculos de comissão/preço) no Client-side.
* **Risco:** Médio (RLS protege o banco, mas a UI pode mostrar dados inconsistentes se manipulada).
* **Estado:** Proteção de escrita em tabelas base concluída via RLS.

---

### 7. MELHORIAS IDENTIFICADAS

* **Performance:** Implementar Lazy Loading dos componentes de UI.
* **UX:** Adicionar Skeleton Screens melhores durante o login inicial.
* **Arquitetura:** Centralizar as strings de texto para facilitar tradução futura (i18n).

---

### 8. FUNCIONALIDADES FUTURAS

* **Relatório de Produtividade do Barbeiro:** Ranking e métricas de eficiência.
* **Chat Integrado:** Comunicação direta barbeiro/cliente.
* **Sistema de Vales-Presente:** Aquisição antecipada de créditos.

---

### 9. BOAS PRÁTICAS E CUIDADOS

* NUNCA injetar texto arbitrário via `innerHTML` sem usar `App.escapeHTML()`.
* SEMPRE verificar se o `shopSettings` está carregado antes de renderizar logos.
* Manter o padrão de cores Amber-500 para interações e Zinc-900 para fundos.

---

### 10. ANÁLISE CRÍTICA DO SISTEMA

O sistema é funcional e visualmente premium, mas sofre do "Monolito de Script". A separação de preocupações entre `api.js` e `views.js` está começando a se perder.

**Gargalo futuro:** Consultas `SELECT *` sem paginação (limitar apenas agendamentos do mês/semana).

---

## COMPORTAMENTO DO AGENTE

Você deve agir como um:

* Engenheiro de software experiente
* Arquiteto de sistemas
* Analista de segurança
* Especialista em performance

---

## REGRA FINAL

Seu objetivo é tornar este aplicativo:

* MAIS SEGURO
* MAIS RÁPIDO
* MAIS ESCALÁVEL
* MAIS PROFISSIONAL
* MAIS COMPLETO

Sempre pense: "O que tornaria esse sistema MUITO melhor?"
