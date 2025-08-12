# Copyright (c) 2025, Adolfo and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document

class Compra(Document):
    pass


@frappe.whitelist()
def abrir_historico_de_compra(cliente):
    if not cliente:
        frappe.throw("Cliente não informado.")

    url = f"/app/historico-de-compra?cliente={cliente}"
    return url


import frappe

@frappe.whitelist()
def gerar_nf(compra_nome):
    compra = frappe.get_doc("Compra", compra_nome)

    nf = frappe.new_doc("Nota Fiscal")
    nf.update({
        "cliente": compra.cliente,
        "data_da_compra": compra.data_da_compra,
        "valor_total": compra.valor_total,
        "total_de_itens": compra.total_de_itens,
        "parcelas": compra.parcelas,
        "valor_parcela": compra.valor_parcela,
        "tabela_itens": compra.itens,
    })
    nf.insert(ignore_permissions=True)
    nf.submit()

    # Dispara evento para o usuário atual
    frappe.publish_realtime(
        event="nf_gerada",
        message={
            "nf": nf.name,
            "cliente": compra.cliente,
            "valor_total": compra.valor_total
        },
        user=frappe.session.user
    )

    return nf.name

