// --- Tunable Parameters ---
let valueGravity = 0.0015; // How fast the rating decays (higher = faster)
let bumpAmount = .4;    // How much a tap increases the rating
let bubbleVisualGravity = valueGravity; // How fast the visual bubble falls
let bubbleBouncePower = 1.2;   // How much the visual bubble jumps when tapped (increased from 0.4)
let bubbleDamping = 0.92; // How quickly the bubble's velocity decreases (new parameter)

// --- Global State Variables ---
let currentRating = 5.0; // The actual enjoyment rating (0-10)
let ratingHistory = [];   // Stores rating history for the graph
let paused = false;
let ended = false;

// --- Visual Bubble Variables ---
let bubbleY;
let bubbleDiameter = 80;
let bubbleVelocityY = 0;
// Deformation animation variables
let deformationAmount = 0;
let deformationDirection = 1;
let deformationSpeed = 0.15;
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
  // Initial bubble position based on starting rating
  bubbleY = mapRatingToY(currentRating);
  ratingHistory = [currentRating]; // Start history

  // Define UI areas dynamically based on canvas size
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
    // Keep drawing the static bubble/rating while paused
    drawBubble(width / 2, bubbleY, currentRating);
  } else {
    // --- Running State ---

    // 1. Update the Rating (apply gravity)
    currentRating -= valueGravity;
    currentRating = max(0, currentRating); // Clamp rating >= 0

    // 2. Update Visual Bubble Physics
    bubbleVelocityY += bubbleVisualGravity; // Apply visual gravity
    bubbleY += bubbleVelocityY;
    
    // Apply damping to the velocity (new)
    bubbleVelocityY *= bubbleDamping;

    // 3. Keep visual bubble within screen bounds (approx)
    let topBound = bubbleDiameter / 2 + 10;
    let bottomBound = height - bubbleDiameter / 2 - 10;
    if (bubbleY > bottomBound) {
      bubbleY = bottomBound;
      bubbleVelocityY *= -0.4; // Dampen bounce at bottom
    }
    if (bubbleY < topBound) {
      bubbleY = topBound;
      bubbleVelocityY = 0; // Stop firmly at top
    }

    // 4. Update the rating based on bubble position
    currentRating = mapYToRating(bubbleY);

    // 5. Store current rating for history
    ratingHistory.push(currentRating);

    // 6. Draw elements
    drawBubble(width / 2, bubbleY, currentRating);
    drawPauseButton();
  }
}

// --- Drawing Functions ---

function drawBubble(x, y, value) {
  // Update deformation animation
  if (deformationAmount > 0) {
    deformationAmount *= deformationDamping;
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
  // Apply squish and stretch based on deformation
  let stretchX = 1 + deformationAmount * 0.3;
  let stretchY = 1.1 - deformationAmount * 0.2;
  scale(stretchX, stretchY);
  ellipse(0, 0, bubbleDiameter, bubbleDiameter);
  pop();
  
  // Draw the balloon knot
  fill(80, 130, 235, 200);
  ellipse(x, y + bubbleDiameter/2 - 5, 15, 15);
  
  // Draw the balloon string coming from the knot
  stroke(100);
  strokeWeight(2);
  line(x, y + bubbleDiameter/2 - 5, x, y + bubbleDiameter/2 + stringLength);

  // Text inside balloon
  fill(255);
  textSize(24);
  textFont('sans-serif');
  text(nf(value, 1, 1), x, y - 5);
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
  background(50, 60, 70); // Darker background for end screen

  // Calculate average
  let sum = 0;
  if (ratingHistory.length > 0) {
    sum = ratingHistory.reduce((a, b) => a + b, 0);
  }
  let average = ratingHistory.length > 0 ? sum / ratingHistory.length : 0;

  // Display title and average
  fill(230);
  textSize(28);
  text("Session Ended", width / 2, 60);
  textSize(20);
  text("Overall Average Enjoyment: " + nf(average, 1, 2), width / 2, 100);

  // Draw the graph
  drawHistoryGraph();

  // Draw Restart Button
  fill(180, 180, 220, 220);
  noStroke();
  rect(restartButtonArea.x, restartButtonArea.y, restartButtonArea.w, restartButtonArea.h, 8);
  fill(0);
  textSize(18);
  text("Restart", restartButtonArea.x + restartButtonArea.w / 2, restartButtonArea.y + restartButtonArea.h / 2);
}

function drawHistoryGraph() {
  let gx = graphDisplayArea.x;
  let gy = graphDisplayArea.y;
  let gw = graphDisplayArea.w;
  let gh = graphDisplayArea.h;

  push(); // Use push/pop to isolate drawing styles and transformations

  // Draw graph background and border
  fill(235, 240, 245); // Light background for graph
  noStroke();
  rect(gx, gy, gw, gh);
  stroke(100);
  noFill();
  rect(gx, gy, gw, gh); // Border

  // Draw Y-axis labels (0-10)
  fill(50);
  noStroke();
  textSize(12);
  textAlign(RIGHT, CENTER);
  for (let i = 0; i <= 10; i += 2) {
    let yPos = map(i, 0, 10, gy + gh, gy); // Map rating to Y position
    text(i, gx - 5, yPos);
    stroke(200); // Light grid lines
    line(gx, yPos, gx + gw, yPos);
  }

  // Draw X-axis label
  textAlign(CENTER, TOP);
  text("Time", gx + gw / 2, gy + gh + 5);

  // Draw the rating line graph
  if (ratingHistory.length > 1) {
    noFill();
    stroke(0, 0, 255); // Blue line
    strokeWeight(2);
    beginShape();
    for (let i = 0; i < ratingHistory.length; i++) {
      let x = map(i, 0, ratingHistory.length - 1, gx, gx + gw);
      // Ensure value is within 0-10 before mapping, just in case
      let val = constrain(ratingHistory[i], 0, 10);
      let y = map(val, 0, 10, gy + gh, gy); // Map rating to graph Y (inverted)
      vertex(x, y);
    }
    endShape();
  }

  pop(); // Restore original drawing settings
  textAlign(CENTER, CENTER); // Reset default text align
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
    // Check Restart button
    if (isInsideArea(mx, my, restartButtonArea)) {
      restartSession();
    }
  } else if (paused) {
    // Check Resume button
    if (isInsideArea(mx, my, resumeButtonArea)) {
      paused = false;
      console.log("Resumed");
    }
    // Check End button
    else if (isInsideArea(mx, my, endButtonArea)) {
      ended = true;
      paused = false;
      console.log("Session Ended");
      calculateLayout();
    }
  } else {
    // Check Pause button first
    if (isInsideArea(mx, my, pauseButtonArea)) {
      paused = true;
      console.log("Paused");
    } else {
      // If not paused and not clicking a button, it's a screen tap to bump rating
      bubbleVelocityY = -bubbleBouncePower;
      // Add deformation on bump
      deformationAmount = 0.5;
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
  currentRating = 10.0;
  ratingHistory = [currentRating];
  bubbleY = mapRatingToY(currentRating);
  bubbleVelocityY = 0;
  deformationAmount = 0;
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