'use strict';

var canvas = id('canvas');
preventSelection(canvas);

var renderer = new Renderer(canvas);
var gl = renderer.gl_;

var DEFAULT_ATTRIB_ARRAYS = {
  a_position: {
    size: 3,
    stride: 8,
    offset: 0,
    decodeOffset: -4095,
    decodeScale: 1/8191
  },
  a_texcoord: {
    size: 2,
    stride: 8,
    offset: 3,
    decodeOffset: 0,
    decodeScale: 1/1023
  },
  a_normal: {
    size: 3,
    stride: 8,
    offset: 5,
    decodeOffset: -511,
    decodeScale: 1/1023
  }
};

var simpleVsrc = id('SIMPLE_VERTEX_SHADER').text;
var simpleFsrc = id('SIMPLE_FRAGMENT_SHADER').text;
renderer.program_ = new Program(gl, [vertexShader(gl, simpleVsrc),
                                     fragmentShader(gl, simpleFsrc)]);
renderer.program_.use();
renderer.program_.enableVertexAttribArrays(DEFAULT_ATTRIB_ARRAYS);

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
    var mesh = decompressSimpleMesh(xhr.responseText, 
                                    DEFAULT_ATTRIB_ARRAYS);
    renderer.numIndices_ = mesh[1].length;
    meshBufferData(gl, mesh);

    renderer.program_.vertexAttribPointers(DEFAULT_ATTRIB_ARRAYS);

    renderer.postRedisplay();
  }
}
