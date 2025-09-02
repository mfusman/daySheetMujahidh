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
        ORDER BY creation ASC
    """, as_dict=True)
