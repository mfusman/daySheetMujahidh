// Copyright (c) 2025, Mohammed Fauz Usman and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Day Sheet Entry", {
// 	refresh(frm) {

// 	},
// });

function calculate_quantity(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    if (!row.uom_box) {
            row.qty = row.loose;
            row.box = 0;
            frm.refresh_field("wholesale_sales");
        return;
    }

    // Fetch conversion factor from UOM Doctype
    frappe.db.get_value("UOM", row.uom_box, "conversion_factor", (r) => {
        if (r && r.conversion_factor) {
            let factor = r.conversion_factor;
            let boxes_qty = (row.box || 0) * factor;
            let loose = row.loose || 0;

            row.qty = boxes_qty + loose;
            row.amount = (row.qty || 0) * (row.rate || 0);
            frm.refresh_field("wholesale_sales");  // refresh grid
        }
    });
};


//Script for Wholesale Entry Table
frappe.ui.form.on('Wholesale Sales', {
    uom_box: function(frm, cdt, cdn) {
        calculate_quantity(frm, cdt, cdn);
    },
    box: function(frm, cdt, cdn) {
        calculate_quantity(frm, cdt, cdn);
    },
    loose: function(frm, cdt, cdn) {
        calculate_quantity(frm, cdt, cdn);
    },
    quantity: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.amount = (row.qty || 0) * (row.rate || 0);
        frm.refresh_field('wholesale_sales');
    },
    rate: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.amount = (row.qty || 0) * (row.rate || 0);
        frm.refresh_field('wholesale_sales');
    },
    uom: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frappe.db.get_value("UOM", row.uom, "must_be_whole_number", (r) => {
            if (r.must_be_whole_number && !Number.isInteger(row.qty)) {
                frappe.msgprint("Quantity must be a whole number for selected UOM.");
                row.qty = Math.floor(row.qty);
                frm.refresh_field("wholesale_sales");
            }
        });
    },
    qty: function(frm, cdt, cdn) {
//        frappe.msgprint("Hi qty");
        let row = locals[cdt][cdn];
        if ( row.uom != null ){
        frappe.db.get_value("UOM", row.uom, "must_be_whole_number", (r) => {
            if (r.must_be_whole_number && !Number.isInteger(row.qty)) {
                frappe.msgprint("Quantity must be a whole number for selected UOM.");
                row.qty = Math.floor(row.qty);
                frm.refresh_field("wholesale_sales");
            }else{
//                frappe.msgprint("Hi");
                row.amount = (row.qty || 0) * (row.rate || 0);
                frm.refresh_field('wholesale_sales');
            } 
        })};
    }
    
});

//Script for Day Ending Stock Entry Table

frappe.ui.form.on('Day Ending Stock', {
    uom: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        frappe.db.get_value("UOM", row.uom, "must_be_whole_number", (r) => {
            if (r.must_be_whole_number && !Number.isInteger(row.qty)) {
                frappe.msgprint("Quantity must be a whole number for selected UOM.");
                row.qty = Math.floor(row.qty);
                frm.refresh_field("day_ending_stock");
            }
        });
    },
    qty: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if ( row.uom != null ){
        frappe.db.get_value("UOM", row.uom, "must_be_whole_number", (r) => {
            if (r.must_be_whole_number && !Number.isInteger(row.qty)) {
                frappe.msgprint("Quantity must be a whole number for selected UOM.");
                row.qty = Math.floor(row.qty);
                frm.refresh_field("day_ending_stock");
            }
        })};
    }
    
});


