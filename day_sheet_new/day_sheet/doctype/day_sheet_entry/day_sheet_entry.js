// Copyright (c) 2025, Mohammed Fauz Usman and contributors
// For license information, please see license.txt

frappe.ui.form.on("Day Sheet Entry", {
	 onload: function(frm) {
        if (frm.is_new()) {   // only for new Day Sheet Entry
            frappe.call({
                method: "day_sheet_new.day_sheet.doctype.day_sheet_entry.day_sheet_entry.get_opening_stock",
                callback: function(r) {
                    if (r.message) {
                        frm.clear_table("day_opening_stock");
                        r.message.forEach(function(row) {
                            let child = frm.add_child("day_opening_stock");
                            child.item = row.item;
                            child.qty = row.current_stock;
                            child.uom = row.uom;
                            child.unit_price = row.unit_price;
                        });
                        frm.refresh_field("day_opening_stock");
                    }
                }
            });
        }
    },
    salary: function(frm) {
        frm.doc.expected_cash_collection = frm.doc.total_wholesale_amount + frm.doc.total_retail_amount - frm.doc.salary;
        frm.refresh_field("expected_cash_collection");
    },
    actual_cash_collection: function(frm) {
        frm.doc.difference = frm.doc.expected_cash_collection - frm.doc.actual_cash_collection;
        frm.refresh_field("difference");
    }
});

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
        calculate_line_and_totals(frm, cdt, cdn, "wholesale_sales");
        frm.set_value("expected_cash_collection", frm.doc.total_wholesale_amount + frm.doc.total_retail_amount);
        frm.refresh_field("expected_cash_collection");
        if ((frm.doc.retail_sales || []).length > 0) {
            calculate_retail_sales_simple(frm);
            calculate_total_profit(frm);
        };
        
        
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
                calculate_line_and_totals(frm, cdt, cdn, "wholesale_sales");
                frm.set_value("expected_cash_collection", frm.doc.total_wholesale_amount + frm.doc.total_retail_amount);
                frm.refresh_field("expected_cash_collection");
                if ((frm.doc.retail_sales || []).length > 0) {
                    calculate_retail_sales_simple(frm);
                    calculate_total_profit(frm);
                    };
            } 
        })};
    },
    wholesale_sales_remove: function(frm) {
        if ((frm.doc.retail_sales || []).length > 0) {
            calculate_retail_sales_simple(frm);
            calculate_total_profit(frm);
        };
    }
    
});

//Script for Day Ending Stock Entry Table

frappe.ui.form.on('Day Ending Stock', {
    item: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let duplicates = frm.doc.day_ending_stock.filter(r => r.item === row.item);
        if (duplicates.length > 1) {
            frappe.msgprint(`Item <b>${row.item}</b> is already added in Day Ending Stock`);
            row.item = null;  // reset the duplicate
            frm.refresh_field("day_ending_stock");
        }
    },
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
            }else{
                if ((frm.doc.retail_sales || []).length > 0) {
                    calculate_retail_sales_simple(frm);
                    calculate_total_profit(frm);
                };
            }
        })};
    },
    day_ending_stock_remove: function(frm) {
        if ((frm.doc.retail_sales || []).length > 0) {
            calculate_retail_sales_simple(frm);
            calculate_total_profit(frm);
        };
    }
    
});

//Retail Sales Logic and Cost Layer Split
frappe.ui.form.on("Day Sheet Entry", {
    refresh: function(frm) {
        frm.add_custom_button("Calculate Retail Sales", function() {
            calculate_retail_sales_simple(frm);
            calculate_total_profit(frm);
        }).addClass("btn-primary");
    }
});

function calculate_retail_sales_simple(frm) {
 //   frm.clear_table("retail_sales");

    // Step 1: Build maps of totals
    let opening_map = {};
    (frm.doc.day_opening_stock || []).forEach(row => {
        opening_map[row.item] = (opening_map[row.item] || 0) + (+row.qty || 0);
    });

    let wholesale_map = {};
    (frm.doc.wholesale_sales || []).forEach(row => {
        wholesale_map[row.item] = (wholesale_map[row.item] || 0) + (+row.qty || 0);
    });

    let ending_map = {};
    (frm.doc.day_ending_stock || []).forEach(row => {
        ending_map[row.item] = (ending_map[row.item] || 0) + (+row.qty || 0);
    });

    // Step 2: Calculate retail = (Opening - Wholesale) - Ending
    Object.keys(opening_map).forEach(item => {
        let opening = opening_map[item] || 0;
        let wholesale = wholesale_map[item] || 0;
        let ending = ending_map[item] || 0;

        let retail_qty = (opening - wholesale) - ending;

        if (retail_qty > 0) {
            // Check if item already exists in retail_sales
            let existing = (frm.doc.retail_sales || []).find(r => r.item === item);
            if (existing) {
                existing.qty = retail_qty;
                existing.amount = (existing.rate || 0) * retail_qty;        
            } else {
                // Add new row if not found
                let rs = frm.add_child("retail_sales");
                rs.item = item;
                rs.qty = retail_qty;
                rs.rate = 0; // leave blank or set default
                rs.amount = 0;
            }
        }
    });

    // --- Totals for wholesale & retail ---
    let total_wholesale = 0;
    (frm.doc.wholesale_sales || []).forEach(r => {
        let qty = parseFloat(r.qty) || 0;
        let rate = parseFloat(r.rate) || 0;
        r.amount = qty * rate;
        total_wholesale += r.amount;
    });

    let total_retail = 0;
    (frm.doc.retail_sales || []).forEach(r => {
        let qty = parseFloat(r.qty) || 0;
        let rate = parseFloat(r.rate) || 0;
        r.amount = qty * rate;
        total_retail += r.amount;
    });

    // Set totals in parent
    frm.set_value("total_wholesale_amount", total_wholesale);
    frm.set_value("total_retail_amount", total_retail);
    frm.set_value("expected_cash_collection", total_wholesale + total_retail);
    

    // Refresh UI
    frm.refresh_field("wholesale_sales");
    frm.refresh_field("expected_cash_collection");

    frm.refresh_field("retail_sales");
    frappe.msgprint("Retail Sales calculated successfully.");
}

//Retail Sales Table

frappe.ui.form.on("Retail Sales", {
    qty: function(frm, cdt, cdn) {
        calculate_amount(frm, cdt, cdn);
    },
    rate: function(frm, cdt, cdn) {
        calculate_amount(frm, cdt, cdn);
    },
    uom: function(frm, cdt, cdn) {
        calculate_amount(frm, cdt, cdn);
    },
    retail_sales_remove: function(frm) {
        calculate_retail_sales_simple(frm);
        calculate_total_profit(frm);
    }
});

function calculate_amount(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    if ( row.uom != null ){
        frappe.db.get_value("UOM", row.uom, "must_be_whole_number", (r) => {
            if (r.must_be_whole_number && !Number.isInteger(row.qty)) {
                frappe.msgprint("Quantity must be a whole number for selected UOM.");
                row.qty = Math.floor(row.qty);
                frm.refresh_field("retail_sales");
            }
            else{
                let qty = parseFloat(row.qty) || 0;
                let price = parseFloat(row.rate ) || 0;
                row.amount = qty * price;

                // Refresh just this row in the grid
                frappe.model.set_value(cdt, cdn, "amount", row.amount);
                calculate_line_and_totals(frm, cdt, cdn, "retail_sales");
                frm.set_value("expected_cash_collection", frm.doc.total_wholesale_amount + frm.doc.total_retail_amount);
                frm.refresh_field("expected_cash_collection");
                calculate_retail_sales_simple(frm);
                calculate_total_profit(frm);
            }
        })}
    ;    
    
    
};


// --- Helper Function ---
function calculate_line_and_totals(frm, cdt, cdn, table_field) {
    let row = locals[cdt][cdn];

    let qty = parseFloat(row.qty) || 0;
    let price = parseFloat(row.rate) || 0;
    row.amount = qty * price;

    frappe.model.set_value(cdt, cdn, "amount", row.amount);

    // --- Recalculate total for the whole child table ---
    let total = 0;
    (frm.doc[table_field] || []).forEach(r => {
        total += parseFloat(r.amount) || 0;
    });

    // Map totals to parent fields
    if (table_field === "wholesale_sales") {
        frm.set_value("total_wholesale_amount", total);
    }
    if (table_field === "retail_sales") {
        frm.set_value("total_retail_amount", total);
    }
}

//helper for total profit
async function calculate_total_profit(frm) {
    let daily_profit = 0;

    let sales_entries = [];

    (frm.doc.wholesale_sales || []).forEach(row => {
        sales_entries.push({
            item: row.item,
            qty: row.qty || 0,
            rate: row.rate || 0
        });
    });

    (frm.doc.retail_sales || []).forEach(row => {
        sales_entries.push({
            item: row.item,
            qty: row.qty || 0,
            rate: row.rate || 0
        });
    });

    for (let sale of sales_entries) {
        let qty_to_deduct = sale.qty;

        if (!sale.item || qty_to_deduct <= 0) continue;

        // Call backend to get FIFO layers
        let r = await frappe.call({ 
            method: "day_sheet_new.day_sheet.doctype.day_sheet_entry.day_sheet_entry.get_fifo_layers",
            args: { item: sale.item }
        });

        let layers = r.message || [];

        for (let layer of layers) {
            if (qty_to_deduct <= 0) break;

            let deduct_qty = Math.min(qty_to_deduct, layer.current_stock);
            let purchase_cost = layer.unit_price || 0;
            let selling_price = sale.rate || 0;

            let profit_per_unit = selling_price - purchase_cost;
            daily_profit += profit_per_unit * deduct_qty;

            qty_to_deduct -= deduct_qty;
        }
    }

    frm.set_value("total_profit", daily_profit);
    frm.refresh_field("total_profit");
}