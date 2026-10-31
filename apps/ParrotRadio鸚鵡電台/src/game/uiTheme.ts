import {GAME_FONT,GAME_FONT_WEIGHT} from './fonts';
import {setUiTheme} from 'components-ui-pixi';
import {stateConfig} from 'state-shared';
// The Medusa console proportions, with this title's own quiet palette.
setUiTheme({
 fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,
 barStyle:'framed',barHeight:210,barFrameBottom:18,barFill:0x163343,barAlpha:1,panelFill:0x12303e,panelBorder:0x171b24,
 buttonFill:0x12303e,buttonFillLight:0xe5bd69,buttonFillDisabled:0x343c46,buttonFillActive:0x8c672d,buttonBorder:0xb99756,buttonBorderWidth:2,buttonBorderWidthActive:3,buttonIconFill:0xfff4d9,buttonIconStroke:0xfff4d9,turboKeylineColor:0x12303e,
 turboButtonScale:1.16,turboIconScale:.58,railButtonScale:1.10,spinScale:.88,betFill:0x12303e,betBorder:0xd7b96f,
 labelFill:0xe5dcc9,balanceLabelFill:0xe5dcc9,winAccent:{border:0xd7b96f,label:0xffdc8a},betAccent:{border:0x171b24,label:0xe5dcc9},valueFill:0xfffaf0,valueStroke:0x171b24,valueShadow:0x11151b,
 readoutScale:.82,readoutOffsetY:-4,barMessageFill:0xd8d1c4,barMessageScale:.50,barMessageStroke:0x171b24,valuePop:.12,winFlashTint:0xffedbe,
 betBarLayout:'compactBottom',barSpriteSlice:96,activeByIconOnly:['turbo'],turboTiers:2,stepButtonScale:.46,stepButtonGap:28,stepperLayout:'flank',portraitSideButtonX:400,portraitStepButtonScale:.68,
 // Buy Bonus the Medusa way: the painted object fills its square, the caption sits on its own painted label
 // (tools/build_buybonus_plates.py prints these numbers), and hover swaps in the lit copy of the same outline.
 buyBonusOnRail:false,buyBonusButtonScale:.9,buyBonusPlateScale:1.08,buyBonusPlateInset:{width:.8,height:.86},buyBonusHighlightPad:0,buyBonusHighlightRadius:.12,buyBonusHitArea:{x:.039,y:.025,width:.923,height:.952},buyBonusLabelFill:0x3b2412,buyBonusLabelSizeRatio:.30,buyBonusLabelWrapWidth:84,buyBonusLabelOffsetX:.011,buyBonusLabelOffsetY:.377,buyBonusHoverSprite:'buyBonusGlyph',buyBonusHoverSpriteTint:0xffffff,buyBonusHoverSpriteBlend:'normal',buyBonusDisabledStyle:'dim',buyBonusIdleTint:0xffffff,buyBonusHideInFreeSpins:true,
 labelAffordance:true,labelHoverColor:0xffdc8a,labelChevronHoverColor:0xffdc8a,hoverHighlight:true,hoverPlateLight:undefined,pressFeedback:true,spinButtonGlow:false,
 platformUx:{betRepeatMs:0,betToSpinCooldownMs:500,idleReminderMs:0,idlePulseMs:2000,shortcuts:true,keybindThrottleMs:100,closePanelsOnSpin:true},
 autoSpinsCounterFill:0x12303e,autoSpinsCounterBorder:0xd7b96f,autoSpinsCounterLabel:0xfffaf0,autoSpinsCounterLabelStroke:0x171b24,
 sprites:{bar:'mgUiBarStrip',base_ticker:'mgUiTicker',buyBonus:'mgUiBuyBonus',buyBonusGlyph:'mgUiBuyBonusLit'},
 icons:{menu:'mgIconMenu',menuExit:'mgIconMenuExit',settings:'mgIconSettings',info:'mgIconInfo',payTable:'mgIconPayTable',soundOn:'mgIconSoundOn',soundOff:'mgIconSoundOff',autoSpin:'mgIconAutoSpin',increase:'mgIconIncrease',decrease:'mgIconDecrease'},iconScales:{increase:.7,decrease:.7}
});
stateConfig.explainInsufficientBalance=true;
