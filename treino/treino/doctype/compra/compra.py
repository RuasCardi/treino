import frappe
from frappe.model.document import Document

class Compra(Document):
    def on_submit(self):
        historico = frappe.new_doc("Historico de Compra")
        historico.cliente = self.cliente
        
        historico.data_da_compra = self.data_da_compra
        historico.valor_total = self.valor_total
        historico.total_itens = self.total_de_itens
        historico.insert(ignore_permissions=True)
        historico.submit() 

@frappe.whitelist()
def abrir_historico_de_compra(cliente):
    if not cliente:
        frappe.throw("Cliente não informado.")
    url = f"/app/historico-de-compra?cliente={cliente}"
    return url

@frappe.whitelist()
def gerar_nf(compra_nome):
    compra = frappe.get_doc("Compra", compra_nome)

    nf = frappe.new_doc("Nota Fiscal")
    nf.update({
        "cliente": compra.cliente,
        
        "compra_ref": compra.name,
        "documento": compra.documento,
        "data_da_compra": compra.data_da_compra,
        "valor_total": compra.valor_total,
        "total_de_itens": compra.total_de_itens,
        "parcelas": compra.parcelas,
        "valor_parcela": compra.valor_parcela,
        "tabela_itens": compra.itens,
    })
    nf.insert(ignore_permissions=True)
    nf.submit()

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
