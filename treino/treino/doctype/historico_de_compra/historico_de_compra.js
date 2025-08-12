frappe.ui.form.on('Historico de Compra', {
  async compra_ref(frm) {
    // Só puxa os dados se ainda estiver em rascunho e a tabela estiver vazia
    if (frm.doc.docstatus === 0 && frm.doc.descrição.length === 0) {
      await puxar_itens_da_compra(frm);
    }
  }
});

async function puxar_itens_da_compra(frm) {
  if (!frm.doc.compra_ref) return;

  frm.clear_table("descrição");

  await frappe.call({
    method: "frappe.client.get",
    args: {
      doctype: "Compra",
      name: frm.doc.compra_ref
    },
    callback: function (r) {
      if (r.message && r.message.itens) {
        let itens = r.message.itens;

        itens.forEach(item => {
          let linha = frm.add_child("descrição");
          linha.item = item.item;
          linha.valor_unitario = item.valor_unitario;
          linha.qtde = item.qtde;
          linha.valor_total = item.valor_total;
          linha.ultimo_valor_pago = item.valor_pago;
        });

        frm.refresh_field("descrição");
      }
    }
  });
}
