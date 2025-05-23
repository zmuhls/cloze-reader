# UI Button Layout Documentation

## Game Control Buttons

The Cloze Reader game has three main control buttons, all located in the `#game-controls` container div:

### 1. Hint Button
- **Created in**: `src/app.tsx` during initial rendering
- **ID**: `hint-btn`
- **Contains**: Hint count text: `Hint (N)`
- **Behavior**: Shows hints for the selected blank, disabled when no hints remaining or when all questions are answered
- **Location**: Left side of game controls area

### 2. Submit Button
- **Created in**: `src/app.tsx` during initial rendering
- **ID**: `submit-btn`
- **Behavior**: Submits the current answers for checking, disabled when not all blanks are filled
- **Location**: Right side of game controls area, within `.game-buttons-container`

### 3. Continue Button
- **Created in**: `src/services/gameLogic.ts` → `handleSubmission()` function
- **ID**: `continue-btn`
- **Behavior**: Appears after submission, advances to next round
- **Previous Location**: Was appended to `resultArea` div
- **Current Location**: Now placed in the `#game-controls` div alongside other buttons, within `.game-buttons-container`

## HTML Structure

```html
<div id="game-controls" class="flex justify-end items-center gap-2 mt-2 min-h-[45px]">
  <button id="hint-btn" class="...">Hint (3)</button>
  <button id="analysis-btn" class="..." style="display: none">Analysis</button>
  
  <!-- Container for Submit and Continue buttons -->
  <div class="game-buttons-container flex flex-col items-end gap-2">
    <button id="submit-btn" class="...">Submit</button>
    <button id="continue-btn" class="..." style="display: none">Continue</button>
  </div>
</div>
```

## CSS Selectors and Styling

The primary styling for buttons is defined in `src/styles.css`:

### Game Controls Container
```css
#game-controls {
  display: flex;
  justify-content: flex-end; /* Align buttons to the right */
  align-items: center;
  gap: 0.5rem; /* Space between hint and submit buttons */
  margin-top: 0.5rem; /* Space above the controls */
  min-height: 45px; /* Ensure the container has a minimum height */
  flex-shrink: 0; /* Prevent shrinking */
  position: relative; /* Ensure proper stacking context */
  z-index: 5; /* Ensure buttons appear above other content */
}
```

### Individual Button Styling
```css
#game-controls button {
  font-size: 0.9em; /* Slightly smaller font for these buttons */
  padding: 0.35rem 0.75rem; /* Smaller padding */
  min-width: 90px; /* Adjust min-width as needed */
  min-height: 36px; /* Adjust min-height */
  opacity: 1; /* Ensure buttons are visible even when disabled */
  pointer-events: auto; /* Ensure buttons receive click events */
}

#game-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Button Container for Submit/Continue
```css
.game-buttons-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* Align items to the right */
  gap: 0.5rem; /* Space between buttons */
}
```

## Button Creation and Event Handling

### Hint and Submit Buttons
- **Created**: In `src/app.tsx` during component initialization
- **Event Handling**: Set up in `src/services/gameLogic.ts` → `renderRound()` function
- **Visibility**: Always visible but disabled when appropriate

### Continue Button
- **Created**: Dynamically in `src/services/gameLogic.ts` → `handleSubmission()` function
- **Initial State**: Hidden (`style="display: none"`)
- **Show Logic**: Made visible (`style="display: flex"`) after user submits answers
- **Event Handling**: When clicked, calls `continueToNextRound(passed)` to advance the game
- **Hide Logic**: Hidden again (`style="display: none"`) when clicked to proceed to next round

## Responsive Behavior

### Mobile Devices (max-width: 768px)
```css
@media (max-width: 768px) {
  #game-controls button {
    padding: 6px 10px !important;
    font-size: 0.85rem;
    min-width: 80px;
    min-height: 32px;
  }
}
```

### Small Screens (max-width: 640px)
```css
@media screen and (max-width: 640px) {
  button {
    min-width: 90px; 
    min-height: 38px; 
    font-size: 0.875rem;
  }
}
```

## Implementation Notes

1. **Button Positioning**: All game control buttons are right-aligned using `justify-content: flex-end`
2. **Vertical Stacking**: Submit and Continue buttons are stacked vertically in `.game-buttons-container`
3. **Dynamic Visibility**: Continue button is shown/hidden based on game state
4. **Consistent Styling**: All buttons share common styling classes for visual consistency
5. **Accessibility**: Proper ARIA labels and focus states are maintained
6. **Responsive Design**: Button sizes and spacing adapt to different screen sizes

## File Locations

- **HTML Structure**: `src/app.tsx` (lines ~85-105)
- **CSS Styling**: `src/styles.css` (lines ~450-490)
- **JavaScript Logic**: `src/services/gameLogic.ts` (handleSubmission function)
- **Event Handlers**: `src/services/gameLogic.ts` (renderRound function)
