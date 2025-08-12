frappe.ui.form.on("Compra", {
    refresh: function(frm) {
        
     
        frm.add_custom_button("Novo Cliente", function() {
    let d = new frappe.ui.Dialog({
        title: 'Novo Cliente',
        fields: [
            {fieldname:"nome", fieldtype:"Data", label:"Nome do Cliente", reqd:1},
            {fieldname:"email", fieldtype:"Data", label:"Email"},
            {fieldname:"idade", fieldtype:"Data", label:"Idade"},
            {fieldname:"cliente_desde", fieldtype:"Datetime", label:"Cliente Desde"},
            {fieldname:"tipo_de_pessoa", fieldtype:"Select", options:"Fisica\nJuridica", label:"Tipo de Pessoa"},
            {fieldname:"cpf", fieldtype:"Data", label:"CPF"},
            {fieldname:"cnpj", fieldtype:"Data", label:"CNPJ"}
        ],
        primary_action_label: 'Salvar Cliente',
        primary_action(values) {
            frappe.call({
                method: "frappe.client.insert",
                args: {
                    doc: {
                        doctype: "Cliente",
                        nome: values.nome,
                        email: values.email,
                        tipo_de_pessoa: values.tipo_de_pessoa,
                        cnpj: values.cnpj,
                        cpf: values.cpf,
                        idade: values.idade,
                        cliente_desde: values.cliente_desde
                    }
                },
                callback: function(r) {
                    if (!r.exc) {
                        frappe.msgprint("Cliente criado: " + r.message.name);
                        frm.set_value("cliente", r.message.name);
                        frm.refresh_field("cliente");
                        d.hide();
                    }
                }
            });
        }
    });

    d.show();
});

      /*  frm.add_custom_button("Novo Cliente", function() {
    frappe.prompt([
        {fieldname:"nome", fieldtype:"Data", label:"Nome do Cliente", reqd:1},
        {fieldname:"email", fieldtype:"Data", label:"Email"},
        {fieldname:"idade", fieldtype:"Data", label:"idade"},
        {fieldname:"cliente_desde", fieldtype:"Datetime", label:"cliente_desde"},
        {fieldname:"tipo_de_pessoa", fieldtype:"Select", options:"Fisica\nJuridica", label:"Tipo de Pessoa"},
        {fieldname:"cpf", fieldtype:"Data", label:"CPF"},
        {fieldname:"cnpj", fieldtype:"Data", label:"CNPJ"},
    ],
    function(values) {
        frappe.call({
            method: "frappe.client.insert",
            args: {
                doc: {
                    doctype: "Cliente",
                    nome: values.nome,
                    email: values.email,
                    tipo_de_pessoa: values.tipo_de_pessoa,
                    cnpj: values.cnpj,
                    cpf: values.cpf,
                    idade: values.idade,
                    cliente_desde: values.cliente_desde
                }
            },
            callback: function(r) {
                frappe.msgprint("Cliente criado: " + r.message.name);
                frm.set_value("cliente", r.message.name);
                frm.refresh_field("cliente");
            }
        });
    },
    "Novo Cliente");
});*/

    if (frm.doc.docstatus === 1) { // Apenas se a compra estiver submetida
        frm.add_custom_button("NF", function() {
            frappe.confirm(
                'Deseja gerar a Nota Fiscal desta compra?',
                function() {
                    frappe.call({
                        method: "treino.treino.doctype.compra.compra.gerar_nf",
                        args: {
                            compra_nome: frm.doc.name
                        },
                        callback: function(r) {
                            if (!r.exc) {
                                frappe.msgprint("Nota Fiscal gerada com sucesso!");
                                frappe.set_route("Form", "Nota Fiscal", r.message);
                            }
                        }
                    });
                },
                function() {
                    frappe.msgprint("Ação cancelada.");
                }
            );
        });
    }
},

    async validate(frm) {
        await verificaEstoque(frm);
        atualizarResultado(frm);
        facaAte(frm.doc.valor_total, frm);
        reverse(frm.doc.itens);
        relatorio(frm.doc.itens);
        calcularValorParcela(frm);

        const lista = frm.doc.itens.map(item => item.valor_total || 0);
        acheOsExtremos(lista, frm);
        const valorMeio = acheOItemDoMeio(lista);
        console.log("Valor do meio:", valorMeio);
        somaValorDinamica(frm);
    },

    before_save(frm) {
        apiParaTabelas(frm.doc.itens, frm);
    },

    async on_submit(frm) {
        const ItemFrappe = classeItem();
        const itens = frm.doc.itens || [];

        for (let i of itens) {
            const item_doc = await frappe.db.get_doc("Item", i.item);
            const item = new ItemFrappe(
                item_doc.name,
                item_doc.descricao || item_doc.item_name,
                item_doc.preco_unitario || 0,
                item_doc.quantidade_em_estoque || 0
            );


            await item.reduzirEstoque(i.quantidade);
        }
    },

    async after_cancel(frm) {
        const ItemFrappe = classeItem();
        const itens = frm.doc.itens || [];

        for (let i of itens) {
            const item_doc = await frappe.db.get_doc("Item", i.item);
            const item = new ItemFrappe(
                item_doc.name,
                item_doc.descricao || item_doc.item_name,
                item_doc.preco_unitario || 0,
                item_doc.quantidade_em_estoque || 0
            );

            await item.aumentarEstoque(i.quantidade);
        }
    },

    onload(frm) {
            // Escuta o evento em tempo real
    frappe.realtime.on("nf_gerada", (data) => {
        frappe.show_alert({
            message: `NF ${data.nf} criada para ${data.cliente} - R$ ${data.valor_total}`,
            indicator: 'green'
        }, 5); // 5 segundos
        console.log("Evento recebido:", data);
    });
        if(frm.doc.name === "COMPRA-0025"){
            frappe.db.set_value("Compra", "COMPRA-0025", {
                linha_a: 1,
                linha_b: 2
            }).then(() => {
                console.log("Campos atualizados com sucesso!");
            });
        }
        atualizarResultado(frm);
    },

    valor_a(frm) {
        atualizarResultado(frm);
    },

    valor_b(frm) {
        atualizarResultado(frm);
    },

     parcelas(frm) {
        calcularValorParcela(frm);
        gerar_parcelas(frm);  // se quiser chamar ambos
    },

    valor_total(frm) {
        calcularValorParcela(frm);
        gerar_parcelas(frm);  // se quiser chamar ambos
    },


    historico(frm) {
        if (!frm.doc.cliente) {
            frappe.msgprint("Selecione um cliente antes de abrir o histórico.");
            return;
        }

        frappe.call({
            method: "treino.treino.doctype.compra.compra.abrir_historico_de_compra",
            args: { cliente: frm.doc.cliente },
            callback: function (r) {
                if (r.message) {
                    window.location.href = r.message;
                } else {
                    frappe.msgprint("Não foi possível abrir o Histórico.");
                }
            }
        });
    },



    async cliente(frm) {
        if (frm.doc.cliente) {
            const cliente = await frappe.db.get_doc('Cliente', frm.doc.cliente);
            let doc_value = '';

            if (cliente.tipo_de_pessoa === 'Fisica') {
                doc_value = cliente.cpf;
            } else if (cliente.tipo_de_pessoa === 'Juridica') {
                doc_value = cliente.cnpj;
            }

            frm.set_value('documento', doc_value);
            frm.set_df_property('documento', 'hidden', false);
            frm.refresh_field('documento');
        } else {
            frm.set_value('documento', '');
            frm.set_df_property('documento', 'hidden', false);
            frm.refresh_field('documento');
        }
    },
 });

function calcularValorParcela(frm) {
    const total = parseFloat(frm.doc.valor_total) || 0;
    const parcelas = parseInt(frm.doc.parcelas) || 1;

    let valor_parcela = 0;

    if (parcelas === 1) {
        valor_parcela = total; // valor total direto
    } else if (parcelas > 1) {
        valor_parcela = total / parcelas;
    }

    frm.set_value("valor_parcela", valor_parcela);
    frm.refresh_field("valor_parcela");
}




frappe.ui.form.on("compra_itens", {
    itens_add(frm, cdt, cdn) {
        const linha = locals[cdt][cdn];
        frm.doc.total_de_itens += linha.quantidade;
        frm.refresh_field("total_de_itens");
        calculaTotal(frm);
    },

    itens_remove(frm, cdt, cdn) {
        const linha = locals[cdt][cdn];
        frm.doc.total_de_itens -= linha.quantidade;
        frm.refresh_field("total_de_itens");
        calculaTotal(frm);
    },

    valor_unitario(frm, cdt, cdn) {
        const linha = locals[cdt][cdn];
        if (linha.quantidade != 0) {
            linha.valor_total = linha.valor_unitario * linha.quantidade;
            frm.refresh_field("itens");
            calculaTotal(frm);
        }
    },

    quantidade(frm, cdt, cdn) {
        const linha = locals[cdt][cdn];
        linha.valor_total = linha.valor_unitario * linha.quantidade;
        frm.refresh_field("itens");
        calculaTotal(frm);
    },

    valor_total(frm, cdt, cdn) {
        const linha = locals[cdt][cdn];
        if (linha.quantidade != 0) {
            linha.valor_unitario = linha.valor_total / linha.quantidade;
            frm.refresh_field("itens");
            calculaTotal(frm);
        }
    }, 
});

const calculaTotal = (frm) => {
    let valor_total = 0;
    let total_de_itens = 0;
    const itens = frm.doc.itens || [];

    for (let item of itens) {
        valor_total += item.valor_total || 0;
        total_de_itens += item.quantidade || 0;
    }

    frm.doc.valor_total = valor_total;
    frm.doc.total_de_itens = total_de_itens;
    frm.refresh_field("valor_total");
    frm.refresh_field("total_de_itens");
};

const verificaEstoque = async (frm) => {
    const itens = frm.doc.itens || [];
    for (let item of itens) {
        const item_doc = await frappe.db.get_doc('Item', item.item);
        if (item.quantidade > item_doc.quantidade_em_estoque) {
            frappe.throw(`O item "${item.item}" possui apenas ${item_doc.quantidade_em_estoque} unidades em estoque`);
        }
    }
};

const descontaEstoque = async (frm) => {
    const itens = frm.doc.itens || [];
    for (let item of itens) {
        const item_doc = await frappe.db.get_doc('Item', item.item);
        const nova_quantidade = item_doc.quantidade_em_estoque - item.quantidade;
        await frappe.db.set_value('Item', item.item, 'quantidade_em_estoque', nova_quantidade);
    }

    frappe.show_alert({
        message: 'Estoque atualizado!',
        indicator: 'green'
    }, 5);
};

const estornarEstoque = async (frm) => {
    const itens = frm.doc.itens || [];
    for (let item of itens) {
        const item_doc = await frappe.db.get_doc('Item', item.item);
        let nova_quantidade = item_doc.quantidade_em_estoque + item.quantidade;
        await frappe.db.set_value('Item', item.item, 'quantidade_em_estoque', nova_quantidade);
    }

    frappe.show_alert({
        message: 'Itens estornados ao estoque!',
        indicator: 'green'
    }, 5);
};

function somaNumero(a, b) {
    return (parseFloat(a) || 0) + (parseFloat(b) || 0);
}

function atualizarResultado(frm) {
    if (frm.doc.docstatus === 1) {
        console.log("Documento submetido. Não é permitido alterar o campo 'resultado'.");
        return;
    }

    const a = frm.doc.valor_a;
    const b = frm.doc.valor_b;

    const resultado = somaNumero(a, b);

    frm.set_value("resultado", resultado);
}

function facaAte(numero, frm) {
    let i = 0;
    let resultado = 0;
    while (i < numero) {
        resultado = (frm.doc.valor_total || 0) * 2;
        i++;
    }
    console.log("Resultado do facaAte:", resultado);
}

function reverse(lista) {
    const itens = lista || [];
    for (let i = itens.length - 1; i >= 0; i--) {
        console.log("Valor total da compra:", itens[i].valor_total);
    }
}

const relatorio = (lista) => {
    let texto = `Você comprou ${lista.length} itens:\n`;
    lista.forEach(item => {
        texto += `O item ${item.item} custou R$ ${item.valor_total}\n`;
    });
    texto += `O total da sua compra foi R$ ${lista.reduce((acc, item) => acc + (item.resultado || 0), 0)}\n`;
    console.log(texto);
}

const acheOsExtremos = (list, frm) => {
    if (!list || list.length === 0) {
        frappe.msgprint("A lista está vazia.");
        return;
    }

    const maior = Math.max(...list);
    const menor = Math.min(...list);
    frm.set_value("valor_min", menor);
    frm.set_value("valor_max", maior);
};

const acheOItemDoMeio = (lista) => {
    const meio = Math.floor(lista.length / 2);
    const ordenada = [...lista].sort((a, b) => a - b);

    return lista.length % 2 !== 0
        ? ordenada[meio]
        : (ordenada[meio - 1] + ordenada[meio]) / 2;
};

const somaValorDinamica = (frm) => {
    const lista = frm.doc.itens || [];
    const linhaA = parseInt(frm.doc.linha_a) -1;
    const linhaB = parseInt(frm.doc.linha_b) -1;

    if (isNaN(linhaA) || isNaN(linhaB) || !lista[linhaA] || !lista[linhaB]) return;

    const itemA = lista[linhaA];
    const itemB = lista[linhaB];

    const valorA = (parseFloat(itemA.valor_unitario) || 0) * (parseFloat(itemA.quantidade) || 0);
    const valorB = (parseFloat(itemB.valor_unitario) || 0) * (parseFloat(itemB.quantidade) || 0);
    const total = valorA + valorB;

    console.log(`Soma dinâmica: linha ${linhaA} = ${valorA}, linha ${linhaB} = ${valorB}, total = ${total}`);

    itemA.valor_total = total;
    itemB.valor_total = total;

    frm.refresh_field("itens");
};

const transformaLista = (lista) => {
    const objeto = {};
    (lista || []).forEach(item => {
        if (item.item) {
            objeto[item.item] = item;
        }
    });
    return objeto;
};

const ITENS = [
    {
        item: "ITEM0001",
        valor_unitario: 10,
        quantidade: 2
    },
    {
        item: "ITEM0002",
        valor_unitario: 10,
        quantidade: 1
    }
];

const resultado = transformaLista(ITENS);
console.log(resultado);

const apiParaTabelas = (lista, frm) => {
    const Tabela = class {
        constructor(lista) {
            this.lista = lista;
        }

        printeTamanho = () => {
            console.log(`Quantidade de Itens: ${this.lista.length}`);
        }

        someOsTotais = () => {
            const total = this.lista.reduce((soma, item) => soma + (item.valor_total || 0), 0);
            console.log(`Soma dos totais: ${total}`);
            frm.set_value('resultado', total);
            frm.refresh_field('resultado');
        }

        pegueUltimaLinha = () => {
            const ultima = this.lista[this.lista.length - 1];
            console.log('Última linha:', ultima);
        }
    }

    const tabela = new Tabela(lista);
    tabela.printeTamanho();
    tabela.someOsTotais();
    tabela.pegueUltimaLinha();
};

const classeItem = () => {
    class ItemFrappe {
        constructor(name, descricao, preco_unitario, quantidade_em_estoque) {
            this.name = name;
            this.descricao = descricao;
            this.preco_unitario = preco_unitario;
            this.quantidade_em_estoque = quantidade_em_estoque;
        }

        mostrarEstoque() {
            console.log(`Estoque do item ${this.name}: ${this.quantidade_em_estoque}`);
        }

        async aumentarEstoque(valor) {
            this.quantidade_em_estoque += valor;
            await frappe.db.set_value("Item", this.name, "quantidade_em_estoque", this.quantidade_em_estoque);
            frappe.msgprint(`Estoque aumentado : ${this.quantidade_em_estoque}`);
        }

        async reduzirEstoque(valor) {
            if (valor > this.quantidade_em_estoque) {
                frappe.msgprint(`Estoque insuficiente para o item ${this.name}`);
                return;
            }
            this.quantidade_em_estoque -= valor;
            await frappe.db.set_value("Item", this.name, "quantidade_em_estoque", this.quantidade_em_estoque);
            frappe.msgprint(`Estoque reduzido: ${this.quantidade_em_estoque}`);
        }

        async alterarPreco(novoPreco) {
            this.preco_unitario = novoPreco;
            await frappe.db.set_value("Item", this.name, "preco_unitario", novoPreco);
            frappe.msgprint(`Preço atualizado para : ${novoPreco}`);
        }

        async alterarDescricao(novaDescricao) {
            this.descricao = novaDescricao;
            await frappe.db.set_value("Item", this.name, "descricao", novaDescricao);
            frappe.msgprint(`Descrição atualizada para: ${novaDescricao}`);
        }
    }
    return ItemFrappe;
};
