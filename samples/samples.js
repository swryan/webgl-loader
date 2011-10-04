'use strict';

var canvas = id('canvas');
preventSelection(canvas);

var renderer = new Renderer(canvas);

// TODO: instead of having these callbacks reach into Renderer's
// internal state, factor such state into a single manager. This will
// be useful for things like serialization and simulation.
mat4.translate(renderer.view_, [0, -0.5, -3]);

function onDrag(dx, dy) {
  var model = renderer.model_;
  mat4.translate(model, [0, -2*dy/canvas.height, 0.0], model);
  mat4.rotate(model, 10*dx / canvas.width, [0, 1, 0], model);
  renderer.postRedisplay();
};

addDragHandler(canvas, onDrag);

function ndcFromEvent(evt) {
  return [2*evt.clientX/canvas.width-1, 1-2*evt.clientY/canvas.height, 0, 1];
}

var projInv = mat4.create();
var eyeFromEvt = new Float32Array(4);  // TODO: vec4.

function eyeFromNdc(ndcXY) {
  mat4.inverse(renderer.proj_, projInv);  // TODO: adjoint.
  mat4.multiplyVec4(projInv, ndcXY, eyeFromEvt);
  return eyeFromEvt;
}

addWheelHandler(window, function(dx, dy, evt) {
  var WHEEL_SCALE = 1.0/200;
  var view = renderer.view_;
  eyeFromNdc(ndcFromEvent(evt));
  vec3.scale(eyeFromEvt, -WHEEL_SCALE*dy);
  mat4.translate(view, eyeFromEvt);
  mat4.translate(view, [WHEEL_SCALE*dx, 0, 0]);
  renderer.postRedisplay();
  return false;
});

function onLoad(xhr) {
  if (xhr.status === 200 || xhr.status === 0) {
    var gl = renderer.gl_;
    var mesh = decompressMesh(xhr.responseText);
    renderer.numIndices_ = mesh[1].length;
    meshBufferData(gl, mesh);

    var program = renderer.program_;
    var position_index = program.set_attrib['a_position'];
    var texcoord_index = program.set_attrib['a_texcoord'];
    var normal_index = program.set_attrib['a_normal'];

    gl.enableVertexAttribArray(position_index);
    gl.enableVertexAttribArray(texcoord_index);
    gl.enableVertexAttribArray(normal_index);
    gl.vertexAttribPointer(position_index, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(texcoord_index, 2, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(normal_index, 3, gl.FLOAT, false, 32, 20);

    renderer.postRedisplay();
  }
}
