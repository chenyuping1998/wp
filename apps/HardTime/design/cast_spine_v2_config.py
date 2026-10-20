"""Our articulated cast, using the repaired art from the Spine v2 brief.

The knee targets project a bend towards the camera: each sits halfway between
hip and planted ankle. Two one-bone IK constraints shorten the two segments
without forcing the knees sideways as a straight two-bone IK chain would.
"""
from copy import deepcopy


def upgrade(original):
    c = deepcopy(original)
    who = c['name']
    c['src'] = who + '_spine_v2'
    c.pop('arms_band', None)
    c['swing'] = []
    c['layer_bones'] = {'head': 'head', 'blink': 'head', 'pelvis': 'hips'}
    c['torso_layers'] = ['torso']
    c['arm_layers'] = {}
    c['chain_layers'] = {}
    if who == 'prisoner':
        c['bones'] = [b for b in c['bones'] if b[0] != 'arms']
        c['bones'][5:5] = [
            ('arm_r', 'chest', (334,452), (300,694)),
            ('fore_r', 'arm_r', (300,694), (680,585)),
            ('arm_l', 'chest', (749,457), (745,687)),
            ('fore_l', 'arm_l', (745,687), (420,615)),
        ]
        c['order'] = ['thigh_r','thigh_l','shin_r','shin_l','shoe_r','shoe_l',
                      'pelvis','torso','upper_arm_r','upper_arm_l',
                      'forearm_under','forearm_over','towel','head','blink']
        c['chain_layers']['towel'] = ['towel1','towel2']
        c['layer_bones'].update(upper_arm_r='arm_r',upper_arm_l='arm_l',
                                forearm_under='fore_r',forearm_over='fore_l')
        knees = {'l':(430,1370), 'r':(668,1370)}
    else:
        # The source looks left. Runtime mirrors this figure on the board's
        # left, so authored motion aims left and appears to aim right.
        c['dir'] = -1
        c['bones'].insert(8, ('hand_l', 'fore_l', (795,948), (779,1070)))
        # baton BEHIND the torso (2026-10-20): at rest its end is hidden behind
        # the shoulder, as in the approved art; the reaction's front overlay in
        # CastSpine.svelte draws it over everything while it swings.
        c['order'] = ['thigh_r','thigh_l','shin_r','shin_l','shoe_r','shoe_l',
                      'upper_arm_r','baton','torso','pelvis','keys','whistle',
                      'upper_arm_l','forearm_l','hand_l','radio_cord',
                      'forearm_r','fingers_r','head','blink']
        c['layer_bones'].update(upper_arm_r='arm_r',upper_arm_l='arm_l',
                                forearm_r='fore_r',forearm_l='fore_l',
                                hand_l='hand_l',baton='bat',fingers_r='fore_r')
        c['chain_layers'].update(whistle=['whistle'],radio_cord=['cord1','cord2'],keys=['keys'])
        knees = {'l':(380,1410), 'r':(632,1410)}
    c['knee_targets'] = {}
    c['shins'] = {}
    for side, (leg, foot) in c['legs'].items():
        idx = next(i for i,b in enumerate(c['bones']) if b[0] == leg)
        name,parent,hip,ankle = c['bones'][idx]
        knee = knees[side]
        shin, target = 'shin_'+side, 'knee_'+side
        c['bones'][idx:idx+1] = [(name,parent,hip,knee),
                               (shin,name,knee,ankle),
                               (target,'root',knee,None)]
        c['knee_targets'][side] = target
        c['shins'][side] = shin
        # Existing leg_l is on IMAGE LEFT, i.e. anatomical right.
        art_side = 'r' if side == 'l' else 'l'
        c['layer_bones'].update({
            'thigh_'+art_side:leg, 'shin_'+art_side:shin, 'shoe_'+art_side:foot})
    return c
