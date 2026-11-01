# Static Shift Ink3 verification

## Ink3 implementation — 2026-10-19

Implemented ART_REQUEST_INK3.md mandatory redraws with the built-in imagegen tool: flat enamel Relay and microphone; older, specific Selector face; rounded Caller ear with exactly three hoops; expressive laughing FG host with freckles. MG shoes and L5 retain the earlier brand-detail corrections; the optional L5 redraw was not needed for this pass. Raw sources and prompt briefs: design/source-v3/generation.json. Re-export: integrate_ink3.py, then retouch_brand_details.py, build_store_v2.py, SKIP_STUB=1 zsh design/ship.sh. Re-running the v2 extractor now reapplies v3, preventing accidental rollback.

All five exports pass soft <=30%: W26.7%, L3 19.0%, H2 25.7%, H3 27.9%, FG26.9%. See qa/ink3-style.png for 180px/70px/greyscale comparisons. The host keeps a629x1122 canvas and existing normalized mesh anchors: sampled silhouette-boundary movement below0.96% of width. These samples establish close pose preservation, not pixel identity. Geometry checks pass with feet pinned during idle/reactions; no rig table changed.

Final build gates pass, including assets/audio/social/undefined references/motion/plaque mesh. Seven existing shared type errors remain at the established baseline. All107 staged frontend checksums match; all seven math files match publish_files and all five new runtime PNGs match source exports. New cover FG is built from the revised host; refreshed thumbnail and cover layers are included. Store brightness: thumbnail176.7 / dark2.9%; cover167.2 / dark4.7%. Main-game browser check confirms new H2/H3/L3 sprites load. Local review uses books and a simulated wallet; real platform/RGS remains unverified.

Backup: _upload_backups/StaticShift-before-ink3-20261019.tgz and research/staticshift/before-ink3. Local package: upload/StaticShift. PLATFORM NOT UPDATED.

Final browser evidence: ink3-base.png shows revised H2/H3 and enamel mic on the board; ink3-feature.png shows new Relay and host during superbonus spin6/10. Entry and390x844 intro checked; ink3-phone.png records stacked cards. The older MutationObserver navigation error is still present in the browser history (also recorded before this pass); no claim of a clean console across every navigation. Cover and thumbnail composites visually inspected at200px.
