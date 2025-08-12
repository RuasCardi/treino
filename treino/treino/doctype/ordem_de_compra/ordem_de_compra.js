function atualizarValores(frm, cdt, cdn) {
    let item = locals[cdt][cdn];

    if (item.item_oc) {
        frappe.db.get_doc("Item", item.item_oc).then(doc => {
            let valor_pago = doc.valor_pago || 0;
            let valor_estoque = doc.valor_de_estoque || 0;
            let qtde = item.qtde_oc || 0;

            frappe.model.set_value(cdt, cdn, "ultimo_valor_pago", valor_pago);
            frappe.model.set_value(cdt, cdn, "valor_unt_oc", valor_estoque);

            let lucro = 0;
            if (valor_pago > 0) {
                lucro = ((valor_estoque - valor_pago) / valor_pago) * 100;
            }
            frappe.model.set_value(cdt, cdn, "lucro", lucro);

            let total = valor_pago * qtde;
            frappe.model.set_value(cdt, cdn, "valor_total_oc", total);
        });
    } else {
        // Se não tiver item, limpa os campos relacionados
        frappe.model.set_value(cdt, cdn, "ultimo_valor_pago", 0);
        frappe.model.set_value(cdt, cdn, "valor_unt_oc", 0);
        frappe.model.set_value(cdt, cdn, "lucro", 0);
        frappe.model.set_value(cdt, cdn, "valor_total_oc", 0);
    }
}

frappe.ui.form.on("item_ordem_de_compra", {
    item_oc: function(frm, cdt, cdn) {
        atualizarValores(frm, cdt, cdn);
    },
    qtde_oc: function(frm, cdt, cdn) {
        atualizarValores(frm, cdt, cdn);
    }
});

