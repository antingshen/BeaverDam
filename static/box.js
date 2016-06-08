
// This class represents the box at a particular frame of one thing
class Box {

    constructor(thing, frame, x, y, w, h, interpolated = true) {
        this.thing = thing; // The parent thing object that owns this keyframe
        this.frame = frame;
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;

        // true if interpolated, meaning if modified we must insert this back into parent thing as a new keyframe
        this.interpolated = interpolated;
    }

    // These getters and setters allow us to insert the keyframe into its parent
    // thing if it's modified
    get x() {return this._x;}
    set x(value) {
        this.modified();
        this._x = value;
    }
    get y() {return this._y;}
    set y(value) {
        this.modified();
        this._y = value;
    }
    get w() {return this._w;}
    set w(value) {
        this.modified();
        this._w = value;
    }
    get h() {return this._h;}
    set h(value) {
        this.modified();
        this._h = value;
    }

    modified() {
        if (this.interpolated) {
            this.thing.insertKeyframe(this);
            this.interpolated = false;
        }
    }


    /**
     * Checks if my is close to the top border of the box.
     * @param my The y coordinate.
     * @returns {boolean}
     */
    withinTop(my) {
        return (this.y + 4 >= my) && (this.y - 4 <= my)
    }

    withinBottom(my) {
        return (this.y + this.h + 4 >= my) && (this.y + this.h - 4 <= my)
    }

    withinRight(mx) {
        return (this.x + this.w + 4 >= mx) && (this.x + this.w - 4 <= mx);
    }

    withinLeft(mx) {
        return (this.x + 4 >= mx) && (this.x - 4 <= mx);
    }

    /**
     * Draws the box onto the canvas by modifying ctx attributes.
     * @param ctx The context of the canvas to be drawn on.
     */
    draw(ctx) {
        ctx.fillStyle = this.thing.fill;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }

    /**
     * Checks if (mx, my) is within the box. This will return false
     * if (mx, my) is within  the border. We use minX, maxX, minY, and maxY
     * in the event that there is a negative w or h.
     * @param mx The x coordinate.
     * @param my The y coordinate.
     * @returns {boolean}
     */
    contains(mx, my) {
        var minX = Math.min(this.x, this.x + this.w) - 2;
        var maxX = Math.max(this.x, this.x + this.w) + 2;
        var minY = Math.min(this.y, this.y + this.h) - 2;
        var maxY = Math.max(this.y, this.y + this.h) + 2;
        return (minX <= mx) && (maxX >= mx) &&
            (minY <= my) && (maxY >= my);
    }

    /**
     * Checks if (mx, my) falls within any of the borders.
     * @param mx The x coordinate.
     * @param my The y coordinate.
     * @returns {*} The border number if possible, false otherwise.
     */
    withinBorder(mx, my) {
        //Checks if this.within border
        if (this.withinTop(my) && this.withinLeft(mx)) {
            return Box.border.TOPLEFT;
        } else if (this.withinTop(my) && this.withinRight(mx)) {
            return Box.border.TOPRIGHT;
        } else if (this.withinBottom(my) && this.withinRight(mx)) {
            return Box.border.BOTTOMRIGHT;
        } else if (this.withinBottom(my) && this.withinLeft(mx)) {
            return Box.border.BOTTOMLEFT;
        } else if (this.withinTop(my)) {
            return Box.border.TOP;
        } else if (this.withinLeft(mx)) {
            return Box.border.LEFT;
        } else if (this.withinRight(mx)) {
            return Box.border.RIGHT;
        } else if (this.withinBottom(my)) {
            return Box.border.BOTTOM;
        } else {
            return false;
        }
    }

    /**
     * Moves the Box to the right by x_offset.
     * @param x_offset Distance to the right to be moved.
     */
    moveRight(x_offset) {
        this.w = x_offset - this.x;
    }

    moveLeft(x_offset) {
        this.w += this.x - x_offset;
        this.x = x_offset;
    }

    moveUp(y_offset) {
        this.h += this.y - y_offset;
        this.y = y_offset;
    }

    moveDown(y_offset) {
        this.h = y_offset - this.y;
    }
}

/**
 * The values corresponding with each border.
 */
Box.border = {
    TOP: 1,
    LEFT: 2,
    RIGHT: 3,
    BOTTOM: 4,
    TOPLEFT: 5,
    TOPRIGHT: 6,
    BOTTOMLEFT: 7,
    BOTTOMRIGHT: 8
}
