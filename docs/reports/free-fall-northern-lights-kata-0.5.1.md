# Kata 0.5.1 in the Northern Lights player pitch

17 October 2026

Kata helped make the relationships within this eleven-slide pitch explicit: a deadline leads its mission context, operator choices receive equal treatment, and the costs of Harm remain beside each option. Its three forms were sufficient starting points for this text-led deck. They did not supply the cinema-specific proportions, the detailed treatment of five peers, or the arrangement of a rules lookup beside its explanation. Those decisions still required author judgment and rendered inspection.

This is a worked use of Kata, not a controlled evaluation. One agent researched, authored, composed and checked the deck. There was no independent reviewer or player comprehension study. The observations below describe choices and defects encountered, not measured gains in understanding.

## Brief and deliverables

The audience is people arriving from the FREE//FALL site to play **Northern Lights**. The deck introduces the setting, the public job, the available operator roles and enough of the rules to make their trade-offs inviting. It is a player pitch and orientation, not a complete rules reference or a recruitment offer for playtest volunteers.

- [Maintained HTML source](../../examples/square.html). The legacy filename remains so existing links continue to work.
- [Standalone built deck](../../site/examples/square.html), recreated by `pnpm build`. Lys, Lato and Orbitron are embedded; opening the file does not fetch assets.
- [Authored content and source record](free-fall-northern-lights-content.json).
- [Verification record](free-fall-northern-lights-checks.json).

The original FREE//FALL dark palette, Lato/Orbitron identity, exact **24:10** surface, **500 ms** fade and **16 × 6.667 inch** print page are retained. The last slide explains how Lys, Kata and the game material contribute. It also distinguishes the exact **2.4:1** canvas from nominal digital cinema **Scope at 2.39:1**, commonly called 2.40:1. This is a cinema-inspired HTML presentation, not a DCI delivery. The ratio explanation links to [Sony's specifications](https://partnerzone.sonypictures.com/spe-video-master-specs.html); the [ISDCF registry](https://www.isdcf.com/registry/projectoraspectratios/) confirms the Scope designation.

![Opening slide](free-fall-northern-lights-cover.png)

## Inputs and responsibility

The latest local Kata checkout was **0.5.1**, commit `ed08e83655ac04bb1f3069b15369ac32e662a037`. The Lys repository's vendored Kata copy already matched it. The applied material was the gateway plus **practices**, **composition** and **integration**, rather than the historical information-type catalogue. The Kata development harness's pinned Lys authoring guidance was read; the existing demo continues to build with the Lys repository's **1.2.5** runtime, without changing either pin or engine.

The public site was re-read on 17 October 2026: its home page, introduction, world, characters and crews, core rules, tools, SRD, about page and public Northern Lights landing page. Source URLs and response hashes are recorded with the authored copy. No GM scene, opposition, backstory or character-sheet page was used. The public mission's threat assessment remains an employer **advisory**, not a revelation about what is actually aboard.

Content selection, paraphrase, slide boundaries and order were authoring work under the user's request. The selected copy was recorded before applying the composition CSS. Kata then governed placement, scale, grouping, emphasis and inspection. The tests compare the rendered HTML text and notes with that record. This is a practical boundary within one agent's work, not a blind handoff between independent authors.

### Corrections made during source authoring

| Old pitch or source tension | Treatment in this deck |
| --- | --- |
| The previous demo described natural 20s as exploding into more dice. | The current rule is at least one success regardless of TN. Attack-specific critical details stay in the subject notes. |
| The previous demo treated filling all three Harm slots as immediate ousting. The introduction also loosely describes making Harm Permanent as keeping a slot open. | The detailed Core Rules govern: the slot stays filled, and the player may still make eligible Harm Permanent or break appropriate bound gear. Ousting happens when no option can resolve incoming Harm. |
| The previous pitch promised tester credits, early access and a free release, with a 3–4 hour commitment. | These promises are removed. The scenario supplies **3–5 players**, **3–5 hours**, ready-made operators and content warnings. |
| The old “Equality” explanation said GM and players use the same rules. | It is not repeated. The current rule concerns players deciding the resolution order in a tie. |
| Home, introduction and SRD expose different patch-level labels. | The pitch uses the scenario's **public playtest 0.7.x** designation. |

These corrections came from source checking. Kata's preservation rules cannot determine whether supplied game rules are current or correct. The content adaptation credits Ville Takanen and Kustannusosakeyhtiö Myrrys and carries CC BY-SA 4.0 attribution and reuse information, following the site's [About page](https://free-fall.myrrys.com/about/). Font licenses are embedded in the HTML.

## Composition decisions

The alternatives below were considered in choosing the final arrangement. They were not all implemented as visual variants.

| Slide | Choice and communicative role | Alternative and trade-off |
| --- | --- | --- |
| 1 Northern Lights | **One focus.** Large title at a common left edge, with open space to the right. The restrained colour field retains the existing identity. | A quiet centred title would feel less like an incoming briefing. No invented ship image was needed. |
| 2 The world | **Equal peers.** Earth and space share widths, heading sizes and alignment. Warm/cool rules distinguish the environments without ranking them. | Giving the Void most of the surface would foreground this mission but weaken the setting's duality. |
| 3 The mission | **A lead with support.** The 20-hour window dominates; its fictional meaning and label stay attached. The actual objectives occupy more reading width. | Three equal mission cards would fragment the public brief and bury the time constraint. The ordered objectives are authored from the supplied mission, not inferred by Kata. |
| 4 Operators | **Equal peers.** Five matching fields give every available role a place in one scan. Short descriptions and equal title treatment avoid selecting a favourite. | Two rows would provide more line length, but the odd fifth item would need careful treatment to avoid looking secondary. |
| 5 Binding | **A lead with support.** The capacity cost is the lead; a supplied 12 minus 3 example supports it. “Maximum Current” stays with 9. | Giving 9 the whole slide would turn an example into the apparent rule. The ledger itself was authored before composition. |
| 6 Action Pool | **A lead with support.** 5d20 leads, with the Harm penalty and 2d20 floor beside it. The second field explains allocating dice. | Equal scale for every sentence would make the pool harder to locate. Excessively enlarging it would crowd out the floor and penalty. |
| 7 Reading the roll | **Shared practices on a composite surface.** Keep the supplied difficulty lookup as a table. Put outcome definitions beside it and the natural-20 exception across the group. | A chart would replace the authored representation; a process diagram would imply a different relationship. No named form was forced onto the table's internals. |
| 8 Harm | **Equal peers.** Three possible sacrifices share typography and space. Each keeps its eligibility and cost; the shared ousting condition sits immediately below the options. | A dominant “take the hit” panel would imply a preferred choice. An ordered flow would misrepresent alternatives as mandatory steps. |
| 9 At the table | Equal treatment of player count and real session duration, with a separate, prominent warning group. | Putting warnings into the recurring footer would make meaningful participation information look like a credit. |
| 10 Invitation | **One focus.** The game's question has the largest presence, followed by the public invitation and an actual scenario link. | A grid of benefits would dilute the question and require unsupported sales copy. |
| 11 Colophon | **A lead with support.** The exact ratio leads its qualification; the other field explains the renderer, composition guidance and game material. | A token dump would obscure the distinction between author choices and Lys behaviour. This technical slide is present because the user explicitly requested it. |

Layout rationale stays here, outside the audience content and subject notes. The colophon identifies the tools but does not turn the pitch into a design critique.

## What Kata contributed

**The small repertoire was usable.** One focus directly served the title and closing question. Equal peers covered both two worlds and five operators. Lead with support connected an emphatic number to its meaning. There was no need to invent data relationships just to qualify for a form.

**The shared practices did more than the names.** The most consequential choices concerned proximity and qualification: the fictional deadline versus real session hours, “maximum” versus currently available Body, the minimum Action Pool, and Harm eligibility. The instructions to keep qualifications attached made these explicit review targets.

**It encouraged a reason for retaining familiar layouts.** Columns remained useful for the roster and Harm choices, but matching weight and distinct roles justified them. Borders were reduced to separators and shared rules rather than repeated boxes. The result still relies heavily on typography and columns; that is an authored design choice, not proof that the form names produced originality.

**Its inspection requirement found a real delivery defect.** An initial WebKit overflow prompted a change to the canvas wrapper. A subsequent PDF passed page count and page-size checks, yet visual inspection showed a retained stacked-mode offset pushing half the slide off-page. The author CSS now clears that offset in print, and the regression test measures slide edges as well as page count. Lys's engine was unchanged.

## What was lacking

1. **Worked examples for a very wide, shallow surface.** The forms allow adaptation but give little concrete help for spending width when height is scarce. Here, header depth, column measures and subordinate text sizes came from author judgment. A single 2.4:1 example with two considered arrangements and fit limits would be more useful than a new universal proportion rule.
2. **Larger peer sets.** The guidance mentions three brief peers; the five-person roster needed decisions about one row versus two, title wrapping and equal visual weight. A five-peer example with unequal description lengths would exercise the existing form without adding another category.
3. **Mixed reference surfaces.** The difficulty table plus outcome definitions is neither a set of equivalent options nor a simple statement and evidence pair. The shared practices were usable, but the form examples did not demonstrate this case. A worked example could show when to leave an authored table intact and compose its surrounding explanation.
4. **An operational check for readable support at the intended surface.** “Keep support readable” needs rendered judgment. This deck's general body is about 26.9 px on the 1536 px cinema canvas but only 6.8 px at a 390 px portrait width; some support is smaller. A proportional fit is not a comfortable phone reading experience. Kata should keep stating that limit clearly without taking over renderer behaviour or inventing reflow.

Researching the setting, resolving source conflicts, choosing spoilers to exclude and deciding the deck's sequence are necessary authoring responsibilities, not missing Kata features. The report does not propose adding them to Kata. No shared skill or harness guidance was changed during this use.

The most useful follow-up would be one published, fixed-surface worked example using the roster or Harm slide, with two real alternatives and the same frozen copy. It could address the wide-surface and peer-set gaps together. These are proposals, not changes already delivered.

## Verification and limits

- Build and type check passed. Lys lint passed with two informational notices in pre-existing ignored scratch files. All **192 unit tests** passed. Kata's project check passed without changing Kata files.
- The focused browser suite passed **47 tests**, with **4 expected skips** for native PDF export in Firefox/WebKit. Chromium, Firefox and WebKit checked text fit and 24:10 geometry at **1536×640**, **1440×900**, **390×844** and **844×390**, with JavaScript enabled and disabled.
- Keyboard checks covered Arrow Right, Home and End, focus movement and hidden-slide accessibility state. Copied-file checks blocked HTTP(S) requests and confirmed the bundled fonts and renderer load without external requests. The source does not add custom interaction code.
- Visual review covered every slide at **1536×640**, phone portrait and landscape samples, the changed example listing at **1280×720** and **390×844**, and CSS-only output. The listing's Northern Lights link opened the rebuilt deck. The existing documentation tables elsewhere on the listing page were outside this change.
- Chromium produced **11 pages**, each **1152×480 points**, with and without JavaScript. All final PDF pages were rendered and visually inspected; the dense Harm slide and CSS-only colophon received full-size checks. Text extraction was checked against the authored copy after normalising whitespace, ligatures and ordered-list markers.
- Physical phones, real touch gestures, screen readers and native Firefox/Safari print dialogs were not tested. The contrast regression checks the slide foreground/background pair; it is not a complete accessibility audit. No claim of improved player understanding is made.

Portrait phone scaling faithfully preserves the composition but is too small for comfortable reading. A desktop, shared screen or larger PDF view is the intended way to use this cinema deck. A separately authored mobile presentation would be a different surface and a separate task.

### Final printed compositions

![Slides 1 to 6](free-fall-northern-lights-pages-1.png)

![Slides 7 to 11](free-fall-northern-lights-pages-2.png)
