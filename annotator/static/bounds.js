"use strict";

/**
 * A Bounds object describes a bounding box. The class has 4 members: xMin,
 * xMax, yMin, yMax. In Bounds objects, it is guaranteed that xMin <= xMax &&
 * yMin <= yMax.
 * 
 * We don't need a constructor for Bounds objects, so we just construct it
 * using object notation:
 * 
 *  var bounds = {
 *      xMin: ...
 *      xMax: ...
 *      yMin: ...
 *      yMax: ...
 *  };
 * 
 * The Bounds class holds utility/math functions for Bounds objects.
 */
class Bounds {
    static normalize(bounds) {
        var {xMin, xMax, yMin, yMax} = bounds;
        return {
            xMin: Math.min(xMin, xMax),
            xMax: Math.max(xMin, xMax),
            yMin: Math.min(yMin, yMax),
            yMax: Math.max(yMin, yMax),
        };
    }

    static fromAttrs(attrs) {
        var {x, y, width, height} = attrs;
        return Bounds.normalize({
            xMin: x,
            xMax: x + width,
            yMin: y,
            yMax: y + height,
        });
    }

    static toAttrs(bounds) {
        var {xMin, xMax, yMin, yMax} = bounds;
        return {
            x: xMin,
            y: yMin,
            width: xMax - xMin,
            height: yMax - yMin,
        };
    }

    static resize(bounds, dxMin = 0, dxMax = 0, dyMin = 0, dyMax = 0) {
        var {xMin, xMax, yMin, yMax} = bounds;
        return Bounds.normalize({
            xMin: xMin + dxMin,
            xMax: xMax + dxMax,
            yMin: yMin + dyMin,
            yMax: yMax + dyMax,
        });
    }

    static move(bounds, dx, dy) {
        return Bounds.resize(bounds, dx, dx, dy, dy);
    }

    static interpolate(bounds0, bounds1, frac) {
        if (frac < 0 || frac > 1)
            throw new Error("Bounds.interpolate: invalid argument: frac");

        var ifrac = 1.0 - frac;
        return {
            xMin: bounds0.xMin * ifrac + bounds1.xMin * frac,
            xMax: bounds0.xMax * ifrac + bounds1.xMax * frac,
            yMin: bounds0.yMin * ifrac + bounds1.yMin * frac,
            yMax: bounds0.yMax * ifrac + bounds1.yMax * frac,
        };
    }

    static equals(bounds0, bounds1) {
        if (bounds0.xMin != bounds1.xMin) return false;
        if (bounds0.xMax != bounds1.xMax) return false;
        if (bounds0.yMin != bounds1.yMin) return false;
        if (bounds0.yMax != bounds1.yMax) return false;
        return true;
    }

    static greaterOrEqualTo(bounds, minDimensions) {
        var {xMin, xMax, yMin, yMax} = bounds;
        var {width, height} = minDimensions;

        return (xMax - xMin) >= width && (yMax - yMin) >= height;
    }
}

void Bounds;
