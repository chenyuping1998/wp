# Hot Miami — maths source

The game's maths lives here so it is versioned with the frontend it feeds. It is
a copy of `math-sdk/games/hot_miami/`; the SDK itself is a separate checkout of
`StakeEngine/math-sdk` and is not part of this repo.

To regenerate books and lookup tables, copy this directory back into an SDK
checkout and run it from the SDK root (it imports `src.*` and needs Python 3.10+
for `match`):

    cp -R apps/HotMiami/math/ <sdk>/games/hot_miami/
    cd <sdk> && PYTHONPATH=. python games/hot_miami/run.py

`library/` — books, lookup tables, publish files, stat sheets — is deliberately
not copied. It is ~140 MB of generated output and is rebuilt by that command.

Before uploading the result, run the bundle gate. It exists because a bundle was
once copied out of `library/publish_files/` while the optimiser was still
writing it, which shipped two modes with the previous run's lookup tables and was
rejected by Stake as `ERR_MATH_OUTSIDE_RANGE`:

    python apps/HotMiami/design/check_math_bundle.py <upload>/math
