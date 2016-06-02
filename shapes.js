class Shape {

    constructor(x, y, w, h, fill) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.fill = fill;
    }

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
            return null;
        }
    }

    moveRight(x_offset) {
        this.w = x_offset - this.x;
    }

    moveLeft(x_offset) {
        this.w += this.x - x_offset;
        this.x = x_offset;
    }

    moveTop(y_offset) {
        this.h += this.y - y_offset;
        this.y = y_offset;
    }

    moveDown(y_offset) {
        this.h = y_offset - this.y;
    }
}

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
