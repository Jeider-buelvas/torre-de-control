import sys, json, datetime, re, openpyxl
data = json.load(open(sys.argv[1]))
def conv(f):
    partes = re.split(r'("[^"]*")', f)
    if not any(';' in p for i, p in enumerate(partes) if i % 2 == 0): return f
    for i in range(0, len(partes), 2): partes[i] = re.sub(r'(\d),(\d)', r'\1.\2', partes[i]).replace(';', ',')
    return ''.join(partes)
wb = openpyxl.Workbook(); wb.remove(wb.active)
for nombre, h in data.items():
    ws = wb.create_sheet(nombre[:31])
    for k, (v, f) in h['cells'].items():
        r, c = map(int, k.split(','))
        ws.cell(r, c).value = conv(f) if f else (datetime.datetime.fromisoformat(v['d']) if isinstance(v, dict) else v)
wb.save(sys.argv[2])
