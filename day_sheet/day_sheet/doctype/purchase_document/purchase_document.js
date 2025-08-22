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

frappe.ui.form.on("Purchase Item", {
    qty: function(frm, cdt, cdn) {
        calculate_item_costs(frm);
    },
    amount: function(frm, cdt, cdn) {
        calculate_item_costs(frm);
    }
});

function calculate_item_costs(frm) {
    let total_amount = 0;

    // Step 1: calculate total purchase amount
    frm.doc.items.forEach(row => {
        if (row.amount) {
            total_amount += row.amount;
        }
    });

    let additional_cost = frm.doc.additional_cost || 0;

    frm.doc.total_amount = total_amount + additional_cost;
    frm.refresh_field("total_amount");
    // Step 2: distribute cost per item
    frm.doc.items.forEach(row => {
        if (row.qty && row.amount) {
            let share = (row.amount / total_amount) * additional_cost;
            let final_cost = (row.amount + share) / row.qty;

            frappe.model.set_value(row.doctype, row.name, "calculated_cost", final_cost);
        } else {
            frappe.model.set_value(row.doctype, row.name, "calculated_cost", 0);
        }
    });

    frm.refresh_field("items");
}
