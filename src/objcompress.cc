#if 0  // A cute trick to making this .cc self-building from shell.
g++ $0 -O2 -Wall -Werror -o `basename $0 .cc`;
exit;
#endif
// Copyright 2011 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License.

#include <sstream>

#include "mesh.h"
#include "optimize.h"

int main(int argc, const char* argv[]) {
  if (argc != 3) {
    fprintf(stderr, "Usage: %s in.obj out.utf8\n\n"
            "\tCompress in.obj to out.utf8 and write bounds to STDOUT.\n\n",
            argv[0]);
    return -1;
  }
  FILE* fp = fopen(argv[1], "r");
  WavefrontObjFile obj(fp);
  fclose(fp);
  const TextureBatches& batches = obj.texture_batches();

  // Pass 1: compute bounds.
  Bounds bounds;
  bounds.Clear();
  for (TextureBatches::const_iterator iter = batches.begin();
       iter != batches.end(); ++iter) {
    bounds.Enclose(iter->second.draw_mesh().attribs);
  }
  std::vector<char> utf8;
  BoundsParams bounds_params = BoundsParams::FromBounds(bounds);
  bounds_params.DumpJson();
  // Pass 2: quantize, optimize, compress, report.
  for (TextureBatches::const_iterator iter = batches.begin();
       iter != batches.end(); ++iter) {
    size_t offset = 0;
    utf8.clear();
    const DrawMesh& draw_mesh = iter->second.draw_mesh();
    QuantizedAttribList quantized_attribs;
    AttribsToQuantizedAttribs(draw_mesh.attribs, bounds_params,
                              &quantized_attribs);
    VertexOptimizer vertex_optimizer(quantized_attribs, draw_mesh.indices);
    WebGLMeshList webgl_meshes;
    vertex_optimizer.GetOptimizedMeshes(&webgl_meshes);
    std::vector<std::string> material;
    std::vector<size_t> attrib_start, attrib_length, index_start, index_length;
    for (size_t i = 0; i < webgl_meshes.size(); ++i) {
      const size_t num_attribs = webgl_meshes[i].attribs.size();
      const size_t num_indices = webgl_meshes[i].indices.size();
      const bool kBadSizes = num_attribs % 8 || num_indices % 3;
      CHECK(!kBadSizes);
      CompressQuantizedAttribsToUtf8(webgl_meshes[i].attribs, &utf8);
      CompressIndicesToUtf8(webgl_meshes[i].indices, &utf8);
      material.push_back(iter->first);
      attrib_start.push_back(offset);
      attrib_length.push_back(num_attribs / 8);
      index_start.push_back(offset + num_attribs);
      index_length.push_back(num_indices / 3);
      offset += num_attribs + num_indices;
    }
    const uint32 hash = SimpleHash(&utf8[0], utf8.size());
    char buf[9] = { '\0' };
    ToHex(hash, buf);
    std::string out_fn = std::string(buf) + "." + argv[2];
    FILE* out_fp = fopen(out_fn.c_str(), "wb");
    printf("\'%s\': [\n", out_fn.c_str());
    for (size_t i = 0; i < webgl_meshes.size(); ++i) {
      printf("  { material: \'%s\',\n"
             "    attribRange: [%zu, %zu],\n"
             "    indexRange: [%zu, %zu],\n"
             "  },\n",
             material[i].c_str(),
             attrib_start[i], attrib_length[i],
             index_start[i], index_length[i]);
    }
    fwrite(&utf8[0], 1, utf8.size(), out_fp);
    fclose(out_fp);
    puts("],");
  }
  return 0;
}
