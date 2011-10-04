'use strict';

function decompressMesh(str) {
  var num_verts = str.charCodeAt(0);
  if (num_verts >= 0xE000) num_verts -= 0x0800;
  num_verts++;

  var attribs_out = new Float32Array(8 * num_verts);
  var offset = 1;
  var pos_scale = 1.0 / 8191.0;
  for (var i = 0; i < 3; ++i) {
    var prev_attrib = 0;
    for (var j = 0; j < num_verts; ++j) {
      var code = str.charCodeAt(j + offset);
      prev_attrib += (code >> 1) ^ (-(code & 1));
      attribs_out[8*j + i] = pos_scale*(prev_attrib - 4096);
    }
    offset += num_verts;
  }
  var texcoord_scale = 1.0 / 1023.0;
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

function meshBufferData(gl, mesh) {
  var attribs = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, attribs);
  gl.bufferData(gl.ARRAY_BUFFER, mesh[0], gl.STATIC_DRAW);

  var indices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh[1], gl.STATIC_DRAW);

  return [attribs, indices];
}
