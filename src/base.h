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
#ifndef WEBGL_LOADER_BASE_H_
#define WEBGL_LOADER_BASE_H_

#include <stdio.h>
#include <stdlib.h>

#include <vector>

typedef unsigned short uint16;
typedef short int16;
typedef unsigned int uint32;

typedef std::vector<float> AttribList;
typedef std::vector<int> IndexList;
typedef std::vector<uint16> QuantizedAttribList;
typedef std::vector<uint16> OptimizedIndexList;

// TODO: these data structures ought to go elsewhere.
struct DrawMesh {
  // Interleaved vertex format:
  //  3-D Position
  //  3-D Normal
  //  2-D TexCoord
  // Note that these
  AttribList attribs;
  // Indices are 0-indexed.
  IndexList indices;
};

struct WebGLMesh {
  QuantizedAttribList attribs;
  OptimizedIndexList indices;
};

typedef std::vector<WebGLMesh> WebGLMeshList;

static inline int strtoint(const char* str, const char** endptr) {
  return static_cast<int>(strtol(str, const_cast<char**>(endptr), 10));
}

static inline const char* stripLeadingWhitespace(const char* str) {
  while (isspace(*str)) {
    ++str;
  }
  return str;
}

static inline void terminateAtNewline(const char* str) {
  char* newline = strpbrk(str, "\r\n");
  if (newline) {
    *newline = '\0';
  }
}

// Jenkin's One-at-a-time Hash. Not the best, but simple and
// portable.
uint32 SimpleHash(char *key, size_t len, uint32 seed = 0) {
  uint32 hash = seed;
  for(size_t i = 0; i < len; ++i) {
    hash += static_cast<unsigned char>(key[i]);
    hash += (hash << 10);
    hash ^= (hash >> 6);
  }
  hash += (hash << 3);
  hash ^= (hash >> 11);
  hash += (hash << 15);
  return hash;
}

void ToHex(uint32 w, char out[9]) {
  const char kOffset0 = '0';
  const char kOffset10 = 'a' - 10;
  out[8] = '\0';
  for (size_t i = 8; i > 0;) {
    uint32 bits = w & 0xF;
    out[--i] = bits + ((bits < 10) ? kOffset0 : kOffset10);
    w >>= 4;
  }
}

// TODO: Visual Studio calls this someting different.
#ifdef putc_unlocked
# define PutChar putc_unlocked
#else
# define PutChar putc
#endif  // putc_unlocked

#ifndef CHECK
# define CHECK(PRED) if (!(PRED)) {                                     \
    fprintf(stderr, "%s:%d CHECK failed: " #PRED "\n", __FILE__, __LINE__); \
    exit(-1); } else
#endif  // CHECK

#endif  // WEBGL_LOADER_BASE_H_
