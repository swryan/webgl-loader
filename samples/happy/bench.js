var out = window.document.getElementById('output');

var decode_ms = 0;

var start_drawing = false;

function updateDecode(ms) {
  decode_ms += ms;
}

function updateTotal(ms) {
  start_drawing = true;
  out.innerHTML = "Decode time: " + decode_ms +
      " ms, Total time: " + ms + " ms";
}

var URLS = [ 'happy.A.utf8',
             'happy.B.utf8',
             'happy.C.utf8',
             'happy.D.utf8',
             'happy.E.utf8',
             'happy.F.utf8',
             'happy.G.utf8',
             'happy.H.utf8',
             'happy.I.utf8',
             'happy.J.utf8',
             'happy.K.utf8' ];

function DecompressMesh(str) {
  var start_time = Date.now();
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
  for (var i = 3; i < 5; ++i) {
    // Skip decoding texcoords.
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
  for (var i = 0; i < num_indices; ++i) {
    var code = str.charCodeAt(i + offset);
    indices_out[i] = index_high_water_mark - code;
    if (code == 0) {
      index_high_water_mark++;
    }
  }
  updateDecode(Date.now() - start_time);
  return [attribs_out, indices_out];
}

var meshes = [];
var start_time = Date.now();
for (var i = 0; i < URLS.length; ++i) {
  var req = new XMLHttpRequest();
  req.onload = function() {
    if (this.status === 200 || this.status === 0) {
      meshes[meshes.length] = DecompressMesh(this.responseText);
      if (meshes.length === URLS.length) {
        updateTotal(Date.now() - start_time);
      }
    }
  };
  req.open('GET', URLS[i], true);
  req.send(null);
}
