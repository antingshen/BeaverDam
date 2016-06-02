class Shape {
    /**
     * Basic shape constructor.
     * @param x The starting x coordinate.
     * @param y The starting y coordinate.
     * @param w The width of the shape.
     * @param h The height of the shape;
     * @param fill The color of the shape;
     */
    constructor(x, y, w, h, fill) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.fill = fill;
    }

    /**
     * Checks if my is within the top border range of the shape.
     * @param my The y coordinate.
     * @returns {boolean}
     */
    withinTop(my) {
        return (this.y + 4 >= my) && (this.y - 4 <= my)
    }

    /**
     * Checks if my is within the bottom border range of the shape.
     * @param my The y coordinate.
     * @returns {boolean}
     */
    withinBottom(my) {
        return (this.y + this.h + 4 >= my) && (this.y + this.h - 4 <= my)
    }

    /**
     * Checks if within the right border range of the shape.
     * @param mx The x coordinate.
     * @returns {boolean}
     */
    withinRight(mx) {
        return (this.x + this.w + 4 >= mx) && (this.x + this.w - 4 <= mx);
    }

    /**
     * Checks if within the left border range of the shape.
     * @param mx The x coordinate.
     * @returns {boolean}
     */
    withinLeft(mx) {
        return (this.x + 4 >= mx) && (this.x - 4 <= mx);
    }

    /**
     * Draws the shape onto the canvas by modifying ctx attributes.
     * @param ctx The context of the canvas to be drawn on.
     */
    draw(ctx) {
        ctx.fillStyle = this.fill;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }

    /**
     * Checks if (mx, my) is within the shape. This will return false
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
            return Shape.border.TOPLEFT;
        } else if (this.withinTop(my) && this.withinRight(mx)) {
            return Shape.border.TOPRIGHT;
        } else if (this.withinBottom(my) && this.withinRight(mx)) {
            return Shape.border.BOTTOMRIGHT;
        } else if (this.withinBottom(my) && this.withinLeft(mx)) {
            return Shape.border.BOTTOMLEFT;
        } else if (this.withinTop(my)) {
            return Shape.border.TOP;
        } else if (this.withinLeft(mx)) {
            return Shape.border.LEFT;
        } else if (this.withinRight(mx)) {
            return Shape.border.RIGHT;
        } else if (this.withinBottom(my)) {
            return Shape.border.BOTTOM;
        } else {
            return false;
        }
    }

    /**
     * Moves the shape to the right by x_offset.
     * @param x_offset Distance to the right to be moved.
     */
    moveRight(x_offset) {
        this.w = x_offset - this.x;
    }

    /**
     * Moves the shape to the left by x_offset. Slightly complicated
     * since we have to modify both the x and w values of the shape.
     * @param x_offset Distance to the left to be moved.
     */
    moveLeft(x_offset) {
        this.w += this.x - x_offset;
        this.x = x_offset;
    }

    /**
     * Moves the shape up by y_offset.
     * @param y_offset Distance to the top to be moved.
     */
    moveTop(y_offset) {
        this.h += this.y - y_offset;
        this.y = y_offset;
    }

    /**
     * Moves the shape down by y_offset.
     * @param y_offset Distance to the bottom to be moved.
     */
    moveDown(y_offset) {
        this.h = y_offset - this.y;
    }
}

/**
 * The values corresponding with each border.
 */
Shape.border = {
    TOP: 1,
    LEFT: 2,
    RIGHT: 3,
    BOTTOM: 4,
    TOPLEFT: 5,
    TOPRIGHT: 6,
    BOTTOMLEFT: 7,
    BOTTOMRIGHT: 8
}
