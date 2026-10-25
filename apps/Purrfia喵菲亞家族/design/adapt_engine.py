from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
def edit(rel,fn):
 p=ROOT/rel;p.write_text(fn(p.read_text(encoding='utf8')),encoding='utf8')

def constants(s):
 a=s.index('export const INITIAL_BOARD:');b=s.index('export const BOARD_DIMENSIONS',a)
 s=s[:a]+"const OPENING_SYMBOLS = ['H1','H2','H3','H4','L1','L2','L3','L4'] as const;\nexport const INITIAL_BOARD: RawSymbol[][] = Array.from({length:7},(_,reel)=>Array.from({length:9},(_,row)=>({name:OPENING_SYMBOLS[(reel*3+row)%8]})));\n\n"+s[b:]
 s=s.replace('export const SYMBOL_SIZE = 98','export const SYMBOL_SIZE = 84').replace('export const BOARD_CELL_COLOR = 0x1e4950','export const BOARD_CELL_COLOR = 0x2a1e1a')
 s=re.sub(r'\n\tH5: mixedSymbol[^\n]+','',s)
 s=s.replace("\tS: mixedSymbol('mgS', SPECIAL_RATIOS),","\tS: mixedSymbol('mgS', SPECIAL_RATIOS),\n\tM: mixedSymbol('mgM', HIGH_RATIOS),\n\tW: mixedSymbol('mgW', HIGH_RATIOS),")
 return s
edit('src/game/constants.ts',constants)
edit('src/game/types.ts',lambda s:s.replace('scatter?: boolean;','scatter?: boolean;\n\tmultiplier?: number;\n\tbox?: boolean;'))
edit('src/game/stateGame.svelte.ts',lambda s:s.replace("import type { GameType, RawSymbol }", "import { emptyTerritory } from './territory';\nimport type { GameType, RawSymbol }").replace('\tmedusaTotal: 0,',"\tcellMults: emptyTerritory(),\n\topeningBoxes: [] as {reel:number;row:number}[],\n\tbossPose: 'idle',"))
def actor(s):
 a=s.index('\t\t// Safety net');b=s.index('\t\tstateGame.tumbleWin',a)
 return s[:a]+"\t\tif (stateGame.gameType === 'basegame') stateGame.cellMults = emptyTerritory();\n"+s[b:]
edit('src/game/actor.ts',lambda s:actor(s).replace("import config from './config';","import config from './config';\nimport { emptyTerritory } from './territory';"))
def booktypes(s):
 a=s.index('type BookEventMedusaThrow');b=s.index('/** 4+',a)
 s=s[:a]+"type BookEventBoxOpen = { index:number; type:'boxOpen';symbol:SymbolName;boxes:(Position & {multiplier?:number})[] };\ntype BookEventCellMults = {index:number;type:'cellMults';cells:(Position & {mult:number})[]};\n\n"+s[b:]
 s=s.replace('| BookEventMedusaThrow','| BookEventBoxOpen\n\t| BookEventCellMults').replace('globalMult: number;','stampMult?: number;\n\t\t\tcellMult?: number;\n\t\t\tglobalMult: number;')
 return s
edit('src/game/typesBookEvent.ts',booktypes)
def handlers(s):
 s=s.replace("import { featureTotal } from './featureTotal';","import { featureTotal } from './featureTotal';\nimport { emptyTerritory, applyCellChanges, territoryBeforeReveal, replayTerritory } from './territory';")
 s=re.sub(r"\s*eventEmitter\.broadcast\(\{\s*type: 'soundMedusa'[^;]+;",'',s)
 s=re.sub(r"\s*eventEmitter\.broadcast\(\{\s*type: 'medusaAction'[^;]+;",'',s)
 s=re.sub(r"\s*eventEmitter\.broadcast\(\{\s*type: 'medusaPose'[^;]+;",'',s)
 s=re.sub(r"\s*eventEmitter\.broadcast\(\{\s*type: 'medusaTotal(?:Show|Hide)'[^;]+;",'',s)
 s=s.replace('stateGame.medusaTotal = 0;',"stateGame.cellMults = emptyTerritory();")
 s=s.replace('stateGame.gameType = bookEvent.gameType;',"stateGame.gameType = bookEvent.gameType;\n\t\tstateGame.cellMults = territoryBeforeReveal(stateGame.cellMults, bookEvent.gameType);\n\t\tstateGame.bossPose = 'idle';")
 a=s.index('\tmedusaThrow:');b=s.index('\n\t/** 4+',a)
 s=s[:a]+"""\tboxOpen: async (bookEvent: BookEventOfType<'boxOpen'>) => {
        stateGame.bossPose = bookEvent.symbol === 'W' ? 'stamp' : 'monocle';
        stateGame.openingBoxes = bookEvent.boxes;
        await waitForTimeout(stateBet.isTurbo ? 220 : 480);
        for (const box of bookEvent.boxes) {
            const symbol = stateGame.board[box.reel]?.reelState.symbols[box.row];
            if (!symbol) throw Error('boxOpen position outside board');
            symbol.rawSymbol = { name: bookEvent.symbol, ...(bookEvent.symbol === 'W' ? {wild:true,multiplier:box.multiplier??1} : {}) };
            symbol.symbolState = 'static';
        }
        await waitForTimeout(stateBet.isTurbo ? 180 : 300);
        stateGame.openingBoxes = [];
        stateGame.bossPose = 'idle';
    },
    cellMults: async (bookEvent: BookEventOfType<'cellMults'>) => {
        stateGame.cellMults = applyCellChanges(stateGame.cellMults, bookEvent.cells);
    },
"""+s[b:]
 a=s.index('\tcreateBonusSnapshot:')
 s=s[:a]+"""\tcreateBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
        const events=bookEvent.bookEvents;
        const last = <T extends BookEvent['type']>(type:T) => [...events].reverse().find(e=>e.type===type) as BookEventOfType<T>|undefined;
        const trigger=last('freeSpinTrigger'), count=last('updateFreeSpin'), total=last('setTotalWin');
        if(trigger) await playBookEvent(trigger,{bookEvents:events});
        if(count) await playBookEvent(count,{bookEvents:events});
        if(total) await playBookEvent(total,{bookEvents:events});
        stateGame.cellMults=replayTerritory(events);
        const reveal=last('reveal');
        if(reveal){
            let board=structuredClone(reveal.board);
            // Reconstruct all board changes before reconnect without replaying payouts.
            for(const event of events.filter(e=>e.index>reveal.index)){
                if(event.type==='boxOpen') for(const box of event.boxes) board[box.reel][box.row]={name:event.symbol,...(event.symbol==='W'?{wild:true,multiplier:box.multiplier??1}:{})};
                if(event.type==='tumbleBoard') board=board.map((column,reel)=>planCascadeColumn(column,event.explodingSymbols.filter(p=>p.reel===reel).map(p=>p.row),event.newSymbols[reel]??[],BOARD_DIMENSIONS.y).column);
            }
            stateGameDerived.enhancedBoard.settle(board);
            stateGame.gameType=reveal.gameType;
        }
    },
};
"""
 s=s.replace("import { featureTotal }", "import { planCascadeColumn } from './symbolMotion';\nimport { featureTotal }")
 return s
edit('src/game/bookEventHandlerMap.ts',handlers)
def utils(s):
 a=s.index('const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT');b=s.index('export const convertTorResumableBet',a)
 s=s[:a]+"const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = ['freeSpinTrigger','updateFreeSpin','setTotalWin','reveal','boxOpen','cellMults','tumbleBoard','freeSpinEnd','finalWin'];\n\n"+s[b:]
 return s
edit('src/game/utils.ts',utils)
def game(s):
 s=re.sub(r"\s*import Medusa(?:Throw)? from '[^']+';",'',s)
 s=s.replace("import Board from './Board.svelte';","import Board from './Board.svelte';\nimport Territory from './Territory.svelte';\nimport DonWhiskers from './DonWhiskers.svelte';")
 s=s.replace('<Medusa />','<DonWhiskers />\n\t\t\t<Territory />').replace('<MedusaThrow />','')
 return s
edit('src/components/Game.svelte',game)
edit('src/game/typesEmitterEvent.ts',lambda s:re.sub(r"\nimport type \{ EmitterEventMedusa(?:Throw)? \}[^\n]+",'',s).replace('\n\t| EmitterEventMedusaThrow','').replace('\n\t| EmitterEventMedusa;',';'))
edit('src/components/FeatureIntro.svelte',lambda s:s.replace('const maxFree = Math.max(...config.medusa.freeValues);','').replace("title: 'TURN TO STONE'","title: 'CONNECTED CLUSTERS'").replace('8+ of a symbol anywhere','5+ matching symbols connected up, down, left or right').replace('Winners crumble','Winners clear').replace('"MEDUSA\'S GAZE"',"'MYSTERY BOXES'").replace('On a spin with a win, her multiplier scales the whole spin.','All boxes open into the same symbol before each evaluation.').replace('Her multipliers, up to ${maxFree}×, add to a total that never resets.','Stamp wilds add multipliers. Territory grows up to ×128 and stays throughout the feature.'))
edit('src/game/uiTheme.ts',lambda s:s.replace('0x1e4950','0x2a1e1a').replace('0x173a40','0x141826').replace('0xe8725e','0xf2c14e').replace('0x2a1f24','0x1e1714'))
edit('src/components/TumbleLayer.svelte',lambda s:s.replace('stoneFilter.desaturate(); stoneFilter.brightness(0.96, true);','stoneFilter.brightness(1, false);'))
print('Engine adapted.')
