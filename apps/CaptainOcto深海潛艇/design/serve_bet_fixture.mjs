import {createServer}from'vite';import {svelte}from'@sveltejs/vite-plugin-svelte';import path from'node:path';import {fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),fixture=path.join(root,'design/qa_bet_fixture/fixture.svelte.ts');
const alias=Object.fromEntries(['state-shared','utils-shared/amount','utils-event-emitter','components-ui-pixi','constants-shared/zIndex'].map(n=>[n,fixture]));
const server=await createServer({root,configFile:false,plugins:[svelte({configFile:false})],resolve:{alias},server:{host:'127.0.0.1',port:4317,strictPort:true,fs:{allow:[root,path.resolve(root,'../..')]}}});await server.listen();console.log('BET_COMPONENT_QA http://127.0.0.1:4317/design/qa_bet_fixture/index.html');
