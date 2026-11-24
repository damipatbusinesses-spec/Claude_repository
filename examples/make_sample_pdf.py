"""Tworzy przykładowy PDF testowy (dane fikcyjne, tylko do demonstracji)."""
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

rows = [
    ["Produkt", "Ilosc", "Cena jedn. (PLN)"],
    ["Klawiatura", "12", "149.00"],
    ["Mysz", "30", "59.90"],
    ["Monitor 24", "5", "799.00"],
    ["Kabel HDMI", "", "24.50"],   # celowo brak ilosci
]
doc = SimpleDocTemplate("sample_invoice.pdf", pagesize=A4)
st = getSampleStyleSheet()
t = Table(rows)
t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                       ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey)]))
doc.build([Paragraph("PRZYKLADOWE ZAMOWIENIE (dane testowe)", st["Title"]),
           Paragraph("Numer: TEST-001", st["Normal"]), Spacer(1, 12), t])
