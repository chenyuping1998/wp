# Deadwood Express — math source

Mirror of `math-sdk/games/deadwood_express/`. Run from the SDK root with Python 3.10+:

    PYTHONPATH=. python games/deadwood_express/run.py
    PYTHONPATH=.:games/deadwood_express python -m unittest discover -s games/deadwood_express -p 'test_*.py'
    PYTHONPATH=.:games/deadwood_express python games/deadwood_express/verify_books.py

The run generates 40,000 base books and 20,000 books per buy mode, optimizes
lookup weights, generates configs and checks book hashes and payouts.
Generated `library/` output is kept in the SDK rather than this source mirror.
Regenerate frontend config and fixtures after every math change:

    python apps/DeadwoodExpress/design/sync_math_config.py /absolute/path/to/math-sdk
    python apps/DeadwoodExpress/design/sync_story_books.py

The free-spin wheel emits `multiplierWheel` after reveal and before line wins.
Its selected global multiplier applies to that spin, persists across losses and
retriggers, and resets to 1 on feature entry and exit. Premium selections are
multiples of five; both ladders cap at 200. Only base/100x/250x modes exist.

Published RTP and other gate measurements are documented in
`docs/handoff/deadwood_express.md`; target RTP alone is not a measurement.
