"use strict";

/* A Bounds object describes a bounding box. The class has 4 members: xMin,
   xMax, yMin, yMax.

   We don't need an actual class for it, so we just construct it using object
   notation:

    {
        xMin: ...
        xMax: ...
        yMin: ...
        yMax: ...
    }

   This class holds utility/math functions for Bounds objects.
 */

class Bounds {
    static fromAttrs(attrs) {
        var {x, y, width, height} = attrs;
        return {
            xMin: Math.min(x, x + width),
            xMax: Math.max(x, x + width),
            yMin: Math.min(y, y + height),
            yMax: Math.max(y, y + height),
        };
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
        return {
            xMin: xMin + dxMin,
            xMax: xMax + dxMax,
            yMin: yMin + dyMin,
            yMax: yMax + dyMax,
        };
    }

    static interpolate(bounds0, bounds1, frac) {
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
}
