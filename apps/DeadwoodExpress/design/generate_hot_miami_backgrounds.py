"""Generate the 3 Hot Miami background art assets strictly according to brief Round 2:
1. bg_base.png - Base Game (Dusk) - Warm dusk, bright sun with halo, lit hotel neon, long orange reflections, warm deck light.
2. bg_feature.png - Free Spins / Neon Nights (Night) - Indigo sky with stars, hotel neon full strength & reflecting far, deck lit by warm lamp.
3. bg_epic.png - Ocean Drive / Top Tier (Stormy Night) - Purple-black sky, sheet lightning behind hotels in silhouette, choppy reflection shards, hard cyan rim light.

Shared Specifications:
- 1920 x 1080, PNG, fully opaque RGB.
- Flat cel-shaded vector illustration style. Bold clean shapes, sharp edges.
  NO photorealism, NO blur, NO depth-of-field haze.
- Centre 55% of width (x=432 to 1488) is dark, simple, empty (darker than #290A43).
- Left third: Miami Art-Deco hotels with varied lit windows (gold, cyan, dark, silhouettes, floor neon lines, window glows), palm trees with proper drooping fronds & midribs, wet asphalt/water reflections.
- Right third: Moored yacht deck with wooden planks running in perspective, low table, rattan lounger with purple cushions, ice bucket ON table, railing attached to deck floor.
- Palette: Magenta, cyan, warm gold, deep violet/indigo shadows.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageColor

WIDTH = 1920
HEIGHT = 1080
CENTER_LEFT = 432   # 22.5% of 1920
CENTER_RIGHT = 1488 # 77.5% of 1920

HERE = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.abspath(os.path.join(HERE, "..", "static"))
BACKDROP = os.path.join(STATIC, "assets", "sprites", "hotMiamiBackground")


def draw_sun_with_halo(draw, img, sun_x, sun_y, radius):
    """Draw a bright sun disc with a rich gradient and radiant halo (not a flat circle)."""
    # 1. Halo Glow Layers
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    
    # Radiant outer halos
    halo_steps = [
        (radius * 3.2, (255, 0, 127, 35)),   # Magenta outer halo
        (radius * 2.4, (255, 120, 0, 60)),   # Hot orange halo
        (radius * 1.8, (255, 180, 0, 90)),   # Warm gold halo
        (radius * 1.3, (255, 220, 100, 150)) # Bright yellow inner halo
    ]
    for r, color in halo_steps:
        odraw.ellipse([sun_x - r, sun_y - r, sun_x + r, sun_y + r], fill=color)
        
    img.paste(overlay, (0, 0), overlay)
    
    # 2. Core Sun Disc (Gradient from bright white core to warm gold rim)
    for r in range(int(radius), 0, -2):
        t = r / float(radius)
        cr = int(255)
        cg = int(255 - 60 * t)
        cb = int(230 - 180 * t)
        draw.ellipse([sun_x - r, sun_y - r, sun_x + r, sun_y + r], fill=(cr, cg, cb))


def draw_detailed_palm_tree(draw, base_x, base_y, height, lean_right=True, mode="base"):
    """Draw clean vector palm tree with proper drooping fronds, midribs, and pinnate leaflets."""
    scale = height / 320.0
    direction = 1.0 if lean_right else -1.0
    
    # Color palette per mode
    if mode == "epic":
        trunk_col = (10, 5, 20)
        trunk_ring = (18, 9, 32)
        frond_dark = (6, 12, 24)
        frond_mid = (12, 28, 45)
        midrib_col = (0, 200, 240) # cyan accent
    elif mode == "feature":
        trunk_col = (14, 7, 28)
        trunk_ring = (28, 12, 45)
        frond_dark = (8, 16, 32)
        frond_mid = (14, 40, 65)
        midrib_col = (0, 240, 255) # neon cyan accent
    else:
        trunk_col = (22, 10, 40)
        trunk_ring = (42, 18, 70)
        frond_dark = (16, 10, 32)
        frond_mid = (35, 18, 55)
        midrib_col = (255, 0, 127) # magenta sunset accent

    # 1. Curved Trunk with Segmented Bark Rings
    top_x = base_x + int(70 * scale * direction)
    top_y = base_y - int(height)
    
    trunk_pts = []
    segments = 14
    for i in range(segments + 1):
        t = i / float(segments)
        cx = base_x + (top_x - base_x) * (t ** 1.35)
        cy = base_y + (top_y - base_y) * t
        trunk_pts.append((cx, cy))
        
    for i in range(len(trunk_pts) - 1):
        x1, y1 = trunk_pts[i]
        x2, y2 = trunk_pts[i+1]
        w = max(4, int((22 - i * 1.2) * scale))
        draw.line([(x1, y1), (x2, y2)], fill=trunk_col, width=w)
        # Bark ring ridge
        if i % 2 == 0:
            draw.line([(x1 - w*0.4, y1), (x1 + w*0.4, y1)], fill=trunk_ring, width=max(2, int(3 * scale)))

    # 2. Realistic Drooping Fronds with Visible Midribs & Leaflets
    # 10 Fronds radiating at different angles, drooping under gravity
    frond_configs = [
        (-160, 140, 0.4), (-135, 160, 0.3), (-110, 175, 0.2), (-80, 180, 0.1), (-55, 170, 0.2),
        (-30, 155, 0.35), (0, 140, 0.5), (25, 125, 0.6), (-170, 120, 0.45), (-95, 165, 0.15)
    ]
    
    for deg, reach_base, droop_factor in frond_configs:
        angle = math.radians(deg)
        reach = reach_base * scale
        
        # Calculate curved Bezier midrib path
        end_x = top_x + math.cos(angle) * reach
        end_y = top_y + math.sin(angle) * reach + (reach * droop_factor)
        
        ctrl_x = top_x + math.cos(angle) * (reach * 0.55)
        ctrl_y = top_y + math.sin(angle) * (reach * 0.4) - (20 * scale)
        
        # Draw leaflets along midrib
        steps = 12
        prev_x, prev_y = top_x, top_y
        for s in range(1, steps + 1):
            t = s / float(steps)
            # Quadratic Bezier
            mx = (1-t)**2 * top_x + 2*(1-t)*t * ctrl_x + t**2 * end_x
            my = (1-t)**2 * top_y + 2*(1-t)*t * ctrl_y + t**2 * end_y
            
            # Leaflet width along frond (widest in middle, tapering at tip)
            leaf_len = math.sin(t * math.pi) * (26 * scale)
            
            # Leaflet vector blades perpendicular to midrib angle
            dx = mx - prev_x
            dy = my - prev_y
            norm_angle = math.atan2(dy, dx) + math.pi / 2.0
            
            lx1 = mx + math.cos(norm_angle) * leaf_len
            ly1 = my + math.sin(norm_angle) * leaf_len
            lx2 = mx - math.cos(norm_angle) * leaf_len
            ly2 = my - math.sin(norm_angle) * leaf_len
            
            leaf_poly = [(prev_x, prev_y), (lx1, ly1), (mx, my), (lx2, ly2)]
            draw.polygon(leaf_poly, fill=frond_mid if s % 2 == 0 else frond_dark)
            
            prev_x, prev_y = mx, my
            
        # Draw sharp bright midrib line running down the centre of the frond
        draw.line([(top_x, top_y), (ctrl_x, ctrl_y), (end_x, end_y)], fill=midrib_col, width=max(2, int(2.5 * scale)))


def draw_left_art_deco_hotels(draw, img, mode):
    """Draw left third (x=0 to 450) with Art-Deco hotels, varied windows, floor neon, window glows."""
    horizon_y = 620
    
    # 1. Hotel Facades
    b1_col = (20, 10, 38) if mode != "epic" else (12, 5, 22)
    draw.rectangle([0, 220, 140, horizon_y], fill=b1_col)
    draw.rectangle([15, 180, 125, 220], fill=b1_col)
    draw.rectangle([35, 150, 105, 180], fill=b1_col)
    
    b2_col = (28, 12, 50) if mode != "epic" else (16, 7, 28)
    draw.rectangle([120, 160, 290, horizon_y], fill=b2_col)
    draw.rectangle([145, 110, 265, 160], fill=b2_col)
    draw.rectangle([180, 65, 230, 110], fill=b2_col)
    # Roof spire
    spire_col = (0, 240, 255) if mode == "feature" else (255, 0, 127)
    draw.polygon([(205, 20), (195, 65), (215, 65)], fill=spire_col)
    
    b3_col = (24, 9, 44) if mode != "epic" else (10, 4, 20)
    draw.rectangle([270, 240, 440, horizon_y], fill=b3_col)
    draw.rectangle([290, 200, 420, 240], fill=b3_col)

    # 2. Thin Neon Tube Lines Along Each Floor's Edge
    neon_pink = (255, 0, 127) if mode != "feature" else (255, 40, 160)
    neon_cyan = (0, 240, 255) if mode != "feature" else (80, 255, 255)
    
    # Horizontal Floor Neon Strips
    for fy in range(260, 600, 40):
        draw.line([(0, fy), (140, fy)], fill=neon_pink if fy % 80 == 0 else neon_cyan, width=3)
    for fy in range(200, 600, 36):
        draw.line([(120, fy), (290, fy)], fill=neon_cyan if fy % 72 == 0 else neon_pink, width=3)
    for fy in range(280, 600, 42):
        draw.line([(270, fy), (440, fy)], fill=neon_pink if fy % 84 == 0 else neon_cyan, width=3)

    # Roof eaves neon
    draw.line([(0, 220), (140, 220)], fill=neon_pink, width=4)
    draw.line([(15, 180), (125, 180)], fill=neon_cyan, width=4)
    draw.line([(120, 160), (290, 160)], fill=neon_cyan, width=5)
    draw.line([(145, 110), (265, 110)], fill=neon_pink, width=4)
    draw.line([(270, 240), (440, 240)], fill=neon_pink, width=4)

    # 3. Varied Hotel Windows (Gold, Cyan, Dark, Silhouettes, Window Glows)
    gold_lit = (255, 210, 60) if mode == "base" else ((255, 230, 90) if mode == "feature" else (100, 160, 200))
    cyan_lit = (80, 230, 255) if mode == "base" else ((130, 245, 255) if mode == "feature" else (50, 120, 170))
    dark_win = (12, 5, 24)
    
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    
    # Hotel 1 Windows
    for wy in range(230, 580, 40):
        for wx in range(12, 120, 28):
            idx = (wx * 7 + wy * 3) % 10
            if idx in (0, 1, 2, 3): # Warm Gold
                draw.rectangle([wx, wy, wx + 16, wy + 22], fill=gold_lit)
                odraw.rectangle([wx - 4, wy - 4, wx + 20, wy + 26], fill=(255, 210, 60, 45))
            elif idx in (4, 5): # Cool Cyan
                draw.rectangle([wx, wy, wx + 16, wy + 22], fill=cyan_lit)
            elif idx == 6: # Window with Person/Curtain Silhouette
                draw.rectangle([wx, wy, wx + 16, wy + 22], fill=gold_lit)
                # Person head & shoulder silhouette inside
                draw.ellipse([wx + 4, wy + 4, wx + 11, wy + 11], fill=dark_win)
                draw.rectangle([wx + 2, wy + 11, wx + 14, wy + 22], fill=dark_win)
            else: # Dark window
                draw.rectangle([wx, wy, wx + 16, wy + 22], fill=dark_win)
                
    # Hotel 2 Windows
    for wy in range(170, 580, 36):
        for wx in range(135, 275, 26):
            idx = (wx * 11 + wy * 5) % 10
            if idx in (0, 1, 2, 3, 4): # Warm Gold (Brighter in Feature)
                draw.rectangle([wx, wy, wx + 15, wy + 20], fill=gold_lit)
                odraw.rectangle([wx - 5, wy - 5, wx + 20, wy + 25], fill=(255, 220, 80, 55))
            elif idx in (5, 6): # Cyan
                draw.rectangle([wx, wy, wx + 15, wy + 20], fill=cyan_lit)
            elif idx == 7: # Curtain Silhouette
                draw.rectangle([wx, wy, wx + 15, wy + 20], fill=gold_lit)
                draw.rectangle([wx, wy, wx + 5, wy + 20], fill=dark_win)
                draw.rectangle([wx + 10, wy, wx + 15, wy + 20], fill=dark_win)
            else: # Dark window
                draw.rectangle([wx, wy, wx + 15, wy + 20], fill=dark_win)

    # Hotel 3 Windows
    for wy in range(250, 580, 42):
        for wx in range(285, 425, 30):
            idx = (wx * 13 + wy * 7) % 10
            if idx in (0, 1, 2):
                draw.rectangle([wx, wy, wx + 18, wy + 24], fill=gold_lit)
            elif idx in (3, 4, 5):
                draw.rectangle([wx, wy, wx + 18, wy + 24], fill=cyan_lit)
            else:
                draw.rectangle([wx, wy, wx + 18, wy + 24], fill=dark_win)

    img.paste(overlay, (0, 0), overlay)

    # Entrance Canopies
    draw.polygon([(10, 570), (130, 570), (120, 610), (20, 610)], fill=(35, 15, 55))
    draw.line([(10, 570), (130, 570)], fill=neon_cyan, width=4)
    draw.polygon([(140, 560), (270, 560), (260, 605), (150, 605)], fill=(45, 12, 60))
    draw.line([(140, 560), (270, 560)], fill=neon_pink, width=5)

    # 4. Foreground Palm Trees (proper drooping fronds with midribs)
    draw_detailed_palm_tree(draw, 50, horizon_y + 80, 360, lean_right=True, mode=mode)
    draw_detailed_palm_tree(draw, 230, horizon_y + 40, 300, lean_right=False, mode=mode)
    draw_detailed_palm_tree(draw, 410, horizon_y + 120, 420, lean_right=True, mode=mode)


def draw_right_yacht_deck(draw, mode):
    """Draw right third (x=1420 to 1920) MOORED YACHT DECK.
    Features grounded teak floor in perspective, low side table under ice bucket, lounger with cushions, railing attached to deck.
    """
    deck_start_x = 1400
    horizon_y = 620
    
    # 1. Wooden Teak Planks running away from camera in perspective
    deck_bg = (38, 22, 54) if mode != "epic" else (20, 10, 32)
    draw.polygon([(deck_start_x, horizon_y + 30), (1920, horizon_y + 30), (1920, HEIGHT), (1320, HEIGHT)], fill=deck_bg)
    
    # Teak Plank wood grain lines radiating in perspective
    plank_line_col = (62, 38, 85) if mode != "epic" else (35, 18, 52)
    plank_hi_col   = (85, 52, 110) if mode != "epic" else (48, 26, 70)
    
    for px in range(1280, 2020, 40):
        # Vanishing point perspective lines
        draw.line([(1660 + (px - 1660) * 0.4, horizon_y + 30), (px, HEIGHT)], fill=plank_line_col, width=3)
        if px % 80 == 0:
            draw.line([(1660 + (px - 1660) * 0.4 + 4, horizon_y + 30), (px + 4, HEIGHT)], fill=plank_hi_col, width=2)

    # Horizontal plank joint seams
    for py in range(horizon_y + 60, HEIGHT, 45):
        scale_w = (py - horizon_y) / 460.0
        draw.line([(int(1480 - 150 * scale_w), py), (1920, py)], fill=plank_line_col, width=2)

    # 2. Rattan Lounger with Purple Cushions (x=1510..1880, y=740..960)
    rattan_col = (30, 16, 45) if mode != "feature" else (16, 8, 28)
    
    # Rattan Frame
    draw.polygon([(1530, 840), (1880, 800), (1890, 830), (1540, 880)], fill=rattan_col)
    draw.polygon([(1760, 740), (1880, 790), (1870, 820), (1750, 760)], fill=rattan_col)
    # Legs firmly on deck planks
    draw.rectangle([1540, 880, 1555, 935], fill=rattan_col)
    draw.rectangle([1720, 860, 1735, 920], fill=rattan_col)
    draw.rectangle([1870, 830, 1885, 895], fill=rattan_col)

    # Purple Cushions (#6B1186 / #9C27B0)
    cushion_base = (107, 17, 134)
    cushion_hi   = (171, 71, 188)
    cushion_shadow = (58, 8, 76)
    
    if mode == "feature": # Silhouette with warm lamp rim
        cushion_base = (40, 10, 55)
        cushion_hi = (110, 30, 120)
        cushion_shadow = (20, 4, 30)
    elif mode == "epic": # High contrast cyan rim
        cushion_base = (55, 10, 75)
        cushion_hi = (95, 20, 115)
        cushion_shadow = (25, 4, 40)

    # Flat cushion body & inclined head cushion
    draw.polygon([(1535, 830), (1765, 795), (1765, 825), (1535, 865)], fill=cushion_base)
    draw.polygon([(1765, 735), (1875, 785), (1875, 815), (1765, 765)], fill=cushion_base)
    
    # Cushion highlights & tufting creases
    draw.line([(1538, 833), (1760, 798)], fill=cushion_hi, width=4)
    draw.line([(1768, 738), (1870, 788)], fill=cushion_hi, width=4)
    for tx in range(1570, 1750, 40):
        draw.line([(tx, 820), (tx + 6, 852)], fill=cushion_shadow, width=2)

    # 3. Low Table with Ice Bucket sitting ON IT (x=1440..1520, y=770..880)
    # Low Woven Side Table
    table_top = [(1440, 800), (1515, 790), (1525, 810), (1450, 820)]
    draw.polygon(table_top, fill=(45, 24, 62) if mode != "feature" else (22, 10, 34))
    draw.polygon([(1440, 800), (1525, 810), (1525, 825), (1440, 815)], fill=rattan_col)
    # Table legs on teak floor
    draw.rectangle([1445, 815, 1458, 885], fill=rattan_col)
    draw.rectangle([1510, 810, 1522, 875], fill=rattan_col)

    # Ice Bucket sitting ON top of table surface (at y=795)
    bucket_col = (140, 230, 240) if mode != "feature" else (50, 100, 120)
    bucket_shadow = (50, 95, 110)
    draw.polygon([(1465, 745), (1495, 740), (1490, 795), (1470, 798)], fill=bucket_col)
    draw.polygon([(1465, 745), (1475, 745), (1470, 798), (1465, 798)], fill=bucket_shadow)
    
    # Champagne / Wine Bottle leaning inside bucket
    bottle_glass = (25, 90, 30)
    bottle_foil  = (255, 215, 64)
    draw.polygon([(1472, 700), (1482, 698), (1485, 745), (1470, 747)], fill=bottle_glass)
    draw.rectangle([1474, 690, 1480, 710], fill=bottle_foil)
    
    # Ice Cubes / Specular highlight
    draw.rectangle([1468, 740, 1475, 746], fill=(240, 255, 255))
    draw.rectangle([1482, 738, 1489, 744], fill=(220, 250, 255))
    if mode == "feature": # Warm lamp highlight catch
        draw.ellipse([1485, 755, 1493, 765], fill=(255, 255, 200))

    # 4. Curved White Yacht Railing anchored to Deck Floor Posts
    rail_white = (230, 236, 255)
    rail_shadow = (110, 120, 150)
    rail_cyan_rim = (0, 255, 255)
    
    if mode == "feature":
        rail_white = (130, 140, 170)
        rail_shadow = (38, 42, 60)
    elif mode == "epic":
        rail_white = (85, 95, 125)
        rail_shadow = (28, 32, 48)

    # Railing Vertical Posts firmly mounted to teak floor
    posts_x = [1430, 1590, 1750, 1890]
    for px in posts_x:
        py_top = int(655 + (px - 1380) * 0.31)
        py_bot = py_top + 135
        # Post flange base on floor
        draw.ellipse([px - 8, py_bot - 4, px + 8, py_bot + 4], fill=rail_shadow)
        draw.line([(px, py_top), (px, py_bot)], fill=rail_shadow, width=9)
        draw.line([(px - 2, py_top), (px - 2, py_bot)], fill=rail_white, width=5)
        if mode == "epic": # Cyan rim light
            draw.line([(px + 3, py_top), (px + 3, py_bot)], fill=rail_cyan_rim, width=3)

    # Top Railing Curve (Thick smooth bar)
    rail_points = []
    for rx in range(1360, 1925, 10):
        ry = int(645 + (rx - 1360) * 0.31 + math.sin((rx - 1360) * 0.005) * 15)
        rail_points.append((rx, ry))
        
    for i in range(len(rail_points) - 1):
        x1, y1 = rail_points[i]
        x2, y2 = rail_points[i+1]
        draw.line([(x1, y1 + 3), (x2, y2 + 3)], fill=rail_shadow, width=13)
        draw.line([(x1, y1), (x2, y2)], fill=rail_white, width=10)
        if mode == "epic": # Rimmed with hard cyan light
            draw.line([(x1, y1 - 4), (x2, y2 - 4)], fill=rail_cyan_rim, width=4)
            
    # Lower Railing Wire Curves
    for i in range(len(rail_points) - 1):
        x1, y1 = rail_points[i]
        x2, y2 = rail_points[i+1]
        draw.line([(x1, y1 + 55), (x2, y2 + 55)], fill=rail_white, width=5)
        draw.line([(x1, y1 + 95), (x2, y2 + 95)], fill=rail_white, width=4)


def draw_sky_and_water(draw, img, mode):
    """Draw sky, sun, ocean horizon and broken horizontal neon water reflections under city."""
    horizon_y = 620
    
    # 1. Sky Top to Horizon Gradient
    if mode == "base":
        for y in range(horizon_y):
            t = y / float(horizon_y)
            if t < 0.5:
                st = t / 0.5
                r = int(24 + (135 - 24) * st)
                g = int(8 + (18 - 8) * st)
                b = int(52 + (105 - 52) * st)
            else:
                st = (t - 0.5) / 0.5
                r = int(135 + (225 - 135) * st)
                g = int(18 + (95 - 18) * st)
                b = int(105 + (35 - 105) * st)
            draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
            
        # Draw Sun with Gradient & Radiant Halo in base game dusk
        draw_sun_with_halo(draw, img, 1150, horizon_y - 25, radius=42)

    elif mode == "feature":
        for y in range(horizon_y):
            t = y / float(horizon_y)
            r = int(6 + (22 - 6) * t)
            g = int(5 + (18 - 5) * t)
            b = int(32 + (70 - 32) * t)
            draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
            
        # Vector stars
        star_coords = [(80, 70), (200, 130), (360, 50), (440, 180), (1470, 80), (1600, 160), (1760, 60), (1850, 200)]
        for sx, sy in star_coords:
            draw.rectangle([sx, sy, sx + 2, sy + 2], fill=(255, 255, 240))

    elif mode == "epic":
        for y in range(horizon_y):
            t = y / float(horizon_y)
            r = int(10 + (35 - 10) * t)
            g = int(3 + (8 - 3) * t)
            b = int(22 + (50 - 22) * t)
            draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
            
        # Sheet lightning flash polygons behind left hotels (x=80..320)
        lightning_flash = [(60, 40), (140, 180), (110, 240), (220, 400), (180, 410), (260, 580), (200, 360), (240, 220), (170, 170)]
        draw.polygon(lightning_flash, fill=(180, 245, 255))
        draw.polygon([(x+15, y+5) for x, y in lightning_flash], fill=(255, 255, 255))

    # 2. Ocean Water Surface (y=620 to 1080)
    for y in range(horizon_y, HEIGHT):
        t = (y - horizon_y) / float(HEIGHT - horizon_y)
        if mode == "base":
            r = int(16 + (32 - 16) * t)
            g = int(5 + (10 - 5) * t)
            b = int(40 + (55 - 40) * t)
        elif mode == "feature":
            r = int(5 + (12 - 5) * t)
            g = int(5 + (14 - 5) * t)
            b = int(25 + (44 - 25) * t)
        else: # epic
            r = int(7 + (16 - 7) * t)
            g = int(2 + (6 - 2) * t)
            b = int(18 + (32 - 18) * t)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # 3. Horizontal Broken Water Reflections Under City (x=0 to 480)
    # Stretched bars of neon pink, cyan, and orange/gold breaking into dashes
    refl_pink = (255, 0, 127) if mode != "epic" else (180, 0, 90)
    refl_cyan = (0, 240, 255) if mode != "epic" else (0, 180, 200)
    refl_gold = (255, 170, 0) if mode == "base" else ((255, 220, 80) if mode == "feature" else (100, 180, 220))
    
    for ry in range(horizon_y + 5, HEIGHT, 8):
        t_water = (ry - horizon_y) / 460.0
        bar_len = int((80 - 45 * t_water))
        
        # Stretched horizontal broken bars under hotel neon columns (x=70, x=205, x=355)
        for col_x, color in [(70, refl_pink), (205, refl_cyan), (355, refl_gold)]:
            x_start = max(0, col_x - bar_len + int(math.sin(ry * 0.1) * 12))
            x_end   = min(480, col_x + bar_len + int(math.cos(ry * 0.12) * 12))
            
            if mode == "epic": # Choppy water breaks reflections into sharp shards
                draw.polygon([(x_start, ry), (x_end, ry + 2), (x_end - 10, ry + 4), (x_start + 10, ry + 2)], fill=color)
            else:
                draw.rectangle([x_start, ry, x_end, ry + 3], fill=color)


def apply_center_dark_mask(img):
    """Ensure the CENTRE 55% (x=432 to 1488) is dark, simple and empty (darker than #290A43).
    Game panel is #290A43 = RGB(41, 10, 67).
    """
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    
    # Target dark color for center (RGB 16, 4, 28 - strictly darker than #290A43)
    c_r, c_g, c_b = 16, 4, 28
    
    # Solid dark center (x=480 to 1440)
    odraw.rectangle([480, 0, 1440, HEIGHT], fill=(c_r, c_g, c_b, 205))
    
    # Soft fade at left edge (x=400..480) and right edge (x=1440..1520)
    for x in range(400, 480):
        alpha = int(205 * ((x - 400) / 80.0))
        odraw.line([(x, 0), (x, HEIGHT)], fill=(c_r, c_g, c_b, alpha))
        
    for x in range(1440, 1520):
        alpha = int(205 * (1.0 - (x - 1440) / 80.0))
        odraw.line([(x, 0), (x, HEIGHT)], fill=(c_r, c_g, c_b, alpha))
        
    img.paste(overlay, (0, 0), overlay)


def build_background(mode, filename):
    img = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)
    
    # 1. Sky, Sun, Water & Neon Reflections
    draw_sky_and_water(draw, img, mode)
    
    # 2. Left Third: Art-Deco Hotels with Varied Windows & Palm Trees
    draw_left_art_deco_hotels(draw, img, mode)
    
    # 3. Right Third: Moored Yacht Deck (Teak Floor, Table, Lounger, Railing)
    draw_right_yacht_deck(draw, mode)
    
    # 4. Apply Center Dark Mask (Keeps center 55% dark & simple for game panel)
    apply_center_dark_mask(img)
    
    # Save output
    out_path = os.path.join(BACKDROP, filename)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    img.save(out_path, "PNG")
    print(f"Generated Round 2 {filename} ({WIDTH}x{HEIGHT}) successfully -> {out_path}")


def main():
    print("Generating Hot Miami backgrounds (Round 2 detail)...")
    build_background("base", "bg_base.png")
    build_background("feature", "bg_feature.png")
    build_background("epic", "bg_epic.png")
    print("All 3 background images generated successfully!")


if __name__ == "__main__":
    main()
