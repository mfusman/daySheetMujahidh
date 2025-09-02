// Copyright (c) 2025, Mohammed Fauz Usman and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Purchase Document", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Purchase Document", {
    refresh: function(frm) {
        // Recalculate whenever form loads
        calculate_item_costs(frm);
    },
    additional_cost: function(frm) {
        // Recalculate when additional cost changes
        calculate_item_costs(frm);
    }
});

function calculate_quantity(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    if (!row.uom_box) {
            row.qty = row.loose;
            row.box = 0;
            frm.refresh_field("purchase_item");
        return;
    }

    // Fetch conversion factor from UOM Doctype
    frappe.db.get_value("UOM", row.uom_box, "conversion_factor", (r) => {
        if (r && r.conversion_factor) {
            let factor = r.conversion_factor;
            let boxes_qty = (row.box || 0) * factor;
            let loose = row.loose || 0;

            row.qty = boxes_qty + loose;
            row.amount = (row.qty || 0) * (row.cost || 0);
            frm.refresh_field("purchase_item");  // refresh grid
            calculate_item_costs(frm, cdt, cdn);
        }
    });

    // (async () => {
    // let r = await frappe.db.get_value("UOM", row.uom_box, "conversion_factor");
    // if (r && r.message && r.message.conversion_factor) {
    //     let factor = r.message.conversion_factor;
    //     let boxes_qty = (row.box || 0) * factor;
    //     let loose = row.loose || 0;

    //     row.qty = boxes_qty + loose;
    //     row.amount = (row.qty || 0) * (row.cost || 0);

    //     frm.refresh_field("purchase_item");
    // }
    // })();
};


frappe.ui.form.on("Purchase Item", {
    qty: function(frm, cdt, cdn) {
//        frappe.msgprint("Hi qty");
        let row = locals[cdt][cdn];
        if ( row.uom != null ){
        frappe.db.get_value("UOM", row.uom, "must_be_whole_number", (r) => {
            if (r.must_be_whole_number && !Number.isInteger(row.qty)) {
                frappe.msgprint("Quantity must be a whole number for selected UOM.");
                row.qty = Math.floor(row.qty);
                frm.refresh_field("purchase_item");
            }else if ( row.cost != null ){
//                frappe.msgprint("Hi");
                row.amount = (row.qty || 0) * (row.cost || 0);
                frm.refresh_field('purchase_item');
            } 
        })};        
        calculate_item_costs(frm);
    },
    amount: function(frm, cdt, cdn) {
        // frappe.msgprint("amount changed");
        calculate_item_costs(frm);
    },
    uom_box: function(frm, cdt, cdn) {
        calculate_quantity(frm, cdt, cdn);
        calculate_item_costs(frm);
    },
    box: function(frm, cdt, cdn) {
        calculate_quantity(frm, cdt, cdn);
        calculate_item_costs(frm);
    },
    loose: function(frm, cdt, cdn) {
        calculate_quantity(frm, cdt, cdn);
        frappe.msgprint("loose changed");
        // calculate_item_costs(frm, cdt, cdn);
    },
    quantity: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.amount = (row.qty || 0) * (row.cost || 0);
        frm.refresh_field('purchase_item');
        calculate_item_costs(frm);
    },
    cost: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.cost){
            row.amount = (row.qty || 0) * (row.cost || 0);
            frm.refresh_field('purchase_item');
            calculate_item_costs(frm);
        }
    },
    uom: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frappe.db.get_value("UOM", row.uom, "must_be_whole_number", (r) => {
            if (r.must_be_whole_number && !Number.isInteger(row.qty)) {
                frappe.msgprint("Quantity must be a whole number for selected UOM.");
                row.qty = Math.floor(row.qty);
                frm.refresh_field("purchase_item");
                calculate_item_costs(frm);
            }
        });
    }
/*    ,
     qty: function(frm, cdt, cdn) {
//        frappe.msgprint("Hi qty");
        let row = locals[cdt][cdn];
        if ( row.uom != null ){
        frappe.db.get_value("UOM", row.uom, "must_be_whole_number", (r) => {
            if (r.must_be_whole_number && !Number.isInteger(row.qty)) {
                frappe.msgprint("Quantity must be a whole number for selected UOM.");
                row.qty = Math.floor(row.qty);
                frm.refresh_field("purchase_item");
            }else{
//                frappe.msgprint("Hi");
                row.amount = (row.qty || 0) * (row.cost || 0);
                frm.refresh_field('purchase_item');
            } 
        })};
    } */
});

function calculate_item_costs(frm, cdt, cdn) {
    // calculate_quantity(frm, cdt, cdn);
    // cal qty
    let total_amount = 0;
 frappe.msgprint("Hi hmm");
    // Step 1: calculate total purchase amount
    // frm.refresh_field("total_amount");
    frm.doc.purchase_item.forEach(row => {
        if (row.amount) {
            total_amount += row.amount;
        }
    });

    let additional_cost = frm.doc.additional_cost || 0;

    frm.doc.total_amount = total_amount + additional_cost;
    frappe.msgprint("total" + total_amount);
    frm.refresh_field("total_amount");
    //Row calculation

    // Step 2: distribute cost per item
    frm.doc.purchase_item.forEach(row => {
        if (row.qty && row.amount) {
            let share = (row.amount / total_amount) * additional_cost;
            let final_cost = (row.amount + share) / row.qty;

            frappe.model.set_value(row.doctype, row.name, "calculated_cost", final_cost);
            frappe.msgprint("final");
        } else {
            frappe.model.set_value(row.doctype, row.name, "calculated_cost", 0);
        }
    });

    frm.refresh_field("purchase_item");
}
