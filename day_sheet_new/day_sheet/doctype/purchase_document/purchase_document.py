# Copyright (c) 2025, Mohammed Fauz Usman and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class PurchaseDocument(Document):
	pass


def on_submit(doc, method):
    """
    Triggered when a Purchase Document is submitted.
    Creates separate Stock Entry for each line item with current_stock initialized.
    """

stock_entry = frappe.get_doc({
    "doctype": "Stock Entry",
    # "posting_date": doc.posting_date,
	"date": doc.purchase_date,
    "reference_doc": doc.name,
    "stock_entry_item": []
    })
	
for item in doc.purchase_item:
    stock_entry.append("stock_entry_item", {
        "item": item.item,
        "qty": item.qty,
        "uom": item.uom,
        "unit_price": item.cost,
        "amount": item.amount,
        "current_stock": item.qty,  # New cost layer, stock = purchased qty
        "in_or_out": "In"
    })	

stock_entry.insert(ignore_permissions=True)
stock_entry.submit()
    