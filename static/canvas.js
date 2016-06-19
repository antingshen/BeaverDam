class Canvas {
    /**
     * Over all constructor of the canvas. Sets up the event listeners and records the state
     * of the overall canvas. Adapted from a guide by Simon Sarris.
     * @param canvas The canvas element to be passed in.
     */
    constructor(canvas) {
        this.canvas = canvas;                              // Canvas passed in.
        this.padding = 100;                                // White padding outside of background image.
        this.numberOfFrames = 5000;
        this.scrollBarSize = 636;

        /* Gets the first frame's height and width and sets up canvas to it. */
        var img = new Image();
        img.src = frame_path(0);
        canvas.width = img.naturalWidth + this.padding;
        canvas.height = img.naturalHeight + this.padding;
        this.width = canvas.width;                         // Width of the canvas.
        this.height = canvas.height;                       // Height of the canvas.
        this.ctx = canvas.getContext('2d');                // Canvas to be modified.

        document.getElementById("fixed-panel").style.width = this.width + 20;
        document.getElementById("frame-controller").style.width = this.width + 7;

        this.selectionWidth = 2;                           // Border fillSize of selected boxes.
        this.selectionCorner = 5;                          // Corner fillSize of selected boxes.
        this.interval = 30;                                // Frequency to be redrawn.

        /* Fixes mouse co-ordinate problems when there's a border or padding. See getMouse for more
         details.  */
        if (document.defaultView && document.defaultView.getComputedStyle) {
            this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)
                    ['paddingLeft'], 10) || 0;
            this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)
                    ['paddingTop'], 10) || 0;
            this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)
                    ['borderLeftWidth'], 10) || 0;
            this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)
                    ['borderTopWidth'], 10) || 0;
        }

        /* Used to recalculate mouse coordinates in the event of fixed-position bars throughout
         the page. */
        var html = document.body.parentNode;
        this.htmlTop = html.offsetTop;
        this.htmlLeft = html.offsetLeft;

        /* Maintains the state of the canvas. */
        this.valid = false;             // When false, the canvas will be redrawn.
        this.things = [];               // Collection of things in the video
        this.boxes = [];                // List of boxes in the current frame
        this.dragging = false;          // Keeps track of when we are dragging.
        this.enlargeDirection = null;   // Keeps the direction being dragged when enlarging.
        this.previousSelection = null;  // Previous selection used for key frames.
        this.selection = null;          // Keeps the selected box that was clicked on.
        this.move = false;              // Keeps track of when we are moving a box.
        this.play = false;                                 // Playing frames.

        /* Used for keepign track where  the mouse was clicked to create a smooth drag. */
        this.dragoffx = 0;
        this.dragoffy = 0;

        /* Keeps track of the current frame that is being annotated. 
         * Getters and setters will update the boxes for the frame if this is changed */
        this._frame = 0;

        this.setUpListeners(canvas, html);
    }

    setUpListeners(canvas, html) {
        /* Since we want to modify the state of the canvas, we use closure in order
        * to access its variables. */
        var myState = this;

        /* Fixes a problem where double clicking causes text to get selected on the canvas. */
        canvas.addEventListener('selectstart', function (e) {
            e.preventDefault();
            return false;
        }, false);

        /* Events for mouse down.*/
        canvas.addEventListener('mousedown', function (e) {
            var mouse = myState.getMouse(e);
            var mx = mouse.x;
            var my = mouse.y;
            var boxes = myState.boxes;
            var l = boxes.length;

            /* Checks if within border. If not, checks if it is within the box. If it's in the
             border, enlargingDirection is set to the border that was clicked. If it's in the
             box or its border, we set the selection to that box and record where it was
             clicked. */
            for (var i = l - 1; i >= 0; i--) {
                var border = boxes[i].withinBorder(mx, my);
                if (boxes[i].contains(mx, my)) {
                    var mySel = boxes[i];

                    /* Used for smooth transition in mouseMove. */
                    myState.dragoffx = mx - mySel.x;
                    myState.dragoffy = my - mySel.y;
                    myState.dragging = true;
                    myState.previousSelection = myState.selection;
                    myState.selection = mySel;
                    if (border) {
                        myState.enlargeDirection = border;
                    } else {
                        document.body.style.cursor = 'move';
                        myState.move = true;
                    }
                    myState.valid = false;
                    return;
                }
            }

            /* Haven't found any box. This deselects any previously selected boxes. */
            if (myState.selection) {
                myState.selection = null;
                myState.valid = false;
            }

            /* Creates a new thing & box. Continues to enlarge it as the user
               continues to drag. */
            var newThing = new Thing();
            var newBox = new Box(newThing, myState.frame, mouse.x, mouse.y, 1, 1, true);
            myState.things.push(newThing);
            myState.boxes.push(newBox);
            myState.valid = false;
            myState.selection = newBox;
            myState.enlargeDirection = Box.border.BOTTOMRIGHT;

            var thingDom = document.createElement("li");
            thingDom.className = "list-group-item col-xs-6";
            thingDom.id = newThing.fill;
            thingDom.style = "color: azure; background-color: " + newThing.fill + "; width: 57px";
            thingDom.innerText = newThing.type;
            thingDom.addEventListener("click", function() {
                myState.selection = newThing.id;
            });


            document.getElementById("shape-list").appendChild(thingDom);

        }, true);

        /* Event for moving the mouse. Primarily used for enlarging a box and moving it. */
        canvas.addEventListener('mousemove', function (e) {
            var mouse = myState.getMouse(e);
            var mx = mouse.x;
            var my = mouse.y;
            var boxes = myState.boxes;
            var border = false;
            // var box = null;

            /* Checks if mouse is hovering over a border. */
            for (var i = boxes.length - 1; i >= 0; i--) {
                // box = boxes[i]; 
                border = boxes[i].withinBorder(mx, my);
                if (border && !myState.move) {
                    boxes[i].doubleArrow(mx, my);
                    break;
                }
            }


            if (!myState.enlargeDirection && !myState.dragging && !border) {
                document.body.style.cursor = 'default';
            } else if (myState.enlargeDirection === Box.border.RIGHT) {
                myState.selection.moveRight(mouse.x);
            } else if (myState.enlargeDirection === Box.border.LEFT) {
                myState.selection.moveLeft(mouse.x);
            } else if (myState.enlargeDirection === Box.border.TOP) {
                myState.selection.moveUp(mouse.y);
            } else if (myState.enlargeDirection === Box.border.BOTTOM) {
                myState.selection.moveDown(mouse.y);
            } else if (myState.enlargeDirection === Box.border.BOTTOMRIGHT) {
                myState.selection.moveDown(mouse.y);
                myState.selection.moveRight(mouse.x);
            } else if (myState.enlargeDirection === Box.border.BOTTOMLEFT) {
                myState.selection.moveDown(mouse.y);
                myState.selection.moveLeft(mouse.x);
            } else if (myState.enlargeDirection === Box.border.TOPLEFT) {
                myState.selection.moveLeft(mouse.x);
                myState.selection.moveUp(mouse.y);
            } else if (myState.enlargeDirection === Box.border.TOPRIGHT) {
                myState.selection.moveUp(mouse.y);
                myState.selection.moveRight(mouse.x);
            } else if (myState.dragging) {
                myState.selection.x = mouse.x - myState.dragoffx;
                myState.selection.y = mouse.y - myState.dragoffy;
            }
            myState.valid = false;
        }, true);

        /* Adds controls for moving boxes with arrow keys as well as deleting them with the 'd'.
            In the event no box is selected, we use the arrow keys to transition frames.*/
        html.addEventListener("keydown", function (event) {
            if (myState.selection != null) { /* Handles box. */
                switch (event.keyCode) {
                    case 38:  /* Arrow down. */
                        myState.selection.y -= 1;
                        break;
                    case 40:  /* Arrow up. */
                        myState.selection.y += 1;
                        break;
                    case 37:  /* Arrow left. */
                        myState.selection.x -= 1;
                        break;
                    case 39:  /* Arrow right. */
                        myState.selection.x += 1;
                        break;
                    case 68:  /* Deletes with 'd'. */
                        myState.removeBox(myState.selection);
                        myState.selection = null;
                        break;
                }
                myState.valid = false;
            } else if (event.keyCode === 37) { /* Moves left a frame. */
                if (myState.frame > 0) {
                    var frame = myState.frame--;
                    canvas.style.backgroundImage = frame_url(frame);
                }
            } else if (event.keyCode === 39) { /* Moves right a frame. */
                var frame = myState.frame++;
                canvas.style.backgroundImage = frame_url(frame);
            }
            myState.valid = false;

        }, true);

        /* Modifies state to prevent dragging. If the box is too small, delete it. */
        canvas.addEventListener('mouseup', function (e) {
            if (document.body.style.cursor === 'move') {
                document.body.style.cursor = 'default';
            }
            myState.move = false;
            myState.dragging = false;
            myState.enlargeDirection = false;
            for (var i = 0; i < myState.boxes.length; i++) {
                if (myState.boxes[i].w === 1 || myState.boxes[i].h === 1) {
                    myState.removeBox(myState.boxes[i]);
                    myState.selection = null;
                    myState.valid = false;
                }
            }
        }, true);

        /* Redraws canvas every interval seconds */
        setInterval(function () {
            myState.draw();
            if (myState.play) {
                myState.frame += 1;
            }
        }, myState.interval);
    }

    get frame() {return this._frame;}
    set frame(value) {
        value = parseInt(value);
        frame_preload(value);
        var frameNumberBox = document.getElementById("frame-number");
        document.getElementById("scroll-bar").value = value;
        frameNumberBox.setAttribute("value", value);
        this._frame = value;
        this.boxes = this.getBoxes(value);
        this.valid = false;
        document.getElementById("frame").style.backgroundImage = frame_url(this._frame);
        if (this.selection != null && this.selection.thing != null) {
            for (var box of this.boxes) {
                if (box.thing.id == this.selection.thing.id) {
                    this.selection = box;
                    break;
                }
            }
        }
    }

    /* Retrieves a list of box objects that belong in the current frame */
    getBoxes(frame) {
        var boxes = [];
        for (var thing of this.things) {
            var box = thing.getKeyframe(frame);
            if (box != null) {
                boxes.push(box);
            }
        }
        return boxes;
    }

    /**
     * Removes box from list of boxes and redraws it. Deletes the Thing if it has no more boxes
     * @param box The box to be removed.
     */
    removeBox(box) {
        var index = this.boxes.indexOf(box);
        this.boxes.splice(index, 1);
        if (box.thing.deleteKeyframe(box)) {
            let index = this.things.indexOf(box.thing);

            var element = document.getElementById(this.things.splice(index, 1)[0].id);
            element.parentNode.removeChild(element);
        }
        this.valid = false;
    }

    // Copied from http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    shadeColor(color, percent) {   
        var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
        return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
    }

    /**
     * Draws the state of the canvas if it's invalid and updates key frames.
     */
    draw() {
        if (!this.valid) {
            var ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            for (var i = 0; i < this.boxes.length; i++) {
                this.boxes[i].draw(ctx);
            }

            /* Draws border for selected box. */

            if (this.selection != null) {
                for (var box of this.boxes) {
                    if (box.thing === this.selection.thing) {
                        ctx.strokeStyle = this.shadeColor(this.selection.thing.fill, -20);
                        ctx.lineWidth = this.selectionWidth;
                        var mySel = this.selection;
                        ctx.strokeRect(mySel.x, mySel.y, mySel.w, mySel.h);

                        /* Handles corners. */
                        var fillSize = this.selectionCorner;
                        ctx.fillStyle = "#000000";
                        ctx.fillRect(mySel.x - 2, mySel.y - 2, fillSize, fillSize);
                        ctx.fillRect(mySel.x - 3 + mySel.w, mySel.y - 2, fillSize, fillSize);
                        ctx.fillRect(mySel.x - 2, mySel.y - 2 + mySel.h, fillSize, fillSize);
                        ctx.fillRect(mySel.x - 3 + mySel.w, mySel.y - 2 + mySel.h, fillSize, fillSize);
                    }
                }

            }

            /* Updates key frames */

            if (this.selection != this.previousSelection || (this.selection && this.selection.thing.keyFramesChanged)) {
                var myNode = document.getElementById("key-frames"); //Faster than setting innerHtml to null.
                var myState = this;
                while (myNode.firstChild) {
                    myNode.removeChild(myNode.firstChild);
                }
                for (var box of myState.selection.thing.keyframes) {
                    var dot = document.createElement("div");
                    dot.className = "dots";
                    dot.style = `left: ${box.frame / this.numberOfFrames * this.scrollBarSize}px;`;
                    dot.setAttribute("location", box.frame);
                    dot.addEventListener("click", function() {
                       myState.frame = this.getAttribute("location");
                    });
                    document.getElementById("key-frames").appendChild(dot);
                }
                this.selection.thing.keyFramesChanged = false;

            }
            this.valid = true;
        }
    }

    /**
     * Creates a modified x and y coordinate for a mouse event to allow for smooth transitioning.
     * This takes into consideration fixed borders and other objects within the page.
     * @param e
     * @returns {{x: (number|*), y: (number|*)}}
     */
    getMouse(e) {
        var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

        /* Compute the total offset. */
        if (element.offsetParent !== undefined) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
        }

        /* Add padding and border style widths to offset. Also add the <html> offsets in case
         there's a fixed position bar. */
        offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
        offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

        mx = e.pageX - offsetX;
        my = e.pageY - offsetY;

        return {x: mx, y: my};
    }
}
