'use strict';

function Renderer(canvas) {
  var self = this;
  this.canvas_ = canvas;

  var gl = createContextFromCanvas(canvas);
  this.gl_ = gl;

  // Camera.
  this.zNear_ = Math.sqrt(3);
  this.model_ = mat4.identity(mat4.create());
  this.view_ = mat4.identity(mat4.create());
  this.proj_ = mat4.create();
  this.mvp_ = mat4.create();

  // Meshes.
  this.meshes_ = [];

  // Resize.
  function onWindowResize_() {
    var canvas = self.canvas_;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    self.postRedisplay();
  }
  onWindowResize_();
  window.addEventListener('resize', onWindowResize_);

  // WebGL
  gl.clearColor(0.4, 0.4, 0.4, 1.0);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
}

Renderer.prototype.postRedisplay = function() {
  var self = this;
  function draw_() {
    var gl = self.gl_;
    var canvas = self.canvas_;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    var fudge = .01;  // TODO: tighter z-fitting.
    var aspectRatio = fudge*canvas.clientWidth/canvas.clientHeight;
    mat4.frustum(-aspectRatio, aspectRatio, -fudge, fudge,
                 fudge*self.zNear_, 100, self.proj_);
    mat4.multiply(self.view_, self.model_, self.mvp_);
    mat4.multiply(self.proj_, self.mvp_, self.mvp_);
    gl.uniformMatrix4fv(self.program_.set_uniform.u_mvp, false, self.mvp_);
    gl.uniformMatrix3fv(self.program_.set_uniform.u_model, false, 
                        mat4.toMat3(self.model_));
    var numMeshes = self.meshes_.length;
    for (var i = 0; i < numMeshes; i++) {
      self.meshes_[i].bindAndDraw(self.program_);
    }
  }
  window.requestAnimFrame(draw_, this.canvas_);
};
