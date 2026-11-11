#!/usr/bin/env python3
"""Upload + publish the Sumo Monkey FRONTEND only (math untouched) through `stakecli mcp`.

    python3 -I design/upload_publish_front.py --dry-run     # validate + plan only
    python3 -I design/upload_publish_front.py               # validate, plan, execute, scratch check, publish

Stone 2026-11-09 21:45: the thick-limb continuation is to go all the way through upload and publish without
asking (→ front v14). Stone 2026-11-10 「要」 (UI fixes + new A/J → v15) and 「上傳發布」 (armpit/glove fix + bigger cast). Each run needs
its own go-ahead. No approval is open, so update_approval_version is never set. Never prints tokens or the SID.
Log: $SUMO_UPLOAD_LOG (default: the thick-limb backup folder).
Guards: refuses a plan that deletes more than 5 files or uploads more than 80 (expected: ~31 up, 1 delete).
"""
import json, sys, time
sys.path.insert(0, '/Users/stone/stake-engine/new-games/wild-alchemy/qa')
from stakecli_mcp import Client, text_of  # noqa: E402

TEAM, GAME, KIND = 'silver-stars', 'sumo-monkey', 'front'
PATH = '/Users/stone/stake-engine/upload/SumoMonkey/frontend'
LOG = __import__('os').environ.get('SUMO_UPLOAD_LOG',
                                   '/Users/stone/stake-engine/_upload_backups/SumoMonkey-before-thicklimbs-20261110/upload_log.json')


def call(c, name, args):
    res = c.request('tools/call', {'name': name, 'arguments': args})
    text = text_of(res)
    if res.get('isError'):
        raise SystemExit(f'{name} failed: {text[:1500]}')
    try:
        return json.loads(text)
    except Exception:
        return {'text': text}


def versions_of(g):
    """latest version per type + approval state from get_game"""
    game = g.get('game', {})
    latest = {}
    for v in game.get('versions', []):
        t = v.get('type')
        if t and v.get('version', -1) > latest.get(t, {}).get('version', -1):
            latest[t] = {'version': v.get('version'), 'created': v.get('created'), 'approved': v.get('approved')}
    return {'latest': latest, 'approval': game.get('detail', {}).get('approval')}


def main():
    dry = '--dry-run' in sys.argv
    log = {'time': time.strftime('%Y-%m-%d %H:%M:%S'), 'dry_run': dry}
    c = Client(); c.start()
    try:
        before = call(c, 'get_game', {'team': TEAM, 'game': GAME})
        log['before'] = versions_of(before)
        print('before:', json.dumps(log['before'], ensure_ascii=False)[:900])
        v = call(c, 'validate_upload_path', {'path': PATH})
        print('validate:', {k: v.get(k) for k in ('valid', 'warnings', 'file_count', 'total_bytes') if k in v})
        if not v.get('valid', False):
            raise SystemExit('path not valid for upload')
        plan = call(c, 'plan_upload', {'team': TEAM, 'game': GAME, 'type': KIND, 'path': PATH})
        plan_id = plan.get('plan_id') or plan.get('planId')
        up, de = len(plan.get('upload') or []), len(plan.get('delete') or [])
        counts = {'upload': up, 'delete': de, 'copy': len(plan.get('copy') or []), 'unchanged': len(plan.get('unchanged') or []),
                  'total_upload_size': plan.get('total_upload_size'), 'deleted': [d.get('path') for d in plan.get('delete') or []]}
        log['plan'] = counts
        print('plan:', counts)
        if de > 5 or up > 80:
            raise SystemExit(f'plan looks wrong for a cast-only change (upload {up}, delete {de}); not executing')
        if not plan_id:
            raise SystemExit('no plan_id: ' + json.dumps(plan)[:800])
        if dry:
            return
        t0 = time.time()
        exe = call(c, 'execute_upload', {'team': TEAM, 'game': GAME, 'type': KIND, 'path': PATH, 'plan_id': plan_id})
        op = exe.get('operation_id') or exe.get('operationId')
        print('execute:', {k: exe.get(k) for k in ('status', 'operation_id', 'uploaded_files', 'uploaded_bytes') if k in exe}, f'{time.time() - t0:.0f}s')
        if op and exe.get('status') not in ('completed', 'succeeded', 'done'):
            for _ in range(720):
                st = call(c, 'get_upload_process', {'operation_id': op})
                if st.get('status') in ('completed', 'succeeded', 'done', 'failed', 'cancelled', 'error'):
                    print('process:', {k: st.get(k) for k in ('status', 'files_done', 'files_total', 'error') if k in st})
                    if st.get('status') not in ('completed', 'succeeded', 'done'):
                        raise SystemExit('upload did not complete: ' + json.dumps(st)[:1200])
                    break
                time.sleep(5)
        log['execute'] = {k: exe.get(k) for k in ('status', 'uploaded_files', 'uploaded_bytes') if k in exe}
        scratch = call(c, 'list_scratch_files', {'team': TEAM, 'game': GAME, 'type': KIND})
        files = scratch.get('files') or scratch.get('items') or []
        log['scratch_files'] = len(files)
        print('scratch files:', len(files))
        replan = call(c, 'plan_upload', {'team': TEAM, 'game': GAME, 'type': KIND, 'path': PATH})
        log['replan'] = {'upload': len(replan.get('upload') or []), 'delete': len(replan.get('delete') or []),
                         'unchanged': len(replan.get('unchanged') or [])}
        print('replan (should be 0 to upload / delete):', log['replan'])
        if log['replan']['upload'] or log['replan']['delete']:
            raise SystemExit('scratch does not match the staged frontend; not publishing')
        pub = call(c, 'publish', {'team': TEAM, 'game': GAME, 'type': KIND, 'path': PATH, 'confirm': True})
        log['publish'] = pub
        print('publish:', json.dumps(pub, ensure_ascii=False)[:700])
        after = call(c, 'get_game', {'team': TEAM, 'game': GAME})
        log['after'] = versions_of(after)
        print('after:', json.dumps(log['after'], ensure_ascii=False)[:900])
    finally:
        c.close()
        with open(LOG, 'a') as f:
            f.write(json.dumps(log, ensure_ascii=False, default=str) + '\n')


if __name__ == '__main__':
    main()
