"use strict";

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
        this.rect.data('box', this);

        // Default attr
        this.rect.attr({
            'fill': this.thing.fill,
            'stroke': 'black',
            'stroke-width': 5,
            'opacity': 0.5
        });

        // Handlers
        this.rect.mousemove(this.onMouseover.bind(this));
        this.rect.drag(this.onDragMove.bind(this), this.onDragStart.bind(this), this.onDragEnd.bind(this));
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

    onDragStart() {
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
        if (!Bounds.equals(bounds, this.boundsBeforeDrag))
            this.thing.updateKeyframeAtTime({
                time: this.player.video.currentTime * 1000,
                bounds: bounds,
            });
        this.boundsBeforeDrag = undefined;
    }

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

        var resizeBorder = 10;

        // Change cursor
        if (relativeYmin < resizeBorder) {
            if (relativeXmin < resizeBorder)
                this.rect.attr('cursor', 'nw-resize');
            else if (relativeXmax < resizeBorder)
                this.rect.attr('cursor', 'ne-resize');
            else
                this.rect.attr('cursor', 'n-resize');
        }
        else if (relativeYmax < resizeBorder) {
            if (relativeXmin < resizeBorder)
                this.rect.attr('cursor', 'sw-resize');
            else if (relativeXmax < resizeBorder)
                this.rect.attr('cursor', 'se-resize');
            else
                this.rect.attr('cursor', 's-resize');
        }
        else {
            if (relativeXmin < resizeBorder)
                this.rect.attr('cursor', 'w-resize');
            else if (relativeXmax < resizeBorder)
                this.rect.attr('cursor', 'e-resize');
            else
                this.rect.attr('cursor', 'move');
        }
    }
}
