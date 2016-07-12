"use strict";


// Mousing over the RESIZE_BORDER px-border around each rectangle initiates
// resize, else initiates move.
const RESIZE_BORDER = 10 /* px */;


class ThingDrawing {
    constructor(player, thing) {
        Object.assign(this, {player, thing});
    }

    addToPaper() {
        // Idempotency
        if (this.rect != null) return;

        this.paper = this.player.paper;

        // Draw rect
        this.rect = this.paper.rect(0, 0, 0, 0);

        // Reference self
        // this.rect.data('box', this);

        // Default attr
        this.setDefaultAppearance();

        // Handlers
        this.rect.mousedown(this.onClick.bind(this));
        this.rect.drag(this.onDragMove.bind(this), this.onDragStart.bind(this), this.onDragEnd.bind(this));
        this.rect.mousemove(this.onMouseover.bind(this));
    }

    setDefaultAppearance() {
        this.rect.attr({
            'fill': this.thing.fill,
            'stroke': 'black',
            'stroke-width': 5,
            'opacity': 0.5
        });        
    }

    setSelected(isSelected) {
        if (isSelected) {
            this.rect.attr({'opacity': 0.7});
        }
        else {
            this.rect.attr({'opacity': 0.3});
        }
    }


    // For resize operations, it is easier to work with bounds than with the
    // NW corner and dimensions. The next two functions help with this
    // transformation.

    bounds() {
        return Bounds.fromAttrs(this.rect.attrs);
    }

    setBounds(bounds) {
        this.addToPaper();
        this.rect.attr(Bounds.toAttrs(bounds));
    }

    resizeBounds({dxMin, dxMax, dyMin, dyMax}) {
        var resizedBounds = Bounds.resize(this.boundsBeforeDrag, dxMin, dxMax, dyMin, dyMax);
        this.setBounds(resizedBounds);
    }

    move(dx, dy) {
        var {xMin, yMin} = this.boundsBeforeDrag;
        this.rect.attr({
            x: xMin + dx,
            y: yMin + dy,
        });
    }


    // Event handler: Click
    
    onClick() {
        this.player.selectedThing = this.thing;
        this.player.drawAnnotations();
        this.player.drawKeyframebar();
        this.rect.toFront();
    }

    
    // Event handler: Drag
    
    isBeingDragged() {
        return this.boundsBeforeDrag != null;
    }

    onDragStart() {
        this.player.video.pause();
        this.boundsBeforeDrag = this.bounds();
    }

    onDragMove(dx, dy) {
        // Inspect cursor to determine which resize/move process to use
        switch (this.rect.attr('cursor')) {
            case 'nw-resize':
                this.resizeBounds({dxMin: dx, dyMin: dy});
                break;
            case 'ne-resize':
                this.resizeBounds({dxMax: dx, dyMin: dy});
                break;
            case 'n-resize':
                this.resizeBounds({dyMin: dy});
                break;
            case 'sw-resize':
                this.resizeBounds({dxMin: dx, dyMax: dy});
                break;
            case 'se-resize':
                this.resizeBounds({dxMax: dx, dyMax: dy});
                break;
            case 's-resize':
                this.resizeBounds({dyMax: dy});
                break;
            case 'w-resize':
                this.resizeBounds({dxMin: dx});
                break;
            case 'e-resize':
                this.resizeBounds({dxMax: dx});
                break;
            case 'move':
                this.move(dx, dy);
                break;
        }
    }

    onDragEnd() {
        var bounds = this.bounds();
        if (!Bounds.equals(bounds, this.boundsBeforeDrag)) {
            this.thing.updateKeyframeAtTime({
                // TODO magic number
                time: this.player.video.currentTime * 1000,
                bounds: bounds,
            });
        }
        this.boundsBeforeDrag = undefined;
    }


    // Event handler: Mouseover

    onMouseover(e, mouseX, mouseY) {
        var paper = this.player.$("paper");

        // Don't change cursor during a drag operation
        if (this.boundsBeforeDrag != null) return;

        // X,Y Coordinates relative to shape's orgin
        var shapeWidth = this.rect.attr('width');
        var shapeHeight = this.rect.attr('height');
        var relativeXmin = mouseX - paper.offset().left - this.rect.attr('x');
        var relativeYmin = mouseY - paper.offset().top - this.rect.attr('y');
        var relativeXmax = shapeWidth - relativeXmin;
        var relativeYmax = shapeHeight - relativeYmin;

        // Change cursor
        if (relativeYmin < RESIZE_BORDER) {
            if (relativeXmin < RESIZE_BORDER)
                this.rect.attr('cursor', 'nw-resize');
            else if (relativeXmax < RESIZE_BORDER)
                this.rect.attr('cursor', 'ne-resize');
            else
                this.rect.attr('cursor', 'n-resize');
        }
        else if (relativeYmax < RESIZE_BORDER) {
            if (relativeXmin < RESIZE_BORDER)
                this.rect.attr('cursor', 'sw-resize');
            else if (relativeXmax < RESIZE_BORDER)
                this.rect.attr('cursor', 'se-resize');
            else
                this.rect.attr('cursor', 's-resize');
        }
        else {
            if (relativeXmin < RESIZE_BORDER)
                this.rect.attr('cursor', 'w-resize');
            else if (relativeXmax < RESIZE_BORDER)
                this.rect.attr('cursor', 'e-resize');
            else
                this.rect.attr('cursor', 'move');
        }
    }
}

void ThingDrawing;


class NewThingDrawing extends ThingDrawing {
    constructor(player, thing) {
        Object.assign(this, {player, thing});
    }

    setDefaultAppearance() {
        this.makeHidden();
    }

    makeHidden() {
        this.rect.toBack();
        this.setBounds({
            xMin: 0,
            xMax: this.player.video.videoWidth,
            yMin: 0,
            yMax: this.player.video.videoHeight,
        });
        this.rect.attr({
            'fill': 'transparent',
            'stroke': 'transparent',
            'stroke-width': 0,
            'opacity': 0
        });
    }

    makeVisible() {
        this.rect.attr({
            'fill': 'yellow',
            'stroke': 'black',
            'stroke-width': 5,
            'opacity': 0.5
        });
        this.rect.toFront();
    }

    onDragStart() {
        this.boundsBeforeDrag = this.bounds();
    }

    onDragEnd() {
        var bounds = this.bounds();
        if (!Bounds.equals(bounds, this.boundsBeforeDrag))
            this.thing.updateKeyframeAtTime({
                // TODO magic number
                time: this.player.video.currentTime * 1000,
                bounds: bounds,
            });
        this.boundsBeforeDrag = undefined;
    }

    onMouseover() {}
}

void NewThingDrawing;
