# Copyright (c) 2025, Mohammed Fauz Usman and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class DaySheetEntry(Document):
	pass


@frappe.whitelist()
def get_opening_stock():
    return frappe.db.sql("""
        SELECT item, uom, unit_price, current_stock
        FROM `tabStock Entry Item`
        WHERE current_stock > 0
        AND in_or_out = 'In'
        ORDER BY creation ASC
    """, as_dict=True)
    


def on_submit(doc, method):
    """
    When Day Sheet Entry is submitted:
    - Deduct wholesale and retail sales from Stock Entry Items using FIFO.
    - Create 'Out' Stock Entries with profit tracking.
    - Aggregate daily total profit into Day Sheet Entry.
    """

    sales_entries = []

    for row in doc.wholesale_sales:
        sales_entries.append({
            "item": row.item,
            "qty": row.qty,
            "rate": row.rate,
            "uom": row.uom,
            "source": "Wholesale"
        })

    for row in doc.retail_sales:
        sales_entries.append({
            "item": row.item,
            "qty": row.qty,
            "rate": row.rate,
            "uom": row.uom,
            "source": "Retail"
        })

    daily_profit = 0  # running total

    for sale in sales_entries:
        qty_to_deduct = float(sale["qty"])

        stock_layers = frappe.get_all(
            "Stock Entry Item",
            filters={"item": sale["item"], "in_or_out": "In", "current_stock": (">", 0)},
            fields=["name", "parent", "current_stock", "unit_price", "uom"],
            order_by="creation ASC"
        )

        for layer in stock_layers:
            if qty_to_deduct <= 0:
                break
            
            current_stock = float(layer.current_stock or 0)
            deduct_qty = min(qty_to_deduct, layer.current_stock)

            # Update current stock in the FIFO layer
            frappe.db.set_value(
                "Stock Entry Item", 
                layer.name, 
                "current_stock", 
                layer.current_stock - deduct_qty
            )

            # Profit calculation
            purchase_cost = float(layer.unit_price or 0)
            selling_price = float(sale["rate"] or 0)
            profit_per_unit = selling_price - purchase_cost
            total_profit = profit_per_unit * deduct_qty

            # Add to daily total
            daily_profit += total_profit

            # Create Stock Entry (Out)
            stock_entry = frappe.get_doc({
                "doctype": "Stock Entry",
                "entry_type": "Sale",
                "date": doc.date,
                "reference_doc": doc.name,
                "stock_entry_item": []
            })

            stock_entry.append("stock_entry_item", {
                "item": sale["item"],
                "qty": deduct_qty,
                "uom": sale["uom"],
                "unit_price": selling_price,   # selling rate
                "amount": deduct_qty * selling_price,
                "in_or_out": "Out",
                "current_stock": 0,
                "profit": total_profit
            })

            stock_entry.insert(ignore_permissions=True)
            stock_entry.submit()

            qty_to_deduct -= deduct_qty

    # Update total profit in Day Sheet Entry
    #frappe.db.set_value("Day Sheet Entry", doc.name, "total_profit", daily_profit)
    
@frappe.whitelist()
def get_fifo_layers(item):
    """Return available FIFO layers for an item"""
    layers = frappe.get_all(
        "Stock Entry Item",
        filters={"item": item, "in_or_out": "In", "current_stock": (">", 0)},
        fields=["name", "current_stock", "unit_price", "creation"],
        order_by="creation ASC"
    )
    return layers


