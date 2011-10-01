'use strict';

// Utility wrapper around WebGL. Perserves WebGL semantics, so it
// isn't too object-oriented.

function CreateContextFromCanvas(canvas, opt_attribs) {
  // TODO: handle attributes.
  var ctx = null;
  ['experimental-webgl', 'experimental-webgl'].forEach(function(name) {
    try {
      ctx = canvas.getContext(name);
    } catch (e) { }
  });
  return ctx;
};

// TODO: Fragment, Vertex shader inheritance.
// TODO: Gl.CONSTANT as GL_CONSTANT?
function Shader(gl, source, shaderType) {
  this.gl = gl;
  this.handle = gl.createShader(shaderType);
  gl.shaderSource(this.handle, source);
  gl.compileShader(this.handle);
  if (!gl.getShaderParameter(this.handle, gl.COMPILE_STATUS)) {
    throw this.info();
  }
}

Shader.prototype.info = function() {
    return this.gl.getShaderParameter(this.handle, this.gl.INFO_LOG);
}

Shader.prototype.type = function() {
    return this.gl.getShaderParameter(this.handle, this.gl.SHADER_TYPE);
}

function Program(gl, shaders) {
    this.gl = gl;
    this.handle = gl.createProgram();
    shaders.forEach(function(shader) {
	gl.attachShader(this.handle, shader.handle);
    }, this);
    gl.linkProgram(this.handle);
    if (!gl.getProgramParameter(this.handle, gl.LINK_STATUS)) {
	throw this.info();
    }

    var num_attribs = gl.getProgramParameter(this.handle, gl.ACTIVE_ATTRIBUTES);
    this.attribs = new Array(num_attribs);
    this.set_attrib = {};
    for (var i=0; i<num_attribs; i++) {
	var active_attrib = gl.getActiveAttrib(this.handle, i);
        var loc = gl.getAttribLocation(this.handle, active_attrib.name);
	this.attribs[loc] = active_attrib;
	this.set_attrib[active_attrib.name] = loc;
    }

    var num_uniforms = gl.getProgramParameter(this.handle, gl.ACTIVE_UNIFORMS);
    this.uniforms = new Array(num_uniforms);
    this.set_uniform = {};
    for (var j=0; j<num_uniforms; j++) {
	var active_uniform = gl.getActiveUniform(this.handle, j);
	this.uniforms[j] = active_uniform;
	this.set_uniform[active_uniform.name] = gl.getUniformLocation(
	    this.handle, active_uniform.name);
    }
};

Program.prototype.info = function() {
    return this.gl.getProgramInfoLog(this.handle);
}

Program.prototype.use = function() {
    this.gl.useProgram(this.handle);
}

Program.prototype.validate = function() {
}

// TODO(wonchun): add Texture support!
function Material(vertex_src, fragment_src) {
  this.vertex_src = vertex_src;
  this.fragment_src = fragment_src;
};

// TODO(wonchun): error checking!
Material.prototype.UseProgram = function(gl) {
  if (this.program === undefined) {
    if (this.vertex === undefined) {
      this.vertex = new Shader(gl, this.vertex_src, gl.VERTEX_SHADER);
    }
    if (this.fragment === undefined) {
      this.fragment = new Shader(gl, this.fragment_src, gl.FRAGMENT_SHADER);
    }
    if (this.vertex && this.fragment) {
      this.program = new Program(gl, [this.vertex, this.fragment]);
    }
  }
  this.program.use();
  return this.program;
};

// TODO: decorate obj
function setupVertexArrays(gl, semantic_map, program, obj) {
  var offset = 0;
  var total_bytes = 2*obj.total_dimensions;
  for (idx in obj.dimensions) {
    var dimension = obj.dimensions[idx];
    var bytes = 2*dimension;
    var semantic = obj.semantics[idx];
    var attrib_index = program.set_attrib[semantic];
    if (attrib_index !== undefined) {
      gl.enableVertexAttribArray(attrib_index);
      gl.vertexAttribPointer(attrib_index, dimension, gl.SHORT,
			     SEMANTIC_MAP[semantic].normalize, total_bytes, offset);
    }
    offset += bytes;
  }
}

// What about:
// Matrix attributes? (Column-by-column)
// Aliased attributes?