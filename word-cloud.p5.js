// --- Global Variables ---
let canvasWidth = 400;
let canvasHeight = 400;
let wordObjects = []; // Array to hold { word: "text", x: 0, y: 0, w: 0, h: 0, isHovered: false }
let currentSentence = [];
let sentenceDisplayP; // p5.dom element for the sentence
let backspaceBtn, clearBtn; // p5.dom button elements
let canvas; // p5 canvas element

let baseFontSize = 18; // Adjustable font size
let maxWordsInCloud = 25; // Limit words to prevent clutter
let placementAttempts = 50; // How many times to try placing a word

// --- Simple Prediction Model (Same as before) ---
const predictionModel = {
    __START__: ["The", "I", "A", "You", "He", "She", "It", "We", "They", "My", "What", "Where", "When", "Why", "How", "Is"],
    "the": ["quick", "brown", "fox", "dog", "cat", "lazy", "man", "woman", "car", "house", "day", "night"],
    "a": ["quick", "brown", "fox", "dog", "cat", "lazy", "man", "woman", "car", "house", "great", "small"],
    "i": ["am", "want", "go", "see", "like", "need", "think", "feel", "hope", "wish"],
    "you": ["are", "want", "go", "see", "like", "need", "think", "feel", "can", "should"],
    "he": ["is", "was", "wants", "goes", "sees", "likes", "needs", "thinks", "feels", "said"],
    "she": ["is", "was", "wants", "goes", "sees", "likes", "needs", "thinks", "feels", "said"],
    "it": ["is", "was", "seems", "looks", "has", "can", "will"],
    "we": ["are", "were", "want", "go", "see", "like", "need", "think", "feel", "can", "should"],
    "they": ["are", "were", "want", "go", "see", "like", "need", "think", "feel", "can", "should"],
    "my": ["name", "dog", "cat", "house", "car", "friend", "idea", "favorite"],
    "quick": ["brown", "fox", "dog", "cat", "response", "look"],
    "brown": ["fox", "dog", "cat", "bear", "eyes"],
    "fox": ["jumped", "jumps", "ran", "runs", "is"],
    "dog": ["barked", "jumped", "ran", "is", "was", "sleeps", "wags"],
    "cat": ["jumped", "slept", "is", "was", "purrs", "meows"],
    "jumped": ["over", "high", "quickly", "down"],
    "over": ["the", "a", "it", "there"],
    "lazy": ["dog", "cat", "person", "afternoon"],
    "am": ["happy", "sad", "going", "thinking", "sure", "ready"],
    "is": ["happy", "sad", "going", "thinking", "a", "the", "it", "here", "there", "not"],
    "are": ["happy", "sad", "going", "thinking", "you?", "they?", "we?"],
    "said": ["hello", "goodbye", "that", "he", "she", "it"],
    // Add more words and transitions as needed...
    // Fallback if word not found
    __FALLBACK__: ["is", "a", "the", ".", "?", "!", "and", "or", "but", "so", "then", "maybe"]
};
// --- End Prediction Model ---

// ==========================
// SETUP FUNCTION - Runs Once
// ==========================
function setup() {
    // Create a main container div to help organize layout
    let mainContainer = createDiv('');
    mainContainer.style('display', 'flex');
    mainContainer.style('flex-direction', 'column');
    mainContainer.style('align-items', 'center'); // Center items horizontally
    mainContainer.style('padding', '20px');
    mainContainer.style('font-family', 'sans-serif'); // Apply font to everything inside

    // --- Sentence Display ---
    // Create a div to hold the label and the dynamic sentence part
    let sentenceContainer = createDiv('Sentence: ');
    sentenceContainer.parent(mainContainer); // Add to the main container
    sentenceContainer.style('margin-bottom', '15px');
    sentenceContainer.style('padding', '10px');
    sentenceContainer.style('border', '1px solid #ccc');
    sentenceContainer.style('background-color', '#fff');
    sentenceContainer.style('min-height', '1.5em'); // Ensure it has height
    sentenceContainer.style('width', '80%'); // Responsive width
    sentenceContainer.style('max-width', '600px'); // Max width
    sentenceContainer.style('text-align', 'left');
    sentenceContainer.style('font-size', '16px'); // Set base font size

    // Create the span *inside* the sentenceContainer where the sentence will appear
    sentenceDisplayP = createSpan(''); // This is the element we'll update
    sentenceDisplayP.parent(sentenceContainer); // Attach it to the container div
    sentenceDisplayP.style('font-weight', 'bold'); // Make the sentence bold

    // --- Canvas Setup ---
    canvas = createCanvas(canvasWidth, canvasHeight);
    // Create a div to wrap the canvas, allowing border and margin
    let canvasWrapper = createDiv('');
    canvasWrapper.parent(mainContainer);
    canvasWrapper.style('border', '1px solid black');
    canvasWrapper.style('margin-bottom', '15px');
    canvas.parent(canvasWrapper); // Put the canvas *inside* the wrapper div

    // --- Controls Setup ---
    // Create a div to hold the buttons side-by-side
    let controlsContainer = createDiv('');
    controlsContainer.parent(mainContainer);
    controlsContainer.style('display', 'flex'); // Use flexbox for horizontal layout
    controlsContainer.style('gap', '10px'); // Add space between buttons

    // Create Backspace Button
    backspaceBtn = createButton('Backspace');
    backspaceBtn.parent(controlsContainer); // Add to the controls container
    backspaceBtn.mousePressed(handleBackspace); // Attach click handler
    // Style the button
    backspaceBtn.style('padding', '8px 15px');
    backspaceBtn.style('cursor', 'pointer');
    backspaceBtn.style('font-size', '14px');
    backspaceBtn.style('border', '1px solid #aaa');
    backspaceBtn.style('background-color', '#eee');
    backspaceBtn.style('border-radius', '4px');


    // Create Clear Button
    clearBtn = createButton('Clear All');
    clearBtn.parent(controlsContainer); // Add to the controls container
    clearBtn.mousePressed(handleClear); // Attach click handler
    // Style the button (similar to backspace)
    clearBtn.style('padding', '8px 15px');
    clearBtn.style('cursor', 'pointer');
    clearBtn.style('font-size', '14px');
    clearBtn.style('border', '1px solid #aaa');
    clearBtn.style('background-color', '#eee');
    clearBtn.style('border-radius', '4px');

    // --- p5.js Drawing Settings ---
    textSize(baseFontSize);
    textAlign(CENTER, CENTER); // Align text centrally for easier placement
    textFont('sans-serif');

    // Initialize with starter words
    updateWordCloud();
}

// ==========================
// DRAW FUNCTION - Runs Continuously
// ==========================
function draw() {
    background(240); // Light gray background for the canvas

    // Update hover state for visual feedback
    wordObjects.forEach(obj => {
        obj.isHovered = isMouseOverWord(obj);
    });

    // Draw each word in the cloud
    for (let wordObj of wordObjects) {
        push(); // Isolate drawing styles for this word

        // Apply hover style or default style
        if (wordObj.isHovered) {
            fill(0, 100, 200); // Blue when hovered
            stroke(0, 100, 200); // Matching outline
            // Optional: Slightly larger font on hover (can affect layout)
            // textSize(baseFontSize * 1.05);
        } else {
            fill(50); // Dark gray text
            noStroke(); // No outline by default
        }

        // Ensure base font size is set (especially if changed for hover)
        textSize(baseFontSize);

        // Draw the word text at its calculated position
        text(wordObj.word, wordObj.x, wordObj.y);

        // Optional: Draw bounding box for debugging layout
        // noFill();
        // stroke(200, 0, 0, 100); // Semi-transparent red
        // rect(wordObj.x - wordObj.w / 2, wordObj.y - wordObj.h / 2, wordObj.w, wordObj.h);

        pop(); // Restore previous drawing styles
    }

    // Update the HTML content of the sentence display element
    // No need to do this every frame, could optimize, but fine for now
    sentenceDisplayP.html(currentSentence.join(' '));
}

// ==========================
// MOUSE EVENT FUNCTION
// ==========================
function mousePressed() {
    // Check if the click happened *inside* the canvas bounds
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        // Iterate through displayed words to see if one was clicked
        for (let i = wordObjects.length - 1; i >= 0; i--) { // Iterate backwards to prioritize top words if overlapping
             let wordObj = wordObjects[i];
            if (isMouseOverWord(wordObj)) {
                selectWord(wordObj.word);
                // Prevent clicking through multiple overlapping words in one click
                return; // Exit function once a word is selected
            }
        }
    }
    // Clicks outside the canvas are ignored for word selection
    // Button clicks are handled by their own .mousePressed() handlers
}

// ==========================
// HELPER FUNCTIONS
// ==========================

// Check if the mouse cursor is within the calculated bounds of a word object
function isMouseOverWord(wordObj) {
    // Using CENTER alignment, the bounding box is centered on (x, y)
    return mouseX > wordObj.x - wordObj.w / 2 &&
           mouseX < wordObj.x + wordObj.w / 2 &&
           mouseY > wordObj.y - wordObj.h / 2 &&
           mouseY < wordObj.y + wordObj.h / 2;
}

// Add the selected word to the sentence and update the cloud
function selectWord(word) {
    currentSentence.push(word);
    updateWordCloud(); // Regenerate suggestions based on the new sentence end
}

// Handle the Backspace button click
function handleBackspace() {
    if (currentSentence.length > 0) {
        currentSentence.pop(); // Remove the last word
        updateWordCloud(); // Update suggestions
    }
}

// Handle the Clear All button click
function handleClear() {
    currentSentence = []; // Empty the sentence array
    updateWordCloud(); // Show starter words again
}

// Determine the next set of words based on the last word typed
function getCurrentPredictions() {
    // If sentence is empty, use __START__ key, otherwise use the last word (lowercase)
    let lastWord = currentSentence.length > 0 ? currentSentence[currentSentence.length - 1].toLowerCase() : "__START__";

    // Basic punctuation handling: don't predict after punctuation
    if (lastWord === '.' || lastWord === '?' || lastWord === '!') {
        return predictionModel['__START__']; // Start a new sentence conceptually
    }


    let predictions = predictionModel[lastWord];

    // If no specific predictions found for the last word, use the fallback list
    if (!predictions) {
        console.log(`No specific predictions for "${lastWord}", using fallback.`);
        predictions = predictionModel["__FALLBACK__"];
    } else {
         // Make a copy to avoid modifying the original model accidentally
         predictions = [...predictions];
    }

     // Add common punctuation if not already suggested and not at the start
     if (lastWord !== "__START__") {
         // Avoid adding duplicates if they are already in predictions
         if (!predictions.includes('.')) predictions.push('.');
         if (!predictions.includes('?')) predictions.push('?');
         if (!predictions.includes('!')) predictions.push('!');
     }


    // Shuffle the predictions and limit the number shown in the cloud
    return shuffleArray(predictions).slice(0, maxWordsInCloud);
}

// Calculate positions for words in the cloud
function updateWordCloud() {
    wordObjects = []; // Clear the list of word objects to draw
    let wordsToPlace = getCurrentPredictions(); // Get the list of words to show

    textSize(baseFontSize); // Ensure calculations use the correct font size

    for (let word of wordsToPlace) {
        // Calculate rough width and height needed for the word
        let wordW = textWidth(word) + 12; // Add horizontal padding
        let wordH = baseFontSize * 1.6; // Approximate height based on font size, add vertical padding

        let placed = false;
        // Try multiple random positions to place the word without overlap
        for (let i = 0; i < placementAttempts; i++) {
            // Generate random center coordinates within canvas bounds (with margin)
            let tryX = random(wordW / 2 + 5, width - wordW / 2 - 5);
            let tryY = random(wordH / 2 + 5, height - wordH / 2 - 5);

            let overlaps = false;
            // Check against all previously placed words
            for (let existing of wordObjects) {
                // Simple Axis-Aligned Bounding Box (AABB) overlap check
                // Using center coordinates and dimensions (w, h)
                let x1min = tryX - wordW / 2;
                let x1max = tryX + wordW / 2;
                let y1min = tryY - wordH / 2;
                let y1max = tryY + wordH / 2;

                let x2min = existing.x - existing.w / 2;
                let x2max = existing.x + existing.w / 2;
                let y2min = existing.y - existing.h / 2;
                let y2max = existing.y + existing.h / 2;

                // Add a small gap to prevent words touching directly
                let gap = 3;
                 if (x1min < x2max + gap && x1max > x2min - gap && y1min < y2max + gap && y1max > y2min - gap) {
                     overlaps = true;
                     break; // Overlaps with 'existing', stop checking for this position
                 }
            }

            // If no overlaps were found, place the word
            if (!overlaps) {
                wordObjects.push({
                    word: word,
                    x: tryX,
                    y: tryY,
                    w: wordW, // Store calculated width
                    h: wordH, // Store calculated height
                    isHovered: false // Initialize hover state
                });
                placed = true;
                break; // Successfully placed, move to the next word
            }
        } // End placement attempt loop

        // Log a warning if a word couldn't be placed after many attempts
        if (!placed) {
            console.warn(`Could not place word "${word}" without overlap after ${placementAttempts} attempts.`);
            // Options: force place it (will overlap), or just skip it (as done here)
        }
    }
    // Ensure redraw happens after update (implicitly handled by draw loop)
}

// Fisher-Yates (Knuth) Shuffle algorithm to randomize word order
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}