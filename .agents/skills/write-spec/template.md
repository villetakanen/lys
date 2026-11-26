---
generated:
  by: <producer/version or human:id>
  at: "<current RFC 3339 timestamp>"
verified: []
---

# Row export

## Context

Readers need a file containing only the rows they select in a table.

## Blueprint

An export of up to 20 selected rows produces a file containing those rows. If more than 20 are selected, the reader sees an error and no file is created.

## Scenarios

```gherkin
Feature: Row export

  Scenario: Export exactly 20 rows
    Given I have selected 20 rows
    When I request an export
    Then I receive a file containing all 20 selected rows

  Scenario: Export more than 20 rows
    Given I have selected 21 rows
    When I request an export
    Then I receive an error
    And no file is created
```
