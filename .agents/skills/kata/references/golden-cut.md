# Golden cut

## Message

Give one already-supported message or visual field more room, with a smaller
field for evidence, context, or qualification. This is a compositional choice
about spatial emphasis. It is not a data relationship and does not replace the
pattern needed to compare values, show parts of a whole, represent membership,
dependencies, or change over time.

The conventional 61.8/38.2 split is an optional starting proportion for the
two fields. Adjust it to the content, screen, and reading order; equal or other
proportions may work better. No golden rectangle canvas, phi grid, recursive
subdivision, or particular typography is required.

## Useful when

- The audience has one clear primary takeaway and needs a smaller adjacent
  field for its evidence, source, caveat, or next step.
- A single image, quotation, or concise finding can lead while related context
  remains visible and clearly associated.

For example, a slide may give a service's supported launch date the main field
and put the conditions that qualify it beside the date. Keep the conditions
readable and label the primary statement so the spatial hierarchy does not
overstate certainty.

## Poor fit

- Two claims carry equal importance; making one field larger would imply an
  unsupported priority.
- A dense comparison needs shared row and column alignment for readers to
  compare the same criteria across options. Use a comparison pattern instead.
- The source has no clear primary message, or the medium leaves too little room
  for the secondary field to remain legible.

Adapt by changing the split, stacking fields in reading order for a narrow
screen, simplifying secondary material without dropping consequential
caveats, or choosing another pattern. Do not preserve a side-by-side desktop
canvas by shrinking its text until the context is unreadable. Inspect the
rendered phone output and keep the qualification visible and clearly associated
with the primary message. If the primary message or the relative priority is
unknown, ask what the audience needs to decide and which claim has priority. If
that cannot be established, do not imply it with area.

## Keep quantitative meaning separate

The 61.8/38.2 spatial division does not mean that one quantity is 61.8% of a
whole. Do not use it to allocate data, compare unequal categories, encode a
winner, or imply aesthetic or cognitive superiority. Encode actual values with
their supported scales and attach labels to the evidence they describe. State
the source, scope, and uncertainty where they affect interpretation.

## Worked Lys example

The fictional brief is a supported launch date of 18 June, subject to a
security review due 10 June. The date is the main message; the review is a
qualification that must remain visible. The example uses a flexible main
column and a smaller context column rather than fixing the canvas to a ratio.

```html
<article data-notes="Fictional planning example. The date depends on the security review.">
  <h2>Launch is planned for 18 June</h2>
  <div class="launch-layout">
    <p class="launch-date"><time datetime="2027-06-18">18 June</time></p>
    <aside>
      <h3>Condition</h3>
      <p>Security review due 10 June. The launch date remains planned, not confirmed.</p>
    </aside>
  </div>
</article>
```

The date receives emphasis, while the condition remains explicit beside it.
This is a design judgment about the brief's stated priority, not a claim that
the split improves comprehension.
