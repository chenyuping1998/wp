from pathlib import Path
p = Path(__file__).resolve().parent.parent / 'src/components/Game.svelte'
s = p.read_text(encoding='utf-8')
s = s.replace("\timport { BlurFilter } from 'pixi.js';\n", '')
s = s.replace("import { App, Container, Sprite, Text, REM }", "import { App, Text, REM }")
s = s.replace("\t// a touch of depth-of-field so the board reads as the subject; kept light,\n\t// because the flat cartoon scene goes muddy under a heavy blur\n\tconst backgroundBlur = [new BlurFilter({ strength: 0.6, quality: 3 })];\n", '')
start = s.index('\t<Container filters={backgroundBlur}>')
end = s.index('\n\t{#if context.stateLayout.showLoadingScreen}', start)
s = s[:start] + '\t<!-- Scene owns fixed architecture and three restrained background actions. -->\n\t<Background />\n' + s[end:]
p.write_text(s, encoding='utf-8')
print('Removed placeholder blur and dark corner overlay; game uses the new background scene.')
