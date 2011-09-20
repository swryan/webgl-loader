function DecompressMesh(str) {
  var num_verts = str.charCodeAt(0);
  if (num_verts >= 0xE000) num_verts -= 0x0800;
  num_verts++;

  var attribs_out = new Float32Array(8 * num_verts);
  var offset = 1;
  var pos_scale = 1.0 / 8192.0;
  for (var i = 0; i < 3; ++i) {
    var prev_attrib = 0;
    for (var j = 0; j < num_verts; ++j) {
      var code = str.charCodeAt(j + offset);
      prev_attrib += (code >> 1) ^ (-(code & 1));
      attribs_out[8*j + i] = pos_scale*(prev_attrib - 4096);
    }
    offset += num_verts;
  }
  var texcoord_scale = 1.0 / 1024.0;
  for (var i = 3; i < 5; ++i) {
    var prev_attrib = 0;
    for (var j = 0; j < num_verts; ++j) {
      var code = str.charCodeAt(j + offset);
      prev_attrib += (code >> 1) ^ (-(code & 1));
      attribs_out[8*j + i] = texcoord_scale * prev_attrib;
    }
    offset += num_verts;
  }
  for (var i = 5; i < 8; ++i) {
    var prev_attrib = 0;
    for (var j = 0; j < num_verts; ++j) {
      var code = str.charCodeAt(j + offset);
      prev_attrib += (code >> 1) ^ (-(code & 1));
      attribs_out[8*j + i] = prev_attrib - 512;
    }
    offset += num_verts;
  }

  var num_indices = str.length - offset;
  var indices_out = new Uint16Array(num_indices);
  var index_high_water_mark = 0;
  for (var i=0; i<num_indices; i++) {
    var code = str.charCodeAt(i + offset);
    indices_out[i] = index_high_water_mark - code;
    if (code == 0) {
      index_high_water_mark++;
    }
  }
  return [attribs_out, indices_out];
}

function LoaderExample() { }

LoaderExample.prototype = {

num_indices : 0,

load : function(gl)
{
  this.xform = new SglTransformStack();
  this.angle = 0.0;

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  var simpleVsrc = sglNodeText("SIMPLE_VERTEX_SHADER");
  var simpleFsrc = sglNodeText("SIMPLE_FRAGMENT_SHADER");
  var program = new Program(gl, [
      new Shader(gl, simpleVsrc, gl.VERTEX_SHADER),
      new Shader(gl, simpleFsrc, gl.FRAGMENT_SHADER)]);
  this.program = program;
  program.use();

  var texture = gl.createTexture();
  function loadTexture(texture, image) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  loadTexture(texture, document.getElementById("texture"));

  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(program.set_uniform["u_texture"], 0);

  var self = this;
  function BindVertexBuffers(mesh) {
    var position_index = program.set_attrib["a_position"];
    var texcoord_index = program.set_attrib["a_texcoord"];
    var normal_index = program.set_attrib["a_normal"];
    gl.enableVertexAttribArray(position_index);
    gl.enableVertexAttribArray(texcoord_index);
    gl.enableVertexAttribArray(normal_index);
    
    var compressed_attribs = mesh[0];
    var compressed_indices = mesh[1];
    
    this.interleaved = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.interleaved);
    gl.bufferData(gl.ARRAY_BUFFER, compressed_attribs, gl.STATIC_DRAW);
    gl.vertexAttribPointer(position_index, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(texcoord_index, 2, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(normal_index, 3, gl.FLOAT, false, 32, 20);
    
    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, compressed_indices, gl.STATIC_DRAW);
    
    self.num_indices = compressed_indices.length;
  }

  var req = new XMLHttpRequest();
  req.onload = function() {
    if (this.status == 0 || this.status == 200) {
      BindVertexBuffers(DecompressMesh(this.responseText));
    }
  };
  req.open('GET', 'ben_00.utf8', true);
  req.send(null);
},

update : function(gl, dt)
{
  this.angle += 90.0 * dt;
},

draw : function(gl)
{
  // Move some of this (viewport, projection) to a reshape function.
  var w = this.ui.width;
  var h = this.ui.height;

  gl.clearColor(0.2, 0.2, 0.6, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

  gl.viewport(0, 0, w, h);

  this.xform.projection.loadIdentity();
  this.xform.projection.perspective(sglDegToRad(60.0), w/h, 0.1, 100.0);

  this.xform.view.loadIdentity();
  this.xform.view.lookAt(0.0, 2.0, 3.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  this.xform.model.loadIdentity();
  this.xform.model.rotate(sglDegToRad(this.angle), 0.0, 1.0, 0.0);

  gl.uniformMatrix4fv(this.program.set_uniform["u_mvp"], false,
                      this.xform.modelViewProjectionMatrix);
  // Count in elements, offset in bytes.
  gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);
}
};

sglRegisterCanvas("webgl_canvas", new LoaderExample(), 60.0);
