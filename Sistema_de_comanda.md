Quero implementar um sistema de comanda digital com controle de estoque integrado para um aplicativo de barbearia.
A stack utilizada é:
Frontend: HTML, CSS, JavaScript
Backend: Supabase (PostgreSQL + Auth + Realtime)
🎯 OBJETIVO
Criar um sistema onde:
👤 CLIENTE
Visualiza um menu de comanda organizado por categorias
Cada categoria contém cards de produtos
Pode adicionar itens à comanda
Confirmação obrigatória antes de adicionar item
Não pode remover itens após adicionar
🧑‍💼 ADMIN
Gerencia:
Categorias
Produtos
Estoque
Comandas
Pode:
Adicionar/remover itens manualmente da comanda
Integrar produtos com serviços
Controlar estoque automaticamente
🧱 MODELAGEM DO BANCO (SUPABASE)
📁 Tabela: categories
SQL
id (uuid)
name (text)
created_at (timestamp)
📁 Tabela: products
SQL
id (uuid)
name (text)
description (text)
price (numeric)
category_id (uuid)
stock (int)
image_url (text)
active (boolean)
created_at (timestamp)
📁 Tabela: commands (comandas)
SQL
id (uuid)
client_id (uuid)
status (text) -- aberta, fechada
created_at (timestamp)
📁 Tabela: command_items
SQL
id (uuid)
command_id (uuid)
product_id (uuid)
quantity (int)
price (numeric)
created_at (timestamp)
added_by_admin (boolean)
📁 Tabela: services
SQL
id (uuid)
name (text)
price (numeric)
📁 Tabela: service_items
SQL
id (uuid)
service_id (uuid)
product_id (uuid)
quantity (int)
⚙️ REGRAS DE NEGÓCIO
📌 Cliente
Ao clicar em "Adicionar":
Exibir modal:

"Essa ação não pode ser desfeita. Deseja adicionar X item(s)?"
Após confirmar:
Criar registro em command_items
Diminuir estoque automaticamente
Não pode remover item
📌 Admin
Pode:
Remover itens da comanda
Adicionar itens manualmente
Criar categorias e produtos
Pode vincular produtos a serviços
📌 Estoque
Sempre que um item for adicionado:
SQL
stock = stock - quantity
Se estoque <= 0:
Produto fica indisponível automaticamente
🎨 FRONTEND (CLIENTE)
Layout:

[CATEGORIA]
----------------------------------
| 🍺 Cerveja Heineken           |
| R$ 10,00                     |
| Descrição...                 |
| [-] 1 [+]                    |
| [Adicionar]                  |
----------------------------------
Fluxo JS (simplificado)
JavaScript
async function addItem(productId, quantity) {
  const confirmAdd = confirm(`Essa ação não pode ser desfeita. Deseja adicionar ${quantity} item(s)?`);

  if (!confirmAdd) return;

  // inserir no banco
  await supabase.from('command_items').insert({
    command_id: currentCommandId,
    product_id: productId,
    quantity: quantity
  });

  // atualizar estoque
  await supabase.rpc('decrease_stock', {
    product_id: productId,
    quantity: quantity
  });

  alert("Item adicionado com sucesso!");
}
🧑‍💻 PAINEL ADMIN
Nova seção: "Comanda"
Funcionalidades:
📦 CRUD de produtos
📂 CRUD de categorias
📉 Controle de estoque
🧾 Visualizar comandas abertas
➕ Adicionar/remover itens manualmente
🔗 Vincular produto a serviço
Exemplo visual admin:

COMANDA #123

Cliente: João

Itens:
- Cerveja x2 (R$20)
- Pomada x1 (R$15)

[+ Adicionar item]
[Remover item]

Total: R$35
🔥 DIFERENCIAL (OPCIONAL MAS PODEROSO)
Realtime com Supabase:
Quando admin adiciona item → cliente vê na hora
Bloqueio de estoque:
Evitar estoque negativo
Histórico de consumo por cliente
⚠️ PONTOS CRÍTICOS
Evitar:
Duas pessoas consumirem o mesmo estoque ao mesmo tempo
Usar:
RPC no Supabase para controle seguro
Exemplo:
SQL
create function decrease_stock(product_id uuid, quantity int)
returns void as $$
begin
  update products
  set stock = stock - quantity
  where id = product_id and stock >= quantity;
end;
$$ language plpgsql;