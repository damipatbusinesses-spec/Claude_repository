"""Odczytuje tabele z PDF i zapisuje do Excela. Puste komorki zostaja puste - nic nie jest zgadywane."""
import sys
import pdfplumber
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.comments import Comment

src, out = sys.argv[1], sys.argv[2]
with pdfplumber.open(src) as pdf:
    table = pdf.pages[0].extract_tables()[0]
header, data = table[0], table[1:]
print("Odczytano z PDF:", table)

def num(v):
    v = (v or "").strip()
    return float(v) if v else None   # brak wartosci -> pusta komorka

wb = Workbook(); ws = wb.active; ws.title = "Zamowienie"
f = Font(name="Arial"); fb = Font(name="Arial", bold=True)
for c, h in enumerate(header + ["Wartosc (PLN)"], 1):
    cell = ws.cell(1, c, h); cell.font = fb
    cell.fill = PatternFill("solid", fgColor="D9D9D9")
for r, row in enumerate(data, 2):
    ws.cell(r, 1, row[0]).font = f
    q, p = num(row[1]), num(row[2])
    ws.cell(r, 2, q).font = f
    ws.cell(r, 3, p).font = f
    ws.cell(r, 3).number_format = "#,##0.00"
    # wartosc liczona tylko gdy ilosc jest znana
    ws.cell(r, 4, f'=IF(B{r}="","",B{r}*C{r})').font = f
    ws.cell(r, 4).number_format = "#,##0.00"
    if q is None:
        ws.cell(r, 2).fill = PatternFill("solid", fgColor="FFFF00")
        ws.cell(r, 2).comment = Comment("Brak ilosci w zrodlowym PDF - nie uzupelniono.", "Claude")
last = len(data) + 1
ws.cell(last + 1, 1, "Suma (pozycje z iloscia)").font = fb
ws.cell(last + 1, 4, f"=SUM(D2:D{last})").font = fb
ws.cell(last + 1, 4).number_format = "#,##0.00"
ws.cell(last + 3, 1, f"Zrodlo: {src}, strona 1. Zolte komorki = brak danych w PDF.").font = Font(name="Arial", italic=True)
for col, w in zip("ABCD", (26, 10, 18, 16)):
    ws.column_dimensions[col].width = w
wb.save(out)
