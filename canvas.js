// class Canvas {
// 	constructor(canvas) {
		
// 	}
// }
function Canvas(canvas) {
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');
  // This complicates things a little but but fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
	this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
	this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
	this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
	this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }
  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  // **** Keep track of state! ****
  
  this.valid = false; // when set to false, the canvas will redraw everything
  this.shapes = [];  // the collection of things to be drawn
  this.dragging = false; // Keep track of when we are dragging
  this.enlargeDirection = false; // If enlargeDirection the shape
  // the current selected object. In the future we could turn this into an array for multiple selection
  this.selection = null;
  this.dragoffx = 0; // See mousedown and mousemove events for explanation
  this.dragoffy = 0;
  this.frame = 0;
  
  // **** Then events! ****
  
  // This is an example of a closure!
  // Right here "this" means the Canvas. But we are making events on the Canvas itself,
  // and when the events are fired on the canvas the variable "this" is going to mean the canvas!
  // Since we still want to use this particular Canvas in the events we have to save a reference to it.
  // This is our reference!
  var myState = this;
  
  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  // Up, down, and move are for dragging
  canvas.addEventListener('mousedown', function(e) {
	var mouse = myState.getMouse(e);
	var mx = mouse.x;
	var my = mouse.y;
	var shapes = myState.shapes;
	var l = shapes.length;
	for (var i = l-1; i >= 0; i--) {
	  var border = shapes[i].border(mx, my);
	  if (shapes[i].contains(mx, my)) {
		var mySel = shapes[i];
		// Keep track of where in the object we clicked
		// so we can move it smoothly (see mousemove)
		myState.dragoffx = mx - mySel.x;
		myState.dragoffy = my - mySel.y;
		myState.dragging = true;
		myState.selection = mySel;
		if (border) {
		  myState.enlargeDirection = border;
		}
		myState.valid = false;
		return;
	  } 
	}
	// havent returned means we have failed to select anything.
	// If there was an object selected, we deselect it
	if (myState.selection) {
	  myState.selection = null;
	  myState.valid = false; // Need to clear the old selection border
	}
	var mouse = myState.getMouse(e);
	var new_shape = new Shape(mouse.x, mouse.y, 1, 1, 'rgba(0,255,0,.6)');
	myState.addShape(new_shape); 
	myState.selection = new_shape;
	myState.enlargeDirection = Shape.prototype.borderenum.BOTTOMRIGHT;
	

  }, true);
  canvas.addEventListener('mousemove', function(e) {
	var mouse = myState.getMouse(e);
	if (!myState.enlargeDirection && !myState.dragging) {
	  return;
	} else if (myState.enlargeDirection == Shape.prototype.borderenum.RIGHT) {
	  myState.selection.move_right(mouse.x);  
	} else if (myState.enlargeDirection == Shape.prototype.borderenum.LEFT) {
	  myState.selection.move_left(mouse.x);
	} else if (myState.enlargeDirection == Shape.prototype.borderenum.TOP) {
	  myState.selection.move_top(mouse.y);
	} else if (myState.enlargeDirection == Shape.prototype.borderenum.BOTTOM) {
	  myState.selection.move_down(mouse.y);  
	} else if (myState.enlargeDirection == Shape.prototype.borderenum.BOTTOMRIGHT) {
	  myState.selection.move_down(mouse.y);
	  myState.selection.move_right(mouse.x);   
	} else if (myState.enlargeDirection == Shape.prototype.borderenum.BOTTOMLEFT) {
	  myState.selection.move_down(mouse.y);
	  myState.selection.move_left(mouse.x);   
	} else if (myState.enlargeDirection == Shape.prototype.borderenum.TOPLEFT) {
 	  myState.selection.move_left(mouse.x);
	  myState.selection.move_top(mouse.y);
	} else if (myState.enlargeDirection == Shape.prototype.borderenum.TOPRIGHT) {
	  myState.selection.move_top(mouse.y);
	  myState.selection.move_right(mouse.x);
	} else if (myState.dragging){
	  myState.selection.x = mouse.x - myState.dragoffx;
	  myState.selection.y = mouse.y - myState.dragoffy;   
	}
	myState.valid = false;
  }, true);
  html.addEventListener("keypress", function(event) {
	console.log(myState.selection);
	if (event.keyCode == 32) {
	  if (myState.shapes.length > 0) {
		myState.shapeNum = (myState.shapeNum + 1) % myState.shapes.length
		myState.selection = myState.shapes[myState.shapeNum % myState.shapes.length];
		console.log(myState.shapeNum);
		myState.valid = false;
	  }
	}
  }, true);
  html.addEventListener("keydown", function(event) {
  	/* Adds controls for arrow keys. KEY CODES: 
  	38 == down arrow, 40 == up arrow, 37 == left arrow, 
  	39 == right arrow, 68 == 'd'. */
	if (myState.selection != null) {
	  if (event.keyCode == 38) {	/* Moves down. */
		myState.selection.y -= 1;
	  } else if (event.keyCode == 40) { /* Moves up. */
		myState.selection.y += 1;
	  } else if (event.keyCode == 37) { /* Moves left. */
		myState.selection.x -= 1;
	  } else if (event.keyCode == 39) { /* Moves right. */
		myState.selection.x += 1;
	  } else if (event.keyCode == 68) { /* Deletes with 'd'. */
		myState.removeShape(myState.selection); 
		myState.selection = null;
	  }
	/* In the event no shape is selected, use frames. */
	} else if (event.keyCode == 37) { /* Moves left a frame. */
	  if (myState.frame > 0) {
		canvas.style.backgroundImage = frame_url(--(myState.frame));
	  }
	} else if (event.keyCode == 39) { /* Moves right a frame. */
	  canvas.style.backgroundImage = frame_url(++(myState.frame));
	}
	myState.valid = false;

  }, true);
  canvas.addEventListener('mouseup', function(e) {
	myState.dragging = false;
	myState.enlargeDirection = false;
	for (var i = 0; i < myState.shapes.length; i++) {
	  if (myState.shapes[i].w == 1 || myState.shapes[i].h == 1) {
		myState.removeShape(myState.shapes[i]);
		myState.selection = null;
		myState.valid = false;
	  }
	}
  }, true);
  
  myState.valid = false;
  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;  
  this.interval = 30;
  setInterval(function() { myState.draw(); }, myState.interval);
}

Canvas.prototype.addShape = function(shape) {
  this.shapes.push(shape);
  this.valid = false;
}
Canvas.prototype.removeShape = function(shape) {
  var index = this.shapes.indexOf(shape);
  this.shapes.splice(index, 1); 
  this.valid = false;
}

Canvas.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
Canvas.prototype.draw = function() {
  // if our state is invalid, redraw and validate!
  if (!this.valid) {
	var ctx = this.ctx;
	var shapes = this.shapes;
	this.clear();
	
	// ** Add stuff you want drawn in the background all the time here **
	
	// draw all shapes
	var l = shapes.length;
	for (var i = 0; i < l; i++) {
	  var shape = shapes[i];
	  // We can skip the drawing of elements that have moved off the screen:
	  if (shape.x > this.width || shape.y > this.height ||
		  shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;
	  shapes[i].draw(ctx);
	}
	
	// draw selection
	// right now this is just a stroke along the edge of the selected Shape
	if (this.selection != null) {
	  ctx.strokeStyle = this.selectionColor;
	  ctx.lineWidth = this.selectionWidth;
	  var mySel = this.selection;
	  ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);

	  /* Handles corners. */
	  ctx.fillStyle="#000000";
	  ctx.fillRect(mySel.x - 2, mySel.y - 2, 5, 5);
	  ctx.fillRect(mySel.x - 3 + mySel.w, mySel.y - 2, 5, 5);
	  ctx.fillRect(mySel.x - 2, mySel.y - 2 + mySel.h, 5, 5);
	  ctx.fillRect(mySel.x - 3 + mySel.w, mySel.y - 2 + mySel.h, 5, 5);
	}
	
	// ** Add stuff you want drawn on top all the time here **
	
	this.valid = true;
  }
}


// Creates an object with x and y defined, set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about padding and borders
Canvas.prototype.getMouse = function(e) {
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
  
  // Compute the total offset
  if (element.offsetParent !== undefined) {
	do {
	  offsetX += element.offsetLeft;
	  offsetY += element.offsetTop;
	} while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;
  
  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
}
