import frappe
from frappe.model.document import Document
import json
from decimal import Decimal, ROUND_HALF_UP

class OrdemdeCompra(Document):
    def validate(self):
        for item in self.itens_oc:
            if not item.item_oc:
                frappe.throw("Item não selecionado na linha da compra.")

            if not item.qtde_oc or item.qtde_oc <= 0:
                frappe.throw(f"Quantidade inválida no item: {item.item_oc}")

            # Busca o Item
            item_data = frappe.get_doc("Item", item.item_oc)

            # Pega os valores diretamente do Doctype Item
            valor_pago = item_data.valor_pago or 0
            valor_estoque = item_data.valor or 0

            # Atualiza os campos da linha
            item.ultimo_valor_pago = valor_pago
            item.valor_unt_oc = valor_estoque

            # Corrige cálculo do lucro
            if valor_pago > 0:
                item.lucro = ((valor_estoque - valor_pago) / valor_pago) * 100
            else:
                item.lucro = 0

            # Calcula o valor total da linha
            item.valor_total = valor_pago * item.qtde_oc

        # Soma os totais da compra
        self.calcula_total()

    def calcula_total(self):
        total = 0
        total_itens = 0

        for item in self.itens_oc:
            total += item.valor_total or 0
            total_itens += item.qtde_oc or 0

        self.valor = total
        self.valor_ordem_de_compra = total 
        self.total_itens_oc = total_itens

    def on_submit(self):
        for item in self.itens_oc:
            item_doc = frappe.get_doc("Item", item.item_oc)

            # Atualiza o estoque
            item_doc.quantidade_em_estoque = (item_doc.quantidade_em_estoque or 0) + item.qtde_oc
            item_doc.save()

            # Mostra mensagem de estoque atualizado
            frappe.msgprint(
                f"Estoque do item <b>{item_doc.name}</b> atualizado para <b>{item_doc.quantidade_em_estoque}</b> unidades."
            )

    def on_cancel(self):
        for item in self.itens_oc:
            item_doc = frappe.get_doc("Item", item.item_oc)

            estoque_atual = item_doc.quantidade_em_estoque or 0
            qtde_a_subtrair = item.qtde_oc or 0

            # Evita estoque negativo
            if estoque_atual < qtde_a_subtrair:
                frappe.throw(
                    f"Não é possível cancelar a ordem. O estoque do item <b>{item.item_oc}</b> está abaixo da quantidade da compra: {estoque_atual} disponível, {qtde_a_subtrair} na compra."
                )

            # Subtrai a quantidade
            item_doc.quantidade_em_estoque = estoque_atual - qtde_a_subtrair
            item_doc.save()

            # Mensagem de confirmação
            frappe.msgprint(
                f"Estoque do item <b>{item_doc.name}</b> reduzido para <b>{item_doc.quantidade_em_estoque}</b> unidades após o cancelamento."
            )

