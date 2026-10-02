// ==========================================================
//   STARFALL DASH — CANVAS COMPATIBILITY
//   Canvas roundRect polyfill
// ==========================================================

// ==========================================================
//   MOBILE LOW-RES RENDER BUFFER
//   The game keeps the same 360x780 logical coordinate space,
//   but on touch devices the expensive scene is rasterized at
//   a slightly lower resolution and then copied to the visible
//   canvas. Gameplay/collision coordinates are unchanged.
// ==========================================================
var SF_MAIN_CTX = ctx;
var SF_MOBILE_RENDER = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
var SF_MOBILE_RENDER_SCALE = 0.80;
var SF_RENDER_BUFFER = null;
var SF_RENDER_BUFFER_CTX = null;

if (SF_MOBILE_RENDER) {
    SF_RENDER_BUFFER = document.createElement('canvas');
    SF_RENDER_BUFFER.width = Math.max(1, Math.round(canvas.width * SF_MOBILE_RENDER_SCALE));
    SF_RENDER_BUFFER.height = Math.max(1, Math.round(canvas.height * SF_MOBILE_RENDER_SCALE));
    SF_RENDER_BUFFER_CTX = SF_RENDER_BUFFER.getContext('2d', { alpha: false });
    if (SF_RENDER_BUFFER_CTX) {
        SF_RENDER_BUFFER_CTX.imageSmoothingEnabled = true;
    }
}

function sfBeginRender() {
    if (!SF_RENDER_BUFFER_CTX) return false;
    ctx = SF_RENDER_BUFFER_CTX;
    ctx.setTransform(SF_MOBILE_RENDER_SCALE, 0, 0, SF_MOBILE_RENDER_SCALE, 0, 0);
    return true;
}

function sfEndRender(lowRes) {
    if (!lowRes) return;
    SF_MAIN_CTX.setTransform(1, 0, 0, 1, 0, 0);
    SF_MAIN_CTX.globalAlpha = 1;
    SF_MAIN_CTX.drawImage(SF_RENDER_BUFFER, 0, 0, canvas.width, canvas.height);
    ctx = SF_MAIN_CTX;
}

// ===== POLYFILL roundRect =====
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

