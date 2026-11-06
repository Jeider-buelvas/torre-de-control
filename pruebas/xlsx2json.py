import sys, json, datetime, warnings
warnings.filterwarnings('ignore')
import openpyxl
src, dst = sys.argv[1], sys.argv[2]
wf = openpyxl.load_workbook(src); wv = openpyxl.load_workbook(src, data_only=True)
def enc(v):
    if isinstance(v, datetime.datetime): return {'d': v.isoformat()}
    if isinstance(v, datetime.date): return {'d': datetime.datetime(v.year, v.month, v.day).isoformat()}
    if isinstance(v, datetime.time): return str(v)
    return v
out = {}
keep = sys.argv[3].split('|') if len(sys.argv) > 3 else None
for ws in wf.worksheets:
    if keep and ws.title not in keep: continue
    vs = wv[ws.title]; cells = {}
    for row in ws.iter_rows():
        for c in row:
            f = c.value if isinstance(c.value, str) and c.value.startswith('=') else None
            if f is None and c.value is not None and not isinstance(c.value, str) and hasattr(c.value, 'text'): f = '=' + str(c.value.text).lstrip('=')
            v = vs.cell(c.row, c.column).value
            if f is None and c.value is None: continue
            cells[f'{c.row},{c.column}'] = [enc(v), f]
    out[ws.title] = {'maxR': ws.max_row, 'maxC': ws.max_column, 'cells': cells}
json.dump(out, open(dst, 'w'), ensure_ascii=False)
print('hojas:', {k: len(v['cells']) for k, v in out.items()})
