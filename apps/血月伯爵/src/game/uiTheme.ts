// Vampire artwork around GoBoomana's current control layout and UX behavior.
import {setUiTheme} from 'components-ui-pixi';
import {stateConfig} from 'state-shared';
import {GAME_FONT,GAME_FONT_WEIGHT} from './fonts';
export const uiSkin='bloodmoon';
if(typeof document!=='undefined')document.documentElement.dataset.uiSkin=uiSkin;
setUiTheme({
 fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,labelFontWeight:'600',
 valueFontFamily:'Georgia, serif',valueFontWeight:'bold',
 betBarLayout:'compactBottom',barStyle:'framed',barFill:0x0e0c17,barAlpha:1,
 panelFill:0x130e1b,panelBorder:0x8d6a50,labelFill:0xbfa98b,balanceLabelFill:0xbfa98b,
 winAccent:{border:0x8e3953,label:0xf0b5b8},betAccent:{border:0x69533f,label:0xd9c1a0},
 valueFill:0xf1e4d0,valueStroke:0x100a13,valueShadow:0x000000,
 buttonFill:0x110e1c,buttonFillLight:0xc65a73,buttonFillActive:0x701936,
 buttonFillDisabled:0x29212d,buttonBorder:0x8f7358,buttonBorderWidth:2,buttonBorderWidthActive:4,
 buttonIconFill:0xf4e5d0,buttonIconStroke:0x100b16,
 betFill:0x7e1f3d,betBorder:0xbfa276,
 autoSpinsCounterFill:0x210f1e,autoSpinsCounterBorder:0xb99469,
 autoSpinsCounterLabel:0xf9e9cc,autoSpinsCounterLabelStroke:0x160b17,
 spinButtonGlow:true,winFlashTint:0xe8a6ae,valuePop:.12,
 hoverHighlight:true,pressFeedback:true,labelAffordance:true,
 stepButtonScale:.36,stepButtonGap:28,portraitStepButtonScale:.68,portraitSideButtonX:440,
 buyBonusOnRail:false,buyBonusButtonScale:.8,buyBonusBoxAspect:1.12,
 buyBonusPlateScale:1.10,buyBonusPlateChrome:false,buyBonusCornerRadius:8,
 buyBonusLabelFill:0xf0d6b1,buyBonusLabelSizeRatio:.5,buyBonusLabelWrapWidth:106,
 buyBonusLabelOffsetY:.025,buyBonusIdleTint:0xffffff,
 buyBonusDisabledStyle:'dim',buyBonusDisabledFill:0x1a0c1a,buyBonusDisabledTint:0xa99aab,
 buyBonusHoverSprite:'buyBonusGlyph',buyBonusHoverSpriteBlend:'normal',buyBonusHoverSpriteTint:0xffffff,
 buyBonusPlateInset:{width:.87,height:.87},buyBonusHighlightPad:0,buyBonusHighlightRadius:.06,
 barSpriteSlice:96,
 sprites:{bar:'bmChrome_bar',bet:'bmChrome_spin',button:'bmChrome_button',buttonActive:'bmChrome_button-active',buyBonus:'bmChrome_buy',buyBonusGlyph:'bmChrome_buy-lit'},
 icons:{menu:'gbIconMonoMenu',menuExit:'gbIconMonoMenuExit',settings:'gbIconMonoSettings',info:'gbIconMonoInfo',payTable:'gbIconMonoPayTable',soundOn:'gbIconMonoSoundOn',soundOff:'gbIconMonoSoundOff',autoSpin:'gbIconMonoAutoSpin',replay:'gbIconMonoReplay'},
 platformUx:{betRepeatMs:150,betToSpinCooldownMs:500,idleReminderMs:30000,idlePulseMs:2000,shortcuts:true,keybindThrottleMs:100,closePanelsOnSpin:true},
});
stateConfig.explainInsufficientBalance=true;
