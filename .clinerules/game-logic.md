# Game Logic Rules

## Rule 1: Passage Fetching After Failed Attempts

LAST EDITED: TUE MAY 20

Always fetch a new passage when a user fails a round. This prevents the frustration of repeatedly seeing the same passage.

Implementation details:

- Use the `forceNewPassage` parameter in the `startRound` function
- After a failed submission, call `startRound(true)` to bypass cache and fetch a new passage
- After a successful submission, you may use `startRound(false)` to allow cached passages

## Rule 2: Preserve Game Progress with "NEW TEXT"

The "NEW TEXT" button should fetch a fresh passage without resetting the game state. This ensures users who have progressed to higher levels with more blanks do not lose their progress when requesting new content.

Implementation details:

- Call `gameLogicStartRound(true)` directly from the button event handler
- Do not reset game state (round and blanks count) when getting new text
- Always force a new passage when the button is clicked (don't use cached text)
