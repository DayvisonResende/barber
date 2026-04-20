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

**O que está incompleto:**
* Sistema de fidelidade/pontos.
* Notificações Push via navegador (atualmente apenas visual no app).

**O que está com problemas:**
* **Sincronização:** O sistema usa *Polling* de 15 segundos em vez de *Supabase Realtime* nativo em algumas telas, o que pode aumentar o consumo de banda.

**Performance atual:** Estável para baixo volume, mas os arquivos `api.js` (1.6k+ linhas) e `views.js` (2.3k+ linhas) estão ficando grandes e difíceis de manter.

**Integrações existentes:** Supabase (Auth/DB).

---

### 3. HISTÓRICO DE AÇÕES

* **2026-04-20:**
    * **Ação:** Refatoração Completa do Sistema de Agendamento (Rule-based).
    * **Por que:** O sistema anterior era manual e difícil de gerenciar. Agora o barbeiro define sua escala semanal uma única vez e o sistema gera os horários.
    * **Resultado:** Implementadas tabelas `barber_config`, `barber_slots` e `barber_exceptions`. UI de gestão redesenhada com seletor de slots e suporte a almoço/exceções.
* **2026-04-19:**
    * **Ação:** Renderização Condicional de Contatos e Redes Sociais.
    * **Por que:** Evitar que botões vazios (sem link/número) apareçam na UI da página "A Barbearia".
    * **Resultado:** Botões de WhatsApp, Telefone, Instagram, Facebook e Google Review agora só aparecem se o campo correspondente estiver preenchido no banco de dados.
* **2026-04-19:**
    * **Ação:** Refinamento do Fundo do Modal (Transparência Seletiva).
    * **Por que:** O usuário desejava manter uma leve transparência no fundo (overlay) para contexto, mas queria o modal em si 100% sólido para clareza.
    * **Resultado:** Aplicado `bg-zinc-950/60` com um leve `backdrop-blur`, garantindo foco no modal sem isolar completamente o fundo.
* **2026-04-19:**
    * **Ação:** Remoção de Transparência do Modal "Novo Agendamento".
    * **Por que:** A transparência permitia ver o conteúdo de fundo (calendário/lista), o que causava ruído visual e dificultava o foco nas opções.
    * **Resultado:** Fundo do modal tornou-se sólido, melhorando significativamente a legibilidade e o UX.
* **2026-04-19:**
    * **Ação:** Correção de Responsividade no Header (Logo).
    * **Por que:** O nome da barbearia estava quebrando/encavalando em telas de celular devido ao tamanho fixo das fontes.
    * **Resultado:** Implementado fontes responsivas (menores no mobile) e `whitespace-nowrap` para garantir alinhamento perfeito.
* **2026-04-19:**
    * **Ação:** Alinhamento de Branding (Splash e Login).
    * **Por que:** Garantir que o destaque Âmbar na palavra "Barbearia" seja consistente em todo o app.
    * **Resultado:** Telas iniciais agora usam o mesmo padrão de cores do restante do sistema.
* **2026-04-19:**
    * **Ação:** Implementação de Edição de Serviços pelo Barbeiro.
    * **Por que:** Permitir adicionar serviços extras sem precisar cancelar o agendamento original.
    * **Resultado:** Barbeiro pode alterar serviços, preços e durações instantaneamente.
* **2026-04-19:**
    * **Ação:** Refatoração do Branding (Pristina + Amber).
    * **Por que:** Desejo de identidade visual premium com fontes manuscritas.
    * **Resultado:** Logo e Sidebar dinâmicos com fonte Pristina e cores Amber.
* **2026-04-18:**
    * **Ação:** Flexibilização de Horários de Agendamento.
    * **Por que:** Barbeiros queriam autonomia para marcar serviços mesmo que o sistema estimasse falta de tempo.
    * **Resultado:** Retirado o bloqueio de agendamento por duração ("Tempo Insuficiente").

---

### 4. PLANEJAMENTO (PRÓXIMOS PASSOS)

* **Tarefa:** Migração de Polling para Supabase Realtime Channels.
* **Prioridade:** Média/Alta.
* **Justificativa:** Redução de latência e consumo de servidor.
* **Dependências:** Refatoração do `setupRealtime` no `api.js`.

* **Tarefa:** Modularização do Código (Split `api.js` e `views.js`).
* **Prioridade:** Média.
* **Justificativa:** Melhoria na manutenibilidade e velocidade de carregamento se usado com ES Modules.

---

### 5. TAREFAS NÃO CONCLUÍDAS

* **Notificações Push nativas:** Não iniciado devido à complexidade de Service Workers em sistemas iOS sem suporte total, priorizou-se notificações in-app.

---

### 6. VULNERABILIDADES E SEGURANÇA

* **Vulnerabilidade:** Lógica de negócio (Cálculos de comissão/preço) majoritariamente no Client-side.
* **Risco:** Usuários avançados podem tentar manipular o estado via console.
* **Impacto:** Médio (Supabase RLS protege o banco, mas a UI pode mostrar dados inconsistentes).
* **Plano:** Mover cálculos críticos para Database Functions (PostgreSQL Functions).

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

O sistema é funcional e visualmente premium, mas sofre do "Monolito de Script". A separação de preocupações entre `api.js` e `views.js` está começando a se perder, com lógica de banco de dados misturada com manipulação de DOM.

**Gargalo futuro:** Consultas `SELECT *` sem paginação (limitar apenas agendamentos do mês/semana).
Confira 
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

* MAIS 
SEGURO
* MAIS RÁPIDO
* MAIS ESCALÁVEL
* MAIS PROFISSIONAL
* MAIS COMPLETO

Sempre pense: "O que tornaria esse sistema MUITO melhor?"
