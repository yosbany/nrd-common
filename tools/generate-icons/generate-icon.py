#!/usr/bin/env python3
"""
Generador de iconos SVG y PNG para apps NRD (herramienta compartida).
Genera iconos con texto sobre fondo rojo NRD.
Uso: python3 generate-icon.py "TEXTO_DEL_ICONO" [directorio_salida] [icon_type]
Ejemplo: python3 generate-icon.py "NRD Catálogo" assets/icons
Ejemplo bakery: python3 generate-icon.py "Panadería|Nueva Río D'or" assets/icons bakery
Icon types: catalog (default), bakery
"""

import sys
from pathlib import Path

ICON_CATALOG = "catalog"
ICON_BAKERY = "bakery"


def escape_xml(text):
    """Escapa caracteres especiales para XML"""
    return (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&apos;"))


def calculate_font_size(text, max_width, base_size):
    """Calcula el tamaño de fuente óptimo para que el texto quepa en el ancho máximo"""
    char_width_factor = 0.65 if any(c.isupper() for c in text) else 0.55
    estimated_width = len(text) * base_size * char_width_factor

    if estimated_width > max_width:
        calculated_size = base_size * (max_width / estimated_width) * 0.95
        return max(int(calculated_size), base_size // 2)
    if estimated_width < max_width * 0.7:
        return int(base_size * 1.1)
    return base_size


def split_text(text):
    """Divide el texto en dos líneas. Usa | para separación manual (ej: 'Panadería|Nueva Rio D'or')."""
    if "|" in text:
        parts = text.split("|", 1)
        return parts[0].strip(), parts[1].strip() if len(parts) > 1 else ""
    words = text.split()
    if len(words) >= 2:
        mid = len(words) // 2
        return " ".join(words[:mid]), " ".join(words[mid:])
    if len(text) > 10:
        mid = len(text) // 2
        for i in range(mid - 2, mid + 3):
            if i < len(text) and text[i].lower() in 'aeiou':
                mid = i + 1
                break
        return text[:mid], text[mid:]
    return text, ""


def get_bakery_icon_svg(size):
    """Genera el SVG del icono de panadería: bol con pan y vapor (estilo outline blanco)."""
    cx = size // 2
    # Escala y posición según tamaño
    if size == 192:
        scale = 1
        icon_top = 24
    else:
        scale = size / 192
        icon_top = int(24 * scale)
    s = scale
    sw = max(1.5, int(3 * s))  # stroke width
    # Bol: elipse ancha y baja
    bowl_w = int(70 * s)
    bowl_h = int(28 * s)
    bowl_y = icon_top + int(40 * s)
    bowl = f'<ellipse cx="{cx}" cy="{bowl_y}" rx="{bowl_w}" ry="{bowl_h}" fill="none" stroke="#ffffff" stroke-width="{sw}"/>'
    # Línea interior del borde del bol
    rim_y = bowl_y - int(10 * s)
    rim = f'<path d="M {cx - int(50 * s)} {rim_y} Q {cx} {rim_y - int(6 * s)} {cx + int(50 * s)} {rim_y}" fill="none" stroke="#ffffff" stroke-width="{sw}" stroke-linecap="round"/>'
    # Panes: 3 formas redondeadas dentro del bol
    b1 = f'<ellipse cx="{cx - int(22 * s)}" cy="{bowl_y - int(4 * s)}" rx="{int(14 * s)}" ry="{int(12 * s)}" fill="none" stroke="#ffffff" stroke-width="{sw}"/>'
    b2 = f'<ellipse cx="{cx}" cy="{bowl_y - int(8 * s)}" rx="{int(16 * s)}" ry="{int(14 * s)}" fill="none" stroke="#ffffff" stroke-width="{sw}"/>'
    b3 = f'<ellipse cx="{cx + int(20 * s)}" cy="{bowl_y - int(5 * s)}" rx="{int(12 * s)}" ry="{int(11 * s)}" fill="none" stroke="#ffffff" stroke-width="{sw}"/>'
    # Vapor: 3 líneas onduladas
    steam_y = bowl_y - int(35 * s)
    steam_x1 = cx - int(25 * s)
    steam_x2 = cx
    steam_x3 = cx + int(25 * s)
    steam1 = f'<path d="M {steam_x1} {steam_y + int(20 * s)} Q {steam_x1 - int(8 * s)} {steam_y} {steam_x1} {steam_y - int(15 * s)}" fill="none" stroke="#ffffff" stroke-width="{sw}" stroke-linecap="round"/>'
    steam2 = f'<path d="M {steam_x2} {steam_y + int(22 * s)} Q {steam_x2 + int(6 * s)} {steam_y} {steam_x2} {steam_y - int(18 * s)}" fill="none" stroke="#ffffff" stroke-width="{sw}" stroke-linecap="round"/>'
    steam3 = f'<path d="M {steam_x3} {steam_y + int(18 * s)} Q {steam_x3 + int(10 * s)} {steam_y} {steam_x3} {steam_y - int(14 * s)}" fill="none" stroke="#ffffff" stroke-width="{sw}" stroke-linecap="round"/>'
    return f'  <g id="bakery-icon">\n    {bowl}\n    {rim}\n    {b1}\n    {b2}\n    {b3}\n    {steam1}\n    {steam2}\n    {steam3}\n  </g>'


def get_catalog_icon_svg(size, icon_y, icon_size, icon_spacing, stroke_width):
    """Genera el SVG del icono de catálogo (cuadrícula)."""
    return f'''  <g opacity="0.25">
    <rect x="{icon_y}" y="{icon_y}" width="{icon_size}" height="{icon_size}" fill="#ffffff" rx="{size // 48}" stroke="#ffffff" stroke-width="{stroke_width}" stroke-opacity="0.5"/>
    <rect x="{icon_y + icon_spacing}" y="{icon_y}" width="{icon_size}" height="{icon_size}" fill="#ffffff" rx="{size // 48}" stroke="#ffffff" stroke-width="{stroke_width}" stroke-opacity="0.5"/>
    <rect x="{icon_y}" y="{icon_y + icon_spacing}" width="{icon_size}" height="{icon_size}" fill="#ffffff" rx="{size // 48}" stroke="#ffffff" stroke-width="{stroke_width}" stroke-opacity="0.5"/>
    <rect x="{icon_y + icon_spacing}" y="{icon_y + icon_spacing}" width="{icon_size}" height="{icon_size}" fill="#ffffff" rx="{size // 48}" stroke="#ffffff" stroke-width="{stroke_width}" stroke-opacity="0.5"/>

    <line x1="{icon_y + icon_size // 2}" y1="{icon_y + icon_size // 4}" x2="{icon_y + icon_spacing}" y2="{icon_y + icon_size // 4}" stroke="#ffffff" stroke-width="{size // 96}" stroke-linecap="round"/>
    <line x1="{icon_y + icon_size // 2}" y1="{icon_y + icon_size // 2}" x2="{icon_y + icon_spacing}" y2="{icon_y + icon_size // 2}" stroke="#ffffff" stroke-width="{size // 96}" stroke-linecap="round"/>
    <line x1="{icon_y + icon_size // 4}" y1="{icon_y + icon_size // 2}" x2="{icon_y + icon_size // 4}" y2="{icon_y + icon_spacing}" stroke="#ffffff" stroke-width="{size // 96}" stroke-linecap="round"/>
    <line x1="{icon_y + icon_size // 2}" y1="{icon_y + icon_size // 2}" x2="{icon_y + icon_size // 2}" y2="{icon_y + icon_spacing}" stroke="#ffffff" stroke-width="{size // 96}" stroke-linecap="round"/>
    <line x1="{icon_y + icon_spacing}" y1="{icon_y + icon_size // 2}" x2="{icon_y + icon_spacing}" y2="{icon_y + icon_spacing}" stroke="#ffffff" stroke-width="{size // 96}" stroke-linecap="round"/>
    <line x1="{icon_y + icon_spacing + icon_size // 4}" y1="{icon_y + icon_size // 2}" x2="{icon_y + icon_spacing + icon_size // 4}" y2="{icon_y + icon_spacing}" stroke="#ffffff" stroke-width="{size // 96}" stroke-linecap="round"/>
  </g>'''


def generate_svg(text, size, icon_type=ICON_CATALOG):
    """Genera el código SVG para un icono con el texto proporcionado"""
    line1, line2 = split_text(text)
    is_bakery = icon_type == ICON_BAKERY

    if size == 192:
        text_area_width = size * 0.90
        base_font_size = 50
        base_sub_font_size = 38

        main_font_size = calculate_font_size(line1, text_area_width, base_font_size)
        sub_font_size = calculate_font_size(line2, text_area_width, base_sub_font_size) if line2 else 0

        if is_bakery:
            if line2:
                y_main = 98
                y_sub = 138
            else:
                y_main = 115
                y_sub = 0
        else:
            if line2:
                y_main = 88
                y_sub = 128
            else:
                y_main = 108
                y_sub = 0

        icon_size = 28
        icon_y = 20
        icon_spacing = 56
    else:
        text_area_width = size * 0.90
        base_font_size = 130
        base_sub_font_size = 100

        main_font_size = calculate_font_size(line1, text_area_width, base_font_size)
        sub_font_size = calculate_font_size(line2, text_area_width, base_sub_font_size) if line2 else 0

        if is_bakery:
            if line2:
                y_main = 260
                y_sub = 365
            else:
                y_main = 305
                y_sub = 0
        else:
            if line2:
                y_main = 225
                y_sub = 315
            else:
                y_main = 275
                y_sub = 0

        icon_size = 75
        icon_y = 50
        icon_spacing = 150

    corner_radius = size // 8
    stroke_width = max(1, size // 192)

    # Bakery: fondo rojo sólido; catalog: gradiente
    bg_fill = '#dc2626' if is_bakery else 'url(#bgGradient)'
    sub_color = '#ffffff' if is_bakery else '#fef08a'
    icon_svg = get_bakery_icon_svg(size) if is_bakery else get_catalog_icon_svg(size, icon_y, icon_size, icon_spacing, stroke_width)

    if is_bakery:
        defs = f'''  <defs>
    <filter id="shadow">
      <feDropShadow dx="0" dy="{size // 64}" stdDeviation="{size // 128}" flood-opacity="0.3"/>
    </filter>
  </defs>
'''
    else:
        defs = f'''  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ef4444;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="{size // 64}" stdDeviation="{size // 128}" flood-opacity="0.3"/>
    </filter>
  </defs>
'''

    svg = f'''<svg width="{size}" height="{size}" xmlns="http://www.w3.org/2000/svg">
{defs}
  <rect width="{size}" height="{size}" fill="{bg_fill}" rx="{corner_radius}" ry="{corner_radius}"/>

{icon_svg}

  <text x="{size // 2}" y="{y_main}" font-family="Georgia, serif" font-size="{main_font_size}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" filter="url(#shadow)" letter-spacing="{size // 384}">{escape_xml(line1)}</text>'''

    if line2 and sub_font_size > 0:
        svg += f'''
  <text x="{size // 2}" y="{y_sub}" font-family="Georgia, serif" font-size="{int(sub_font_size * 1.05)}" font-weight="bold" fill="{sub_color}" text-anchor="middle" dominant-baseline="middle" filter="url(#shadow)" letter-spacing="{size // 384}">{escape_xml(line2)}</text>'''

    svg += "\n</svg>"
    return svg


def convert_svg_to_png_from_file(svg_path, png_path, size):
    """Convierte un archivo SVG a PNG"""
    try:
        import cairosvg

        cairosvg.svg2png(
            url=str(svg_path),
            write_to=str(png_path),
            output_width=size,
            output_height=size
        )
        print(f"✓ Generado {png_path.name} ({size}x{size})")
        return True
    except ImportError:
        print("✗ Error: cairosvg no está instalado. Ejecuta: pip install cairosvg")
        return False
    except Exception as e:
        print(f"✗ Error al convertir a PNG: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print("✗ Error: Debes proporcionar el texto del icono")
        print("   Uso: python3 generate-icon.py \"TEXTO_DEL_ICONO\" [directorio_salida] [icon_type]")
        print("   Ejemplo: python3 generate-icon.py \"NRD Catálogo\" assets/icons")
        print("   Ejemplo bakery: python3 generate-icon.py \"Panadería|Nueva Río D'or\" assets/icons bakery")
        return 1

    icon_text = sys.argv[1]
    output_dir = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else Path.cwd()
    icon_type = (sys.argv[3] or ICON_CATALOG).lower() if len(sys.argv) > 3 else ICON_CATALOG
    if icon_type not in (ICON_CATALOG, ICON_BAKERY):
        icon_type = ICON_CATALOG

    if not output_dir.exists():
        output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Generando iconos con texto: \"{icon_text}\" (icon_type={icon_type})")
    print(f"Directorio de salida: {output_dir}")
    print()

    import tempfile
    temp_dir = Path(tempfile.mkdtemp())

    try:
        svg_192_content = generate_svg(icon_text, 192, icon_type)
        svg_192_path = temp_dir / "icon-192.svg"
        with open(svg_192_path, 'w') as f:
            f.write(svg_192_content)

        svg_512_content = generate_svg(icon_text, 512, icon_type)
        svg_512_path = temp_dir / "icon-512.svg"
        with open(svg_512_path, 'w') as f:
            f.write(svg_512_content)

        png_192_path = output_dir / "icon-192.png"
        if not convert_svg_to_png_from_file(svg_192_path, png_192_path, 192):
            return 1

        png_512_path = output_dir / "icon-512.png"
        if not convert_svg_to_png_from_file(svg_512_path, png_512_path, 512):
            return 1

    finally:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

    return 0


if __name__ == "__main__":
    sys.exit(main())
