"""Measured skeletons for the continuous-mesh casts (Saucer / Putt, 2026-10-17).

Coordinates are on the 560x912 canvas of design/source/<theme>/cast/<cast>/
normalized.png (y down), read off its 20px grid. Chains are polylines with a
half-width per point; each segment belongs to one bone and neighbouring
segments blend across the joint. Appendages are polygons with a pivot: their
weight fades in with distance from the pivot, the rest staying on `parent`.

`prop` names the arm that holds the character's thing (the one that acts), and
`out` the sign that swings that arm away from the body (Spine: + is CCW).

Optional (2026-10-17, Saucer):
  teeth_split  y on the canvas below the nose: build_cast_mesh.py composes a
               toothy laugh cel (registered/laugh_teeth.png) from laugh_peak's
               squeezed eyes above it and grin's bared teeth below, and the
               laugh shows it on every HA
  teeth_hold   keep laugh_teeth on from the first HA to the last (no
               closed-mouth frames between beats; Saucer, 2026-10-23)
  laugh_gain   how much harder the body shakes while laughing (1 = as before)
  cut          (2026-10-23, Putt mg) a folder beside normalized.png holding the
               arms cut off as pieces (cels/, parts/, cut.json): the mesh drops
               its arm chains and the pieces hang on IK arms in front of it
"""

SPEC = {
    ('saucer', 'mg'): dict(  # the captain: dome helmet, remote in his left fist, cape, tail
        spine=[((255, 640), 60, 'hip'), ((255, 560), 72, 'hip'), ((260, 470), 80, 'torso'), ((262, 335), 70, 'head'), ((255, 230), 110, 'head'), ((250, 125), 90, None)],
        legs=dict(L=[(215, 590), (190, 670), (178, 760), (150, 860)], R=[(300, 590), (340, 670), (368, 760), (400, 860)], hw=34),
        arms=dict(L=[(190, 380), (148, 458), (100, 520), (45, 430)], R=[(358, 385), (392, 478), (412, 545), (420, 612)], hw=27),
        prop='L', out=-1, teeth_split=237, teeth_hold=True, laugh_gain=2.0,
        # 2026-10-23: both forearms, the hands and the remote are pieces on the
        # mesh's arm bones (the app's design/arms/), so he can act with them
        cut='arms',
        apps=[
            dict(name='antenna', parent='head', pivot=(222, 132), tip=(192, 55), poly=[(175, 40), (215, 40), (240, 128), (205, 132)], ramp=30, flip=1),
            dict(name='cape', parent='torso', pivot=(345, 360), tip=(515, 445), poly=[(318, 342), (420, 345), (525, 440), (470, 455), (420, 480), (380, 470), (372, 400)], ramp=60, flip=1),
            dict(name='tail', parent='hip', pivot=(388, 618), tip=(500, 690), poly=[(380, 605), (440, 625), (520, 640), (545, 690), (515, 725), (455, 715), (400, 650)], ramp=50, flip=-1),
        ]),
    ('saucer', 'fg'): dict(  # the farm kid: pot hat with antenna, torch in his left hand, net on his back
        spine=[((270, 660), 60, 'hip'), ((268, 575), 70, 'hip'), ((262, 480), 72, 'torso'), ((248, 370), 70, 'head'), ((240, 255), 120, 'head'), ((250, 150), 110, None)],
        legs=dict(L=[(225, 610), (205, 700), (195, 790), (170, 860)], R=[(312, 610), (350, 700), (385, 790), (420, 860)], hw=36),
        arms=dict(L=[(198, 448), (150, 515), (128, 558), (50, 625)], R=[(355, 445), (388, 515), (405, 590), (410, 640)], hw=28),
        prop='L', out=-1, teeth_split=289, teeth_hold=True, laugh_gain=2.0,
        # 2026-10-23: the torch arm (forearm, hand, torch) is pieces (design/arms/)
        cut='arms',
        apps=[
            dict(name='antenna', parent='head', pivot=(262, 140), tip=(250, 62), poly=[(232, 50), (272, 50), (282, 140), (245, 145)], ramp=26, flip=1),
            dict(name='net', parent='torso', pivot=(378, 410), tip=(500, 460), poly=[(380, 330), (400, 180), (470, 168), (505, 230), (540, 480), (510, 498), (430, 420), (390, 395)], ramp=70, flip=1),
            dict(name='tail', parent='hip', pivot=(395, 600), tip=(510, 590), poly=[(388, 590), (450, 640), (510, 670), (540, 610), (515, 540), (470, 548), (455, 600), (410, 620)], ramp=50, flip=-1),
        ]),
    ('putt', 'mg'): dict(  # the golfer: flat cap with pompom, putter in his left hand, towel at the belt
        spine=[((275, 610), 70, 'hip'), ((272, 520), 95, 'hip'), ((265, 420), 100, 'torso'), ((258, 305), 80, 'head'), ((250, 200), 120, 'head'), ((235, 95), 90, None)],
        legs=dict(L=[(230, 600), (232, 685), (240, 785), (200, 850)], R=[(330, 600), (360, 690), (378, 790), (420, 850)], hw=36),
        arms=dict(L=[(168, 338), (118, 440), (95, 560), (62, 850)], R=[(395, 350), (422, 452), (450, 560), (465, 612)], hw=28),
        prop='L', out=-1, teeth_split=237, laugh_gain=2.0,
        # 2026-10-23: arms and putter are pieces (design/swing/), so he can swing
        cut='swing',
        apps=[
            dict(name='pompom', parent='head', pivot=(220, 118), tip=(205, 66), poly=[(176, 60), (234, 60), (240, 106), (180, 108)], ramp=22, flip=1),
            dict(name='towel', parent='hip', pivot=(360, 498), tip=(372, 640), poly=[(336, 488), (388, 488), (408, 640), (342, 644)], ramp=34, flip=1),
            dict(name='tail', parent='hip', pivot=(420, 520), tip=(515, 450), poly=[(410, 500), (460, 455), (505, 420), (535, 460), (510, 510), (440, 545)], ramp=40, flip=-1),
        ]),
    ('putt', 'fg'): dict(  # the caddie: visor, flag in his left hand, golf bag on his back
        spine=[((262, 610), 60, 'hip'), ((260, 520), 75, 'hip'), ((252, 430), 78, 'torso'), ((242, 330), 70, 'head'), ((212, 230), 120, 'head'), ((205, 120), 100, None)],
        legs=dict(L=[(222, 600), (225, 700), (240, 790), (205, 860)], R=[(300, 600), (322, 700), (345, 795), (380, 860)], hw=34),
        arms=dict(L=[(178, 420), (130, 470), (78, 482), (62, 300)], R=[(352, 400), (372, 500), (395, 595), (398, 655)], hw=27),
        prop='L', out=-1, teeth_split=269, laugh_gain=2.0,
        # 2026-10-23: the flag hand and pennant are pieces on foreL (design/swing/)
        cut='swing',
        # the golf bag is strapped to his back: it rides the torso, not the arm in front of it
        extras=[('torso', [(300, 330), (445, 312), (470, 360), (472, 655), (430, 672), (405, 600), (330, 640)], 2)],
        apps=[
            dict(name='clubs', parent='torso', pivot=(420, 325), tip=(470, 175), poly=[(360, 330), (378, 165), (470, 150), (518, 210), (512, 322), (450, 334)], ramp=40, flip=1),
            dict(name='towel', parent='torso', pivot=(450, 360), tip=(468, 560), poly=[(430, 352), (472, 352), (498, 560), (440, 565)], ramp=30, flip=1),
            dict(name='tail', parent='hip', pivot=(396, 615), tip=(515, 600), poly=[(390, 605), (450, 662), (512, 650), (530, 590), (500, 575), (470, 600), (420, 625)], ramp=45, flip=-1),
        ]),
}
