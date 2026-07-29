#!/bin/bash
# Open Nimble Part 2 DevRel strategy deck
cd "$(dirname "$0")"
git fetch origin
git checkout cursor/leading-devrel-part2-deck-9545
git pull --ff-only
open Leading-DevRel-at-Nimble.html
