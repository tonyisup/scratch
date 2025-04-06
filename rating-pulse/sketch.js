// --- Tunable Parameters ---
let valueGravity = 0.0015; // How fast the rating decays (higher = faster)
let bumpAmount = .4;    // How much a tap increases the rating
let bubbleVisualGravity = valueGravity; // How fast the visual bubble falls
let bubbleBouncePower = 1.2;   // How much the visual bubble jumps when tapped (increased from 0.4)
let bubbleDamping = 0.92; // How quickly the bubble's velocity decreases (new parameter)
let numColumns = 11; // Number of movie metric columns
let columnSpacing = 0.2; // Spacing between columns as fraction of screen width

// Movie metric labels
const metricLabels = [
  "Story",
  "Performance",
  "Emotion",
  "Visual",
  "Audio",
  "Message",
  "Engagement",
  "Fun",
  "Replay",
  "Depth",
  "Clarity"
];

// --- Global State Variables ---
let ratings = []; // Array of ratings for each column
let ratingHistories = []; // Array of rating histories for each column
let paused = false;
let ended = false;

// --- Visual Bubble Variables ---
let bubbleYs = []; // Array of Y positions for each balloon
let bubbleDiameter = 60; // Slightly smaller to fit more columns
let bubbleVelocitiesY = []; // Array of Y velocities for each balloon
let deformationAmounts = []; // Array of deformation amounts for each balloon
let deformationDamping = 0.92;

// --- UI Element Definitions ---
let pauseButtonArea;
let resumeButtonArea;
let endButtonArea;
let restartButtonArea;
let graphDisplayArea;

// --- Setup ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Initialize arrays for each column
  for (let i = 0; i < numColumns; i++) {
    ratings[i] = 5.0;
    ratingHistories[i] = [ratings[i]];
    bubbleYs[i] = mapRatingToY(ratings[i]);
    bubbleVelocitiesY[i] = 0;
    deformationAmounts[i] = 0;
  }

  calculateLayout();
  textAlign(CENTER, CENTER);
  textSize(16);
  // frameRate(30); // Optional: Can reduce frame rate if needed
  console.log("Setup complete. Tap screen to boost rating.");
}

// --- Main Draw Loop ---
function draw() {
  background(240, 245, 250); // Light background

  if (ended) {
    drawEndScreen();
  } else if (paused) {
    drawPauseScreen();
    // Keep drawing the static balloons while paused
    for (let i = 0; i < numColumns; i++) {
      drawBalloon(i);
    }
  } else {
    // --- Running State ---
    for (let i = 0; i < numColumns; i++) {
      // 1. Update the Rating (apply gravity)
      ratings[i] -= valueGravity;
      ratings[i] = max(0, ratings[i]);

      // 2. Update Visual Bubble Physics
      bubbleVelocitiesY[i] += bubbleVisualGravity;
      bubbleYs[i] += bubbleVelocitiesY[i];
      bubbleVelocitiesY[i] *= bubbleDamping;

      // 3. Keep visual bubble within screen bounds
      let topBound = bubbleDiameter / 2 + 10;
      let bottomBound = height - bubbleDiameter / 2 - 10;
      if (bubbleYs[i] > bottomBound) {
        bubbleYs[i] = bottomBound;
        bubbleVelocitiesY[i] *= -0.4;
      }
      if (bubbleYs[i] < topBound) {
        bubbleYs[i] = topBound;
        bubbleVelocitiesY[i] = 0;
      }

      // 4. Update the rating based on bubble position
      ratings[i] = mapYToRating(bubbleYs[i]);

      // 5. Store current rating for history
      ratingHistories[i].push(ratings[i]);

      // 6. Draw elements
      drawBalloon(i);
    }
    drawPauseButton();
  }
}

// --- Drawing Functions ---

function drawBalloon(columnIndex) {
  let columnWidth = width / (numColumns + 1);
  let x = columnWidth * (columnIndex + 1);
  let y = bubbleYs[columnIndex];
  
  // Draw metric label above balloon
  fill(50);
  noStroke();
  textSize(14);
  textAlign(CENTER, BOTTOM);
  text(metricLabels[columnIndex], x, y - bubbleDiameter/2 - 10);
  
  // Update deformation animation
  if (deformationAmounts[columnIndex] > 0) {
    deformationAmounts[columnIndex] *= deformationDamping;
  }
  
  // Draw the balloon string
  stroke(100);
  strokeWeight(2);
  let stringLength = 40;
  line(x, y + bubbleDiameter/2, x, y + bubbleDiameter/2 + stringLength);
  
  // Draw the balloon body with deformation
  noStroke();
  fill(100, 150, 255, 200);
  push();
  translate(x, y);
  let stretchX = 1 + deformationAmounts[columnIndex] * 0.3;
  let stretchY = 1.1 - deformationAmounts[columnIndex] * 0.2;
  scale(stretchX, stretchY);
  ellipse(0, 0, bubbleDiameter, bubbleDiameter);
  pop();
  
  // Draw the balloon knot
  fill(80, 130, 235, 200);
  ellipse(x, y + bubbleDiameter/2 - 5, 12, 12);
  
  // Draw the balloon string coming from the knot
  stroke(100);
  strokeWeight(2);
  line(x, y + bubbleDiameter/2 - 5, x, y + bubbleDiameter/2 + stringLength);

  // Text inside balloon
  fill(255);
  textSize(18); // Slightly smaller text
  textFont('sans-serif');
  textAlign(CENTER, CENTER);
  text(nf(ratings[columnIndex], 1, 1), x, y - 5);
}

function drawPauseButton() {
  fill(200, 200, 200, 180); // Semi-transparent gray
  stroke(50);
  rect(pauseButtonArea.x, pauseButtonArea.y, pauseButtonArea.w, pauseButtonArea.h, 5); // Rounded corners

  fill(0);
  noStroke();
  textSize(14);
  text("Pause", pauseButtonArea.x + pauseButtonArea.w / 2, pauseButtonArea.y + pauseButtonArea.h / 2);
}

function drawPauseScreen() {
  // Dim background
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  // Resume Button
  fill(150, 255, 150, 220); // Greenish
  noStroke();
  rect(resumeButtonArea.x, resumeButtonArea.y, resumeButtonArea.w, resumeButtonArea.h, 8);
  fill(0);
  textSize(18);
  text("Resume", resumeButtonArea.x + resumeButtonArea.w / 2, resumeButtonArea.y + resumeButtonArea.h / 2);

  // End Button
  fill(255, 150, 150, 220); // Reddish
  noStroke();
  rect(endButtonArea.x, endButtonArea.y, endButtonArea.w, endButtonArea.h, 8);
  fill(0);
  textSize(18);
  text("End Session", endButtonArea.x + endButtonArea.w / 2, endButtonArea.y + endButtonArea.h / 2);
}

function drawEndScreen() {
  background(50, 60, 70);

  // Calculate average for each column
  let averages = [];
  for (let i = 0; i < numColumns; i++) {
    let sum = ratingHistories[i].reduce((a, b) => a + b, 0);
    averages[i] = sum / ratingHistories[i].length;
  }

  // Display title and averages
  fill(230);
  textSize(28);
  text("Session Ended", width / 2, 60);
  
  // Display averages in a grid layout
  textSize(16);
  let columnsPerRow = 3;
  let rowHeight = 30;
  for (let i = 0; i < numColumns; i++) {
    let row = Math.floor(i / columnsPerRow);
    let col = i % columnsPerRow;
    let x = width * (0.25 + col * 0.25);
    let y = 120 + row * rowHeight;
    text(metricLabels[i] + ": " + nf(averages[i], 1, 2), x, y);
  }

  // Draw the graphs
  drawHistoryGraphs();

  // Draw Restart Button
  fill(180, 180, 220, 220);
  noStroke();
  rect(restartButtonArea.x, restartButtonArea.y, restartButtonArea.w, restartButtonArea.h, 8);
  fill(0);
  textSize(18);
  text("Restart", restartButtonArea.x + restartButtonArea.w / 2, restartButtonArea.y + restartButtonArea.h / 2);
}

function drawHistoryGraphs() {
  let graphHeight = graphDisplayArea.h / 4; // Show 4 graphs per row
  let graphMargin = 20;
  let columnsPerRow = 3;
  
  for (let i = 0; i < numColumns; i++) {
    let row = Math.floor(i / columnsPerRow);
    let col = i % columnsPerRow;
    let gx = graphDisplayArea.x + col * (graphDisplayArea.w / columnsPerRow + graphMargin);
    let gy = graphDisplayArea.y + row * (graphHeight + graphMargin);
    let gw = graphDisplayArea.w / columnsPerRow - graphMargin;
    let gh = graphHeight - graphMargin;

    push();
    
    // Draw graph background and border
    fill(235, 240, 245);
    noStroke();
    rect(gx, gy, gw, gh);
    stroke(100);
    noFill();
    rect(gx, gy, gw, gh);

    // Draw metric label
    fill(50);
    noStroke();
    textSize(12);
    textAlign(CENTER, TOP);
    text(metricLabels[i], gx + gw/2, gy + 5);

    // Draw Y-axis labels (0-10)
    fill(50);
    noStroke();
    textSize(10);
    textAlign(RIGHT, CENTER);
    for (let j = 0; j <= 10; j += 2) {
      let yPos = map(j, 0, 10, gy + gh - 20, gy + 20);
      text(j, gx - 5, yPos);
      stroke(200);
      line(gx, yPos, gx + gw, yPos);
    }

    // Draw the rating line graph
    if (ratingHistories[i].length > 1) {
      noFill();
      stroke(0, 0, 255);
      strokeWeight(2);
      beginShape();
      for (let j = 0; j < ratingHistories[i].length; j++) {
        let x = map(j, 0, ratingHistories[i].length - 1, gx + 10, gx + gw - 10);
        let val = constrain(ratingHistories[i][j], 0, 10);
        let y = map(val, 0, 10, gy + gh - 20, gy + 20);
        vertex(x, y);
      }
      endShape();
    }

    pop();
  }
}

// --- Input Handling ---

function touchStarted() {
  handleInput(mouseX, mouseY);
  return false; // Prevent default browser behaviors like scrolling or double-tap zoom
}

function mousePressed() {
  handleInput(mouseX, mouseY);
  // No 'return false' needed for mousePressed on desktop usually
}

function handleInput(mx, my) {
  if (ended) {
    if (isInsideArea(mx, my, restartButtonArea)) {
      restartSession();
    }
  } else if (paused) {
    if (isInsideArea(mx, my, resumeButtonArea)) {
      paused = false;
      console.log("Resumed");
    } else if (isInsideArea(mx, my, endButtonArea)) {
      ended = true;
      paused = false;
      console.log("Session Ended");
      calculateLayout();
    }
  } else {
    if (isInsideArea(mx, my, pauseButtonArea)) {
      paused = true;
      console.log("Paused");
    } else {
      // Check each balloon's bounding box
      for (let i = 0; i < numColumns; i++) {
        let columnWidth = width / (numColumns + 1);
        let x = columnWidth * (i + 1);
        let y = bubbleYs[i];
        
        // Define balloon bounding box (including string)
        let boxWidth = bubbleDiameter * 1.2; // Slightly wider than balloon
        let boxHeight = bubbleDiameter + 40; // Height of balloon plus string
        let boxX = x - boxWidth/2;
        let boxY = y - bubbleDiameter/2;
        
        // Check if click is within this balloon's bounding box
        if (mx >= boxX && mx <= boxX + boxWidth &&
            my >= boxY && my <= boxY + boxHeight) {
          // Bump the balloon
          bubbleVelocitiesY[i] = -bubbleBouncePower;
          deformationAmounts[i] = 0.5;
          break; // Exit loop once we've found the clicked balloon
        }
      }
    }
  }
}

// --- Utility Functions ---

// Maps the 0-10 rating to a Y coordinate for the bubble center
function mapRatingToY(rating) {
  let topPadding = bubbleDiameter / 2 + 30; // Space from top
  let bottomPadding = bubbleDiameter / 2 + 30; // Space from bottom
  return map(rating, 0, 10, height - bottomPadding, topPadding);
}

// Maps a Y coordinate to a 0-10 rating (new function)
function mapYToRating(y) {
  let topPadding = bubbleDiameter / 2 + 30; // Space from top
  let bottomPadding = bubbleDiameter / 2 + 30; // Space from bottom
  return map(y, height - bottomPadding, topPadding, 0, 10);
}

// Checks if a point (mx, my) is inside a rectangular area {x, y, w, h}
function isInsideArea(mx, my, area) {
  return mx >= area.x && mx <= area.x + area.w &&
         my >= area.y && my <= area.y + area.h;
}

// Resets the state to start a new session
function restartSession() {
  console.log("Restarting session...");
  for (let i = 0; i < numColumns; i++) {
    ratings[i] = 10.0;
    ratingHistories[i] = [ratings[i]];
    bubbleYs[i] = mapRatingToY(ratings[i]);
    bubbleVelocitiesY[i] = 0;
    deformationAmounts[i] = 0;
  }
  paused = false;
  ended = false;
  calculateLayout();
}

// Recalculates UI element positions - Call in setup and windowResized
function calculateLayout() {
  let buttonW = 120;
  let buttonH = 50;
  let pauseW = 60;
  let pauseH = 35;

  pauseButtonArea = { x: width - pauseW - 15, y: 15, w: pauseW, h: pauseH };
  resumeButtonArea = { x: width / 2 - buttonW - 10, y: height / 2 - buttonH / 2, w: buttonW, h: buttonH };
  endButtonArea = { x: width / 2 + 10, y: height / 2 - buttonH / 2, w: buttonW, h: buttonH };
  restartButtonArea = { x: width / 2 - buttonW / 2, y: height - buttonH - 30, w: buttonW, h: buttonH };

  // Define graph area relative to screen size and other elements
  let graphMarginX = 50;
  let graphMarginTop = 150;
  let graphMarginBottom = 100; // Space for restart button
  graphDisplayArea = {
    x: graphMarginX,
    y: graphMarginTop,
    w: width - 2 * graphMarginX,
    h: height - graphMarginTop - graphMarginBottom
  };
  // Ensure graph height is not negative if screen is very small
  graphDisplayArea.h = max(50, graphDisplayArea.h);
}

// --- Handle Window Resizing ---
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Recalculate layout for responsiveness
  calculateLayout();
  // Re-center bubble Y potentially, though gravity/taps will adjust it
  // bubbleY = mapRatingToY(currentRating); // Optional: Reset visual position on resize
  console.log("Window Resized");
}