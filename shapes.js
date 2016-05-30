class Shape {
    constructor(x, y, w, h, fill) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.fill = fill;
    }

    within_top(shape, mx, my) {
        return (shape.y + 4 >= my) && (shape.y - 4 <= my)
    }

    within_bottom(shape, mx, my) {
        return (shape.y + shape.h + 4 >= my) && (shape.y + shape.h - 4 <= my)
    }

    within_right(shape, mx, my) {
        return (shape.x + shape.w + 4 >= mx) && (shape.x + shape.w - 4 <= mx);
    }

    within_left(shape, mx, my) {
        return (shape.x + 4 >= mx) && (shape.x - 4 <= mx);
    }

    draw(ctx) {
        ctx.fillStyle = this.fill;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }

    contains(mx, my) {
        var minx = Math.min(this.x, this.x + this.w) - 2;
        var maxx = Math.max(this.x, this.x + this.w) + 2;
        var miny = Math.min(this.y, this.y + this.h) - 2;
        var maxy = Math.max(this.y, this.y + this.h) + 2;
        return (minx <= mx) && (maxx >= mx) &&
            (miny <= my) && (maxy >= my);
    }

    border(mx, my) {
        //Checks if this.within border
        if (this.within_top(this, mx, my) && this.within_left(this, mx, my)) {
            return Shape.prototype.borderenum.TOPLEFT;
        } else if (this.within_top(this, mx, my) && this.within_right(this, mx, my)) {
            return Shape.prototype.borderenum.TOPRIGHT;
        } else if (this.within_bottom(this, mx, my) && this.within_right(this, mx, my)) {
            return Shape.prototype.borderenum.BOTTOMRIGHT;
        } else if (this.within_bottom(this, mx, my) && this.within_left(this, mx, my)) {
            return Shape.prototype.borderenum.BOTTOMLEFT;
        } else if (this.within_top(this, mx, my)) {
            return Shape.prototype.borderenum.TOP;
        } else if (this.within_left(this, mx, my)) {
            return Shape.prototype.borderenum.LEFT;
        } else if (this.within_right(this, mx, my)) {
            return Shape.prototype.borderenum.RIGHT;
        } else if (this.within_bottom(this, mx, my)) {
            return Shape.prototype.borderenum.BOTTOM;
        } else {
            return false;
        }
    }

    move_right(x_offset) {
        this.w = x_offset - this.x;
    }

    move_left(x_offset) {
        this.w += this.x - x_offset;
        this.x = x_offset;
    }

    move_top(y_offset) {
        this.h += this.y - y_offset;
        this.y = y_offset;
    }

    move_down(y_offset) {
        this.h = y_offset - this.y;
    }
}
Shape.prototype.borderenum = {
    TOP: 1,
    LEFT: 2,
    RIGHT: 3,
    BOTTOM: 4,
    TOPLEFT: 5,
    TOPRIGHT: 6,
    BOTTOMLEFT: 7,
    BOTTOMRIGHT: 8

}

