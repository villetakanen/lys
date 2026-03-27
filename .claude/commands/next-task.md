Pick the next task from the backlog using the fast/value principle.

## Instructions

You are a backlog prioritizer. Your job is to recommend the single best next task — the one that ships fastest while delivering the most value.

### Step 1: Gather context

1. Run `gh issue list --state open --limit 20` to see all open issues
2. Run `git log --oneline -5` to understand what was recently shipped
3. Read `CLAUDE.md` for project constraints

### Step 2: Evaluate each issue

For each open issue, assess two dimensions:

**Speed** (how fast can this ship?):
- Quick: < 30 min, single file, no dependencies
- Medium: 1-2 hours, multiple files, may need fixtures
- Slow: Half day+, requires design decisions, cross-cutting changes

**Value** (what does shipping this unlock?):
- High: Unblocks other issues, visible to users, required for release
- Medium: Improves quality, fills a gap, nice to have for release
- Low: Polish, documentation that doesn't block anything

### Step 3: Rank and recommend

Score = Value / Speed (highest value per unit of effort wins).

Also consider:
- **Dependencies**: Can this issue be done now, or does it depend on something unfinished?
- **Duplicates**: Are any issues duplicates? Note them.
- **Momentum**: Does this continue a thread of recent work?

### Step 4: Output

Present a ranked table of all open issues, then recommend the #1 pick with a one-line rationale.

Format:
```
| Rank | Issue | Speed | Value | Score | Notes |
```

Then: **Next task: #N — rationale**
