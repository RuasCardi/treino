
function formatarCNPJ(cnpj) {
    if (!cnpj) return '';
    cnpj = cnpj.toString().replace(/\D/g, '');
    if (cnpj.length !== 14) return cnpj;
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

frappe.ui.form.on("Fornecedor", {
    
    cnpj_fornecedor: function(frm) {
        if (frm.doc.cnpj_fornecedor) {
            const formatado = formatarCNPJ(frm.doc.cnpj_fornecedor);
            frm.set_value("cnpj_fornecedor", formatado);
        }
    },

    
    onload: function(frm) {
        if (frm.doc.cnpj_fornecedor) {
            const formatado = formatarCNPJ(frm.doc.cnpj_fornecedor);
            frm.set_value("cnpj_fornecedor", formatado);
        }
    },

    // Busca dados do endereço via CEP
    cep: function(frm) {
        if (frm.doc.cep && frm.doc.cep.length === 8) {
            fetch(`https://viacep.com.br/ws/${frm.doc.cep}/json/`)
                .then(response => response.json())
                .then(data => {
                    if (data.erro) {
                        frappe.msgprint("CEP não encontrado.");
                        return;
                    }

                    frm.set_value("endereco", `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
                })
                .catch(() => {
                    frappe.msgprint("Erro ao consultar o CEP.");
                });
        }
    }
});

