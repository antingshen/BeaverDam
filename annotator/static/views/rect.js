"use strict";


// Constants. ES6 doesn't support class constants yet, thus this hack.
var RectConstants = {
    // Mousing over the RESIZE_BORDER px-border around each rectangle
    // initiates resize, else initiates move.
    RESIZE_BORDER_EDGE: 5 /* px */,
    RESIZE_BORDER_CORNER: 10 /* px */,

    // Minimum dimensions allowed for box
    MIN_RECT_DIMENSIONS: {
        width: 10 /* px */,
        height: 15 /* px */,
    },

    // Map of dragIntent => cursor
    CURSOR_BY_DRAG_INTENT: {
        'nw-resize': 'nwse-resize',
        'se-resize': 'nwse-resize',
        'sw-resize': 'nesw-resize',
        'ne-resize': 'nesw-resize',
        'n-resize': 'ns-resize',
        's-resize': 'ns-resize',
        'e-resize': 'ew-resize',
        'w-resize': 'ew-resize',
        'move': 'move',
        'create': 'crosshair',
    },
};


class Rect {
    constructor({classBaseName, fill}) {
        // Before annotations are attached, we cache appearance in these "pre-
        // attached" properties

        // Bounds set before element is attached to paper
        this.preAttachedBounds = null;

        // Attrs set before element is attached to paper
        this.preAttachedAttrs = {};

        // Front/back set before element is attached to paper
        this.preAttachedZ = null;


        // Bounds of the rect
        this.bounds = undefined;

        // Namespaced class name generator
        this.classBaseName = classBaseName.add('rect');

        // State of class name extensions:
        // If a key has value true, then we add the class player-rect-KEY
        // If a key has value false, then we add the class player-rect-noKEY
        this.classNameExtBooleans = {};

        // Used to calculate new bounds after dragging
        this.boundsBeforeDrag = null;

        // Last bounds meeting or exceeding MIN_RECT_DIMENSIONS
        this.boundsMeetingMin = null;

        // Used to figure out what dragging should do
        this.dragIntent = undefined;

        // Fill color
        this.fill = fill;

        // Raphel rect element
        this.$el = null;

        // jQuer rect element
        this.el = null;

        // Raphel paper that this element is attached to
        this.$paper = null;

        this.getPlayerMetrics = null;

        // Prevent adding new properties
        Misc.preventExtensions(this, Rect);
    }


    // Working with $paper

    getCanvasRelativePoint(x, y) {
        var {offset, scale} = this.getPlayerMetrics();
        return {
            x: (x - offset.left) / scale,
            y: (y - offset.top) / scale,
        };
    }

    attach($paper, getPlayerMetrics) {
        // Don't add twice
        if (this.$el != null) {
            throw new Error("Rect.attach: already attached to paper");
        }

        this.getPlayerMetrics = getPlayerMetrics;
        this.$paper = $paper;

        // Apply appearance
        this.appearDefault();

        // Actually do the attaching
        this.$el = this.$paper.rect(0, 0, this.$paper.width, this.$paper.height);
        this.el = this.$el.node;
        this.applyPreAttachedAppearance();
        this.setHandlers();

        // Trigger event
        $(this).triggerHandler('attach', this.$paper);
    }

    detach() {
        this.$el.remove();

        // Trigger event
        $(this).triggerHandler('detach', this.$paper);
        $(this).off();

        this.$paper = undefined;
    }


    // Appearance
    // Appearance is the combination of attrs, bounds, and z.

    appearDefault() {
        this.setClassNameExts({normal: true});
        this.appear({real: false, selected: true});
    }

    appear({real, selected, singlekeyframe}) {
        this.setClassNameExts({real, selected, singlekeyframe});

        if (selected === true) {
            this.toFront();
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
        this.$el.toFront();
        $(this).triggerHandler('focus');
    }


    // Setting attrs

    setClassNameExts(classNameExtBooleans) {
        Misc.assignNonNull(this.classNameExtBooleans, classNameExtBooleans);
        var classNames = Misc.getClassNamesFromExts([this.classBaseName], this.classBaseName, this.classNameExtBooleans);
        this.attr({class: classNames.join(' ')});
    }

    get fill() {
        return this._fill;
    }

    set fill(fill) {
        this._fill = fill;
        this.attr({
            'fill': this._fill,
        });
    }

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

        if (Bounds.greaterOrEqualTo(bounds, this.MIN_RECT_DIMENSIONS)) {
            this.boundsMeetingMin = bounds;
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

    hasBoundsMeetingMin() {
        if (Bounds.greaterOrEqualTo(this.bounds, this.MIN_RECT_DIMENSIONS)) {
            return true;
        }
        if (this.boundsMeetingMin == null) {
            return false;
        }
        this.bounds = this.boundsMeetingMin;
        return true;
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
        this.$el.dblclick(this.onDoubleclick.bind(this));
    }


    // Event handler: Click

    onMousedown() {
        // Trigger event
        this.focus();
    }


    // Event handler: Drag

    isBeingDragged() {
        return this.boundsBeforeDrag != null;
    }

    onDragStart() {
        // TODO REFACTOR this.player.video.pause();
        this.boundsBeforeDrag = this.bounds;

        // Trigger event
        $(this).triggerHandler('drag-start');
    }

    onDragMove(dx, dy) {
        var {scale} = this.getPlayerMetrics();
        dx /= scale;
        dy /= scale;

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
            case 'create':
                this.resize({dxMax: dx, dyMax: dy});
                break;
        }
    }

    onDragEnd() {
        // In case something went wrong with the handlers
        if (this.boundsBeforeDrag == null) return;

        if (!this.hasBoundsMeetingMin()) {
            throw new Error('Rect.onDragEnd: bounds error');
        }
        if (!Bounds.equals(this.bounds, this.boundsBeforeDrag)) {
            $(this).triggerHandler('discrete-change', this.bounds);
        }
        this.boundsBeforeDrag = undefined;

        // Trigger event
        $(this).triggerHandler('drag-end');
    }

    onDoubleclick() {
        $(this).triggerHandler('discrete-change', this.bounds);
    }


    // Event handler: Mouseover

    get dragIntent() {
        return this._dragIntent;
    }

    set dragIntent(dragIntent) {
        $(this).triggerHandler('change-cursor', this.CURSOR_BY_DRAG_INTENT[dragIntent]);
        // this.attr({'cursor': this.CURSOR_BY_DRAG_INTENT[dragIntent]});

        this._dragIntent = dragIntent;
    }

    onMouseover(e, absMouseX, absMouseY) {
        // Don't change cursor during a drag operation
        if (this.isBeingDragged()) return;

        // X,Y Coordinates relative to shape's orgin
        var mouse = this.getCanvasRelativePoint(absMouseX, absMouseY);
        var relative = {
            xMin: mouse.x - this.bounds.xMin,
            yMin: mouse.y - this.bounds.yMin,
            xMax: this.bounds.xMax - mouse.x,
            yMax: this.bounds.yMax - mouse.y,
        };

        // Change cursor
        if (relative.xMin > this.RESIZE_BORDER_EDGE && relative.xMax > this.RESIZE_BORDER_EDGE &&
            relative.yMin > this.RESIZE_BORDER_EDGE && relative.yMax > this.RESIZE_BORDER_EDGE) {
            this.dragIntent = 'move';
        }
        else if (relative.yMin < this.RESIZE_BORDER_CORNER) {
            if (relative.xMin < this.RESIZE_BORDER_CORNER)
                this.dragIntent = 'nw-resize';
            else if (relative.xMax < this.RESIZE_BORDER_CORNER)
                this.dragIntent = 'ne-resize';
            else
                this.dragIntent = 'n-resize';
        }
        else if (relative.yMax < this.RESIZE_BORDER_CORNER) {
            if (relative.xMin < this.RESIZE_BORDER_CORNER)
                this.dragIntent = 'sw-resize';
            else if (relative.xMax < this.RESIZE_BORDER_CORNER)
                this.dragIntent = 'se-resize';
            else
                this.dragIntent = 's-resize';
        }
        else {
            if (relative.xMin < this.RESIZE_BORDER_CORNER)
                this.dragIntent = 'w-resize';
            else if (relative.xMax < this.RESIZE_BORDER_CORNER)
                this.dragIntent = 'e-resize';
            else
                throw new Error('Rect.onMouseover: internal error');
        }
    }
}

// Mix-in constants
Misc.mixinClassConstants(Rect, RectConstants);
void Rect;


class CreationRect extends Rect {
    constructor() {
        super(...arguments);

        // Prevent adding new properties
        Misc.preventExtensions(this, CreationRect);
    }

    setHandlers() {
        this.$el.mousedown(this.onMousedown.bind(this));
        this.$el.drag(this.onDragMove.bind(this), this.onDragStart.bind(this), this.onDragEnd.bind(this));
        this.$el.mousemove(this.onMouseover.bind(this));
    }


    // Setting appearance

    appearDefault() {
        this.setClassNameExts({creation: true});
        this.appear({active: false});

        // Draw with correct size at least once when we're attached to the paper
        // $(this).on('attach', () => this.appear({active: false}));
    }

    appear({active}) {
        this.setClassNameExts({active});

        if (active === true) {
            this.toFront();
        }
        else if (active === false) {
            this.toBack();
            if (this.$paper != null) {
                this.bounds = {
                    xMin: 0,
                    xMax: this.$paper.width,
                    yMin: 0,
                    yMax: this.$paper.height,
                };
            }
        }
    }


    // Actions
    focus() {
        $(this).triggerHandler('focus');
    }


    // Event handlers

    onMousedown() {
        this.focus();
    }

    onDragStart(absMouseX, absMouseY) {
        var mouse = this.getCanvasRelativePoint(absMouseX, absMouseY);
        this.bounds = {
            xMin: mouse.x,
            xMax: mouse.x,
            yMin: mouse.y,
            yMax: mouse.y,
        };
        this.boundsBeforeDrag = this.bounds;
        this.boundsMeetingMin = null;

        this.appear({active: true});

        // Trigger event
        $(this).triggerHandler('drag-start');
    }

    onDragEnd() {
        // Trigger event
        if (this.hasBoundsMeetingMin()) {
            $(this).triggerHandler('create-bounds', this.bounds);
        }

        this.boundsBeforeDrag = undefined;

        this.appear({active: false});

        // Trigger event
        $(this).triggerHandler('drag-end');
    }

    onMouseover() {
        this.dragIntent = 'create';
    }

}

void CreationRect;
