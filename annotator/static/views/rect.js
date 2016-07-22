"use strict";


class Rect {
    // Constants. ES6 doesn't support class constants yet, so we'll declare
    // them this way for now:

    // Mousing over the RESIZE_BORDER px-border around each rectangle
    // initiates resize, else initiates move.
    get RESIZE_BORDER() {
        return 10 /* px */;
    }


    constructor({fill}) {
        // Before things are attached, we cache appearance in these "pre-
        // attached" properties

        // Bounds set before element is attached to paper
        this.preAttachedBounds = null;

        // Attrs set before element is attached to paper
        this.preAttachedAttrs = {};

        // Front/back set before element is attached to paper
        this.preAttachedZ = null;


        // Bounds of the rect
        this.bounds = undefined;

        // Used to calculate new bounds after dragging
        this.boundsBeforeDrag = null;

        // Used to figure out what dragging should do
        this.dragIntent = undefined;

        // Fill color
        this.fill = fill;

        // Raphel rect element
        this.$el = null;

        // Raphel paper that this element is attached to
        this.$paper = null;

        // Prevent adding new properties
        if (this.constructor === Rect) {
            $(this).on('dummy', $.noop);
            Object.seal(this);
        }
    }


    // Working with $paper

    getCanvasRelativePoint(x, y) {
        // var paperOffset = this.$paper.offset();
        var paperOffset = $(this.$paper.canvas).offset();
        return {
            x: x - paperOffset.left,
            y: y - paperOffset.top,
        };
    }

    attach($paper) {
        // Don't add twice
        if (this.$el != null) {
            throw new Error("Rect.attach: already attached to paper");
        }

        // Apply appearance
        this.setDefaultAppearance();

        // Actually do the attaching
        this.$paper = $paper;
        this.$el = $paper.rect(0, 0, 0, 0);
        this.applyPreAttachedAppearance();
        this.setHandlers();

        // Trigger event
        $(this).triggerHandler('attach', this.$paper);
    }

    detach() {
        this.$el.remove();

        // Trigger event
        $(this).triggerHandler('detach', this.$paper);

        this.$paper = undefined;
    }


    // Appearance
    // Appearnce is the combination of attrs, bounds, and z.

    appearDefault() {
        this.appear();
    }

    appear({real, selected}) {
        this.attr({
            'fill': this.thing.fill,
            'stroke': 'black',
            'stroke-width': 5,
        });

        if (selected === true) {
            this.toFront();
        }
        if (selected != null) {
            this.attr({
                'opacity': selected ? 0.7 : 0.3,
            });
        }

        if (real != null) {
            this.attr({
                'stroke-dasharray': real ? "" : "- ",
            });
        }
    }

    applyPreAttachedAppearance() {
        // Bounds
        if (this.preAttachedBounds != null) {
            this.bounds = this.preAttachedBounds;
            this.preAttachedBounds = null;
        }

        // Attr
        this.$el.attr(this.preAttachedAttrs);
        this.preAttachedAttrs = {};

        // Z
        if (this.preAttachedZ != null) {
            if (this.preAttachedZ == 'front') {
                this.$el.toFront();
            }
            else if (this.preAttachedZ == 'back') {
                this.$el.toFront();
            }
            this.preAttachedZ = null;
        }
    }


    // Actions

    focus() {
        $(this).triggerHandler('focus');
    }


    // Setting attrs

    attr(attrs) {
        if (this.$el == null) {
            Object.assign(this.preAttachedAttrs, attrs);
        }
        else {
            this.$el.attr(attrs);
        }
    }


    // Setting bounds

    // For resize operations, it is easier to work with bounds than with the
    // NW corner and dimensions. The next two functions help with this
    // transformation.

    get bounds() {
        // Optimization to reduct calculations.
        // The result should be exactly the same if this is removed.
        if (this._bounds !== undefined) {
            return this._bounds;
        }

        if (this.$el == null) {
            return this.preAttachedBounds;
        }
        else {
            return Bounds.fromAttrs(this.$el.attrs);
        }
    }

    set bounds(bounds) {
        if (bounds === undefined) {
            this._bounds = bounds;
            return;
        }

        if (this.$el == null) {
            this.preAttachedBounds = bounds;
        }
        else {
            this.$el.attr(Bounds.toAttrs(bounds));
        }

        this._bounds = bounds;

        // Trigger event
        $(this).triggerHandler('incremental-change');
    }

    resize({dxMin, dxMax, dyMin, dyMax}) {
        if (this.boundsBeforeDrag == null) {
            throw new Error("Rect.resize: no this.boundsBeforeDrag");
        }
        this.bounds = Bounds.resize(this.boundsBeforeDrag, dxMin, dxMax, dyMin, dyMax);

        // Trigger event
        $(this).triggerHandler('incremental-resize', this.bounds);
    }

    move(dx, dy) {
        if (this.boundsBeforeDrag == null) {
            throw new Error("Rect.resize: no this.boundsBeforeDrag");
        }
        this.bounds = Bounds.move(this.boundsBeforeDrag, dx, dy);

        // Trigger event
        $(this).triggerHandler('incremental-move');
    }


    // Setting z

    toFront() {
        if (this.$el == null) {
            this.preAttachedZ = 'front';
        }
        else {
            this.$el.toFront();
        }
    }

    toBack() {
        if (this.$el == null) {
            this.preAttachedZ = 'back';
        }
        else {
            this.$el.toBack();
        }
    }


    // Event handlers

    setHandlers() {
        // Handlers
        this.$el.mousedown(this.onMousedown.bind(this));
        this.$el.drag(this.onDragMove.bind(this), this.onDragStart.bind(this), this.onDragEnd.bind(this));
        this.$el.mousemove(this.onMouseover.bind(this));
    }


    // Event handler: Click

    onMousedown() {
        // TODO REFACTOR this.player.selectedThing = this.thing;
        // TODO REFACTOR this.player.drawAnnotations();
        // TODO REFACTOR this.player.drawKeyframebar();
        // this.$el.toFront();

        // Trigger event
        this.focus();
    }


    // Event handler: Drag

    isBeingDragged() {
        return this.boundsBeforeDrag != null;
    }

    onDragStart() {
        // TODO REFACTOR this.player.video.pause();
        this.boundsBeforeDrag = this.bounds();

        // Trigger event
        $(this).triggerHandler('drag-start');
    }

    onDragMove(dx, dy) {
        // Inspect cursor to determine which resize/move process to use
        switch (this.dragIntent) {
            case 'nw-resize':
                this.resize({dxMin: dx, dyMin: dy});
                break;
            case 'ne-resize':
                this.resize({dxMax: dx, dyMin: dy});
                break;
            case 'n-resize':
                this.resize({dyMin: dy});
                break;
            case 'sw-resize':
                this.resize({dxMin: dx, dyMax: dy});
                break;
            case 'se-resize':
                this.resize({dxMax: dx, dyMax: dy});
                break;
            case 's-resize':
                this.resize({dyMax: dy});
                break;
            case 'w-resize':
                this.resize({dxMin: dx});
                break;
            case 'e-resize':
                this.resize({dxMax: dx});
                break;
            case 'move':
                this.move(dx, dy);
                break;
        }
    }

    onDragEnd() {
        // In case something went wrong with the handlers
        if (this.boundsBeforeDrag == null) return;

        if (!Bounds.equals(this.bounds, this.boundsBeforeDrag)) {
            $(this).triggerHandler('discrete-change', this.bounds);
        }
        this.boundsBeforeDrag = undefined;

        // Trigger event
        $(this).triggerHandler('drag-end');
    }


    // Event handler: Mouseover

    get dragIntent() {
        return this._dragIntent;
    }

    set dragIntent(dragIntent) {
        this.attr({'cursor': dragIntent});

        this._dragIntent = dragIntent;
    }

    onMouseover(e, mouseX, mouseY) {
        // Don't change cursor during a drag operation
        if (this.isBeingDragged()) return;

        // X,Y Coordinates relative to shape's orgin
        var shapeWidth = this.attr('width');
        var shapeHeight = this.attr('height');
        var canvasRelative = this.getCanvasRelativePoint(mouseX, mouseY);
        var relativeXmin = canvasRelative.x - this.attr('x');
        var relativeYmin = canvasRelative.y - this.attr('y');
        var relativeXmax = shapeWidth - relativeXmin;
        var relativeYmax = shapeHeight - relativeYmin;

        // Change cursor
        if (relativeYmin < this.RESIZE_BORDER) {
            if (relativeXmin < this.RESIZE_BORDER)
                this.dragIntent = 'nw-resize';
            else if (relativeXmax < this.RESIZE_BORDER)
                this.dragIntent = 'ne-resize';
            else
                this.dragIntent = 'n-resize';
        }
        else if (relativeYmax < this.RESIZE_BORDER) {
            if (relativeXmin < this.RESIZE_BORDER)
                this.dragIntent = 'sw-resize';
            else if (relativeXmax < this.RESIZE_BORDER)
                this.dragIntent = 'se-resize';
            else
                this.dragIntent = 's-resize';
        }
        else {
            if (relativeXmin < this.RESIZE_BORDER)
                this.dragIntent = 'w-resize';
            else if (relativeXmax < this.RESIZE_BORDER)
                this.dragIntent = 'e-resize';
            else
                this.dragIntent = 'move';
        }
    }
}

void Rect;


class CreationRect extends Rect {
    constructor() {
        super(...arguments);

        // Prevent adding new properties
        $(this).on('dummy', $.noop);
        Object.seal(this);
    }

    setHandlers() {
        this.$el.mousedown(this.onMousedown.bind(this));
        this.$el.drag(this.onDragMove.bind(this), this.onDragStart.bind(this), this.onDragEnd.bind(this));
        // this.$el.mousemove(this.onMouseover.bind(this));
    }

    // Setting appearance

    setDefaultAppearance() {
        this.dragIntent = 'se-resize';
        this.appear({active: false});
        // Draw with correct size at least once when we're attached to the paper
        $(this).on('attach', () => this.appear({active: false}));
    }

    appear({active}) {
        if (active === true) {
            this.attr({
                'fill': 'yellow',
                'fill-opacity': 1,
                'opacity': 0.5,
                'stroke': 'black',
                'stroke-opacity': 1,
                'stroke-width': 5,
            });
            this.toFront();
        }
        else if (active === false) {
            this.toBack();
            this.bounds = {
                xMin: 0,
                xMax: (this.$paper != null) ? this.$paper.width : 0,
                yMin: 0,
                yMax: (this.$paper != null) ? this.$paper.height : 0,
            };
            this.attr({
                'fill': 'transparent',
                'stroke': 'transparent',
                'stroke-width': 0,
                'opacity': 0
            });
        }
    }


    // Event handlers

    onMousedown() {
        this.focus();
    }

    onDragStart(mouseX, mouseY) {
        var canvasRelative = this.getCanvasRelativePoint(mouseX, mouseY);
        this.bounds = {
            xMin: canvasRelative.x,
            xMax: canvasRelative.x,
            yMin: canvasRelative.y,
            yMax: canvasRelative.y,
        };
        this.boundsBeforeDrag = this.bounds;

        this.appear({active: true});
    }

    onDragEnd() {
        this.appear({active: false});

        this.boundsBeforeDrag = undefined;

        // Trigger event
        $(this).triggerHandler('create-bounds', this.bounds);
    }
}

void CreationRect;
