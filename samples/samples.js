'use strict';

var canvas = ID('canvas');
PreventSelection(canvas);

var renderer = new Renderer(canvas);

// TODO: instead of having these callbacks reach into Renderer's
// internal state, factor such state into a single manager. This will
// be useful for things like serialization and simulation.
mat4.translate(renderer.view_, [0, -0.5, -3]);

function OnDrag(dx, dy) {
  var model = renderer.model_;
  mat4.translate(model, [0, -2*dy/canvas.height, 0.0], model);
  mat4.rotate(model, 10*dx / canvas.width, [0, 1, 0], model);
  renderer.PostRedisplay();
};

AddDragHandler(canvas, OnDrag);

function NDCFromEvent(evt) {
  return [2*evt.clientX/canvas.width-1, 1-2*evt.clientY/canvas.height, 0, 1];
}

var projInv = mat4.create();
var eyeFromEvt = new Float32Array(4);  // TODO: vec4.

function EyeFromNDC(ndcXY) {
  mat4.inverse(renderer.proj_, projInv);  // TODO: adjoint.
  mat4.multiplyVec4(projInv, ndcXY, eyeFromEvt);
  return eyeFromEvt;
}

AddWheelHandler(window, function(dx, dy, evt) {
  var view = renderer.view_;
  EyeFromNDC(NDCFromEvent(evt));
  vec3.scale(eyeFromEvt, dy);
  mat4.translate(view, eyeFromEvt);
  mat4.translate(view, [dx, 0, 0]);
  renderer.PostRedisplay();
  return false;
});

function OnLoad(xhr) {
  if (xhr.status === 200 || xhr.status === 0) {
    var gl = renderer.gl_;
    var mesh = DecompressMesh(xhr.responseText);
    renderer.numIndices_ = mesh[1].length;
    MeshBufferData(gl, mesh);

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

    renderer.PostRedisplay();
  }
}

function LoadTexture(url) {
  var gl = renderer.gl_;
  var texture = gl.createTexture();
  var image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    renderer.PostRedisplay();
  };
  image.src = url;

  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(renderer.program_.set_uniform["u_texture"], 0);
};

LoadTexture('checker.png');
