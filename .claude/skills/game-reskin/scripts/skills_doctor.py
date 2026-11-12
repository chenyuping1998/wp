#!/usr/bin/env python3
"""製程 skill 體檢：正本只有一份，這支檢查其他副本和引用有沒有走鐘。

    skills_doctor.py                 只報告
    skills_doctor.py --sync-worktrees   把正本複製到「副本是正本舊版」的 worktree（有自己修改的不動）

檢查四件事：
  1. 各 worktree 的 .claude/skills 副本和正本（wp/.claude/skills）是否相同。
     2026-11-10：wp-banandit 的 game-reskin 停在 10-25、只有正本一半；在那棵樹工作的
     session 讀到的是舊規則。
  2. 五份 skill 開頭共用的「零可見缺陷交付門檻」段落是否逐字相同（曾各自加註而漂移）。
  3. skill 文件裡寫到的本機路徑是否還存在（搬家、改名後的死連結）。
  4. Codex 那邊的同步副本是否落後（落後就跑 ~/.codex/skills/sync_claude_skills.py）。

Exit 1 if 第 2 項不一致或有死連結；副本過期只警告。
"""

from __future__ import annotations

import argparse
import hashlib
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path("/Users/stone/stake-engine")
CANON = ROOT / "wp/.claude/skills"
WP_SKILLS = ["game-reskin", "stake-engine-slot", "mesh-cast-rig"]
ALL_SKILLS = {
    "game-reskin": CANON / "game-reskin",
    "stake-engine-slot": CANON / "stake-engine-slot",
    "mesh-cast-rig": CANON / "mesh-cast-rig",
    "hacksaw-character-motion": Path.home() / ".claude/skills/hacksaw-character-motion",
    "xinstar-spec": Path.home() / ".claude/skills/xinstar-spec",
    "spine-character": Path.home() / "tools/spine-generator/skills/spine-character",
}
GATE_HEADING = "## 角色美術與動作：零可見缺陷交付門檻"
GATE_SKILLS = ["game-reskin", "stake-engine-slot", "mesh-cast-rig", "hacksaw-character-motion", "spine-character"]
SKIP = {"__pycache__", "node_modules", ".git", ".DS_Store"}


def files(d: Path) -> dict[str, str]:
    out = {}
    for p in sorted(d.rglob("*")):
        if p.is_file() and not (set(p.parts) & SKIP) and p.suffix != ".pyc" and p.name != ".DS_Store":
            out[str(p.relative_to(d))] = hashlib.sha256(p.read_bytes()).hexdigest()
    return out


def worktrees() -> list[Path]:
    try:
        out = subprocess.run(["git", "-C", str(ROOT / "wp"), "worktree", "list", "--porcelain"],
                             capture_output=True, text=True, timeout=30).stdout
    except Exception:  # noqa: BLE001
        return []
    return [Path(l.split(" ", 1)[1]) for l in out.splitlines() if l.startswith("worktree ")]


def in_canon_history(rel: str, blob_sha: str) -> bool:
    """True when this exact file content was once the canonical file (so the copy is just old).

    Only the canonical branch's own history counts (HEAD of the main wp tree): --all would also
    match blobs that exist only on the worktree's branch, i.e. its own edits.
    """
    try:
        out = subprocess.run(["git", "-C", str(ROOT / "wp"), "log", "HEAD", "--format=%H", "--", f".claude/skills/{rel}"],
                             capture_output=True, text=True, timeout=60).stdout.split()
        for commit in out:
            got = subprocess.run(["git", "-C", str(ROOT / "wp"), "rev-parse", f"{commit}:.claude/skills/{rel}"],
                                 capture_output=True, text=True, timeout=15).stdout.strip()
            if got == blob_sha:
                return True
    except Exception:  # noqa: BLE001
        pass
    return False


def git_blob(p: Path) -> str:
    return subprocess.run(["git", "hash-object", str(p)], capture_output=True, text=True, timeout=15).stdout.strip()


def check_worktrees(sync: bool) -> int:
    print("1. worktree 副本 vs 正本（wp/.claude/skills）")
    stale = 0
    for wt in worktrees():
        if wt.resolve() == (ROOT / "wp").resolve():
            continue
        base = wt / ".claude/skills"
        if not base.exists():
            print(f"   {wt.name}: 沒有副本（OK：會讀正本）")
            continue
        for name in WP_SKILLS:
            copy = base / name
            if not copy.exists():
                continue
            a, b = files(CANON / name), files(copy)
            diff = sorted(k for k in set(a) | set(b) if a.get(k) != b.get(k))
            if not diff:
                print(f"   {wt.name}/{name}: 相同")
                continue
            skill_md = copy / "SKILL.md"
            if skill_md.exists() and "正式來源優先" in skill_md.read_text(encoding="utf-8", errors="replace"):
                print(f"   {wt.name}/{name}: 舊的工作副本，開頭已標「以正本為準」（OK，內容不要再往這份加）")
                continue
            stale += 1
            only_copy = [k for k in diff if k not in a]
            changed = [k for k in diff if k in a and k in b]
            unique = [k for k in changed if not in_canon_history(f"{name}/{k}", git_blob(copy / k))]
            if unique or only_copy:
                print(f"   {wt.name}/{name}: 過期，而且有正本沒有的內容 → 先人工 diff："
                      f"{', '.join((unique + only_copy)[:5])}")
            else:
                print(f"   {wt.name}/{name}: 過期（{len(diff)} 檔不同，全是正本的舊版）", end="")
                if sync:
                    for k in a:
                        dst = copy / k
                        dst.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(CANON / name / k, dst)
                    print(" → 已同步")
                else:
                    print(" → 可用 --sync-worktrees 覆蓋")
        extra = sorted(p.name for p in base.iterdir() if p.is_dir() and p.name not in WP_SKILLS)
        if extra:
            print(f"   {wt.name}: 另有只在這棵樹的 skill：{', '.join(extra)}")
    return stale


def gate_block(skill_md: Path) -> str:
    text = skill_md.read_text(encoding="utf-8")
    if GATE_HEADING not in text:
        return ""
    body = text.split(GATE_HEADING, 1)[1]
    body = re.split(r"\n## ", body, 1)[0]
    return re.sub(r"\s+", " ", body).strip()


def check_gate() -> int:
    print("\n2. 「零可見缺陷交付門檻」五份是否逐字相同")
    blocks = {n: gate_block(ALL_SKILLS[n] / "SKILL.md") for n in GATE_SKILLS if (ALL_SKILLS[n] / "SKILL.md").exists()}
    ref_name = "game-reskin"
    ref = blocks.get(ref_name, "")
    bad = 0
    for n, b in blocks.items():
        if not b:
            print(f"   {n}: 沒有這一段")
            bad += 1
        elif b != ref:
            bad += 1
            print(f"   {n}: 和 {ref_name} 不同（{len(b)} vs {len(ref)} 字）")
        else:
            print(f"   {n}: 相同")
    return bad


PATH_RE = re.compile(r"`((?:/Users/stone|~)/[^`\s*<>|]+)`")


def check_paths() -> int:
    print("\n3. 文件裡寫到的本機絕對路徑")
    missing = []
    for name, d in ALL_SKILLS.items():
        if not d.exists():
            print(f"   {name}: skill 資料夾不存在 {d}")
            missing.append((name, str(d)))
            continue
        for md in [p for p in d.rglob("*.md") if not (set(p.parts) & SKIP)]:
            for m in PATH_RE.finditer(md.read_text(encoding="utf-8", errors="replace")):
                raw = m.group(1).rstrip(".,;:)）」")
                if any(c in raw for c in "<>[]{}*$") or "…" in raw:
                    continue  # 範本路徑
                p = Path(raw.replace("~", str(Path.home()), 1))
                if not p.exists():
                    missing.append((f"{name}/{md.relative_to(d)}", raw))
    seen = set()
    for where, raw in missing:
        if (where, raw) in seen:
            continue
        seen.add((where, raw))
        print(f"   不存在：{raw}   ← {where}")
    if not missing:
        print("   全部存在")
    return len(seen)


def check_codex() -> int:
    print("\n4. Codex 同步副本（~/.codex/skills）")
    base = Path.home() / ".codex/skills"
    if not base.exists():
        print("   沒有 ~/.codex/skills，略過")
        return 0
    stale = 0
    for name in ["game-reskin", "stake-engine-slot", "mesh-cast-rig", "hacksaw-character-motion", "xinstar-spec"]:
        src, dst = ALL_SKILLS[name], base / name
        if not dst.exists():
            print(f"   {name}: Codex 那邊沒有")
            stale += 1
            continue
        a, b = files(src), files(dst)
        # SKILL.md 在同步時會被加一段說明，所以只比其他檔
        diff = [k for k in a if k != "SKILL.md" and a[k] != b.get(k)]
        newer = (src / "SKILL.md").stat().st_mtime > (dst / "SKILL.md").stat().st_mtime if (dst / "SKILL.md").exists() else True
        if diff or newer:
            stale += 1
            print(f"   {name}: 落後（{len(diff)} 個參考檔不同{'、SKILL.md 較舊' if newer else ''}）")
        else:
            print(f"   {name}: 已同步")
    if stale:
        print("   → Codex 動工前會自己跑：python3 /Users/stone/.codex/skills/sync_claude_skills.py")
    return stale


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sync-worktrees", action="store_true")
    a = ap.parse_args()
    stale = check_worktrees(a.sync_worktrees)
    bad_gate = check_gate()
    dead = check_paths()
    check_codex()
    print()
    print(f"結果：worktree 過期副本 {stale}、門檻段落不一致 {bad_gate}、死連結 {dead}")
    return 1 if (bad_gate or dead) else 0


if __name__ == "__main__":
    sys.exit(main())
