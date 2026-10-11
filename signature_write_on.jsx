// Signature write-on (Trim Paths) — After Effects script
// Usage:
// 1) Draw your signature with the Pen tool on a Shape Layer: no Fill, white Stroke,
//    each stroke segment in its OWN group (Shape 1, Shape 2, ...) in writing order.
// 2) Select that Shape Layer.
// 3) File > Scripts > Run Script File... > signature_write_on.jsx

(function () {
    var DURATION_PER_STROKE = 1.2;  // seconds each stroke takes to be written
    var OVERLAP = 0.25;             // seconds the next stroke starts before the previous ends
    var STROKE_WIDTH = 7;
    var STROKE_COLOR = [1, 1, 1];   // white

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("Open a composition first."); return; }

    var layer = comp.selectedLayers[0];
    if (!layer || !(layer instanceof ShapeLayer)) {
        alert("Select the Shape Layer that contains your signature paths.");
        return;
    }

    app.beginUndoGroup("Signature write-on");

    var contents = layer.property("ADBE Root Vectors Group");
    var t = comp.time;
    var easeIn = new KeyframeEase(0, 60);
    var easeOut = new KeyframeEase(0, 60);
    var count = 0;

    // Groups are listed top-to-bottom; writing order = bottom-to-top (Shape 1 is the last one).
    for (var i = contents.numProperties; i >= 1; i--) {
        var group = contents.property(i);
        if (group.matchName !== "ADBE Vector Group") continue;
        var inner = group.property("ADBE Vectors Group");

        // Stroke: set width, colour, round caps and joins
        var stroke = inner.property("ADBE Vector Graphic - Stroke");
        if (!stroke) stroke = inner.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Width").setValue(STROKE_WIDTH);
        stroke.property("ADBE Vector Stroke Color").setValue(STROKE_COLOR);
        stroke.property("ADBE Vector Stroke Line Cap").setValue(2);   // Round
        stroke.property("ADBE Vector Stroke Line Join").setValue(2);  // Round

        // Trim Paths: animate End 0% -> 100%
        var trim = inner.property("ADBE Vector Filter - Trim");
        if (!trim) trim = inner.addProperty("ADBE Vector Filter - Trim");
        var end = trim.property("ADBE Vector Trim End");
        while (end.numKeys > 0) end.removeKey(1);

        var start = t + count * (DURATION_PER_STROKE - OVERLAP);
        end.setValueAtTime(start, 0);
        end.setValueAtTime(start + DURATION_PER_STROKE, 100);
        end.setTemporalEaseAtKey(1, [easeIn], [easeOut]);   // Easy Ease
        end.setTemporalEaseAtKey(2, [easeIn], [easeOut]);

        count++;
    }

    app.endUndoGroup();

    if (count === 0) {
        alert("No path groups found. Put each stroke in its own group.");
    } else {
        var total = (count - 1) * (DURATION_PER_STROKE - OVERLAP) + DURATION_PER_STROKE;
        alert("Done: " + count + " strokes animated (~" + total.toFixed(1) + "s).\n" +
              "Hide or delete the original text layer to see only the written signature.");
    }
})();
