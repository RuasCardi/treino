// Copyright (c) 2025, Adolfo and contributors
// For license information, please see license.txt



function formatarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatarRG(rg) {
    rg = rg.replace(/\D/g, '');
    return rg.replace(/^(\d{2})(\d{3})(\d{3})(\d{1})$/, "$1.$2.$3-$4");
}


frappe.ui.form.on("Cliente", {
    refresh: function(frm) {
        toggle_fields(frm);

        // Adiciona botão e define ação no clique
        frm.add_custom_button(__('historico'), function() {
            // Vai para a lista do doctype "Historico", filtrando pelo cliente atual
            frappe.set_route('List', 'historico_de_compra', {
                cliente: frm.doc.name
            });
        });
    },

    tipo_de_pessoa: function(frm) {
        toggle_fields(frm);
    },

    cnpj: function(frm) {
        if (frm.doc.cnpj) { 
        frm.set_value("cnpj", formatarCNPJ(frm.doc.cnpj));
        }

    },

    cpf: function(frm) {
        if (frm.doc.cpf) {
            
            frm.set_value("cpf", formatarCPF(frm.doc.cpf));

        }
    },

    rg: function(frm) {
        if (frm.doc.rg) {
            frm.set_value("rg", formatarRG(frm.doc.rg));
        }
    }

    
});


function toggle_fields(frm) {
    
    if (frm.doc.tipo_de_pessoa === "Fisica") {
       
        frm.set_df_property("cpf", "hidden", 0);
        frm.set_df_property("rg", "hidden", 0);
        frm.set_df_property("cnpj", "hidden", 1);
    } else if (frm.doc.tipo_de_pessoa === "Juridica") {
        
        frm.set_df_property("cpf", "hidden", 1);
        frm.set_df_property("rg", "hidden", 1);
        frm.set_df_property("cnpj", "hidden", 0);
    } else {
        frm.set_df_property("cpf", "hidden", 1);
        frm.set_df_property("rg", "hidden", 1);
        frm.set_df_property("cnpj", "hidden", 1);
    }

    frm.refresh_fields(["cpf", "rg", "cnpj"]);
}


