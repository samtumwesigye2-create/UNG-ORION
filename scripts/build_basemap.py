"""Build the self-hosted ORION schematic map from public-domain Natural Earth data."""
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'static'
land = json.loads((ROOT / 'uganda-map.json').read_text())
hydro = json.loads((ROOT / 'uganda-hydro.json').read_text())

def project(point):
    return ((point[0] - 28.3) * 140, (4.7 - point[1]) * 140)

def line(points, close=False):
    out = ' '.join(('M' if i == 0 else 'L') + f'{project(pt)[0]:.1f} {project(pt)[1]:.1f}' for i, pt in enumerate(points))
    return out + (' Z' if close else '')

def paths(geometry, close=True):
    coordinates = geometry['coordinates']
    kind = geometry['type']
    if kind in ('Polygon', 'MultiLineString'):
        rings = coordinates
    elif kind == 'MultiPolygon':
        rings = [ring for polygon in coordinates for ring in polygon]
    else:
        rings = [coordinates]
    return ' '.join(line(ring, close) for ring in rings)

s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Schematic map of Uganda and surrounding area">',
'<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#172734"/><stop offset="1" stop-color="#0e1d28"/></linearGradient><linearGradient id="land" x2="1" y2="1"><stop stop-color="#30363c"/><stop offset=".48" stop-color="#2d343b"/><stop offset="1" stop-color="#293139"/></linearGradient><linearGradient id="water" x2="1" y2="1"><stop stop-color="#1d3541"/><stop offset="1" stop-color="#152d3b"/></linearGradient></defs>',
'<path fill="url(#bg)" d="M0 0h1200v900H0z"/>']
for lon in range(29, 37):
    x = project((lon, 0))[0]
    s.append(f'<path stroke="#527588" stroke-opacity=".24" stroke-dasharray="3 9" d="M{x:.1f} 0V900"/><text x="{x+7:.1f}" y="25" fill="#7596a1" font-size="11" font-family="Arial,sans-serif">{lon}° E</text>')
for lat in range(-1, 5):
    y = project((30, lat))[1]
    s.append(f'<path stroke="#527588" stroke-opacity=".24" stroke-dasharray="3 9" d="M0 {y:.1f}H1200"/>')
for country in land['countries']:
    ug = country['name'] == 'Uganda'
    d = paths(country['geometry'])
    if ug:
        s.append(f'<defs><clipPath id="uganda-clip"><path d="{d}"/></clipPath></defs>')
    s.append(f'<path d="{d}" fill="{ "url(#land)" if ug else "#252b32"}" stroke="{ "#87939b" if ug else "#4c565e"}" stroke-width="{2.2 if ug else 1.1}"/>')
for lake in hydro['lakes']:
    s.append(f'<path d="{paths(lake["geometry"])}" fill="url(#water)" stroke="#537b8d" stroke-width="1.5"/>')
for river in hydro['rivers']:
    s.append(f'<path d="{paths(river["geometry"], close=False)}" fill="none" stroke="#5c899a" stroke-opacity=".82" stroke-width="1.9"/>')
for name, lon, lat, size, color in [('LAKE VICTORIA',32.76,-.90,11,'#7196a5'),('LAKE ALBERT',31.12,1.6,9,'#7196a5'),('LAKE KYOGA',33.05,1.45,9,'#7196a5')]:
    x,y = project((lon,lat))
    s.append(f'<text x="{x:.1f}" y="{y:.1f}" fill="{color}" font-size="{size}" font-family="Arial,sans-serif" font-weight="bold" letter-spacing="3" text-anchor="middle">{name}</text>')
for name,lon,lat in [('KAMPALA',32.58,.35),('ENTEBBE',32.46,.04),('JINJA',33.2,.44),('GULU',32.3,2.77),('MBARARA',30.66,-.61),('MBALE',34.18,1.08),('FORT PORTAL',30.3,.67),('LIRA',32.9,2.25),('SOROTI',33.61,1.71),('MASAKA',31.74,-.33),('HOIMA',31.35,1.43)]:
    x,y=project((lon,lat))
    s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.2" fill="#a9c3be" fill-opacity=".18"/><circle cx="{x:.1f}" cy="{y:.1f}" r="2" fill="#b2c6c5"/><text x="{x+8:.1f}" y="{y-7:.1f}" fill="#b4bec2" font-size="10" font-family="Arial,sans-serif" font-weight="bold" letter-spacing="1">{escape(name)}</text>')
s.append('</svg>')
(ROOT / 'uganda-basemap.svg').write_text(''.join(s))
