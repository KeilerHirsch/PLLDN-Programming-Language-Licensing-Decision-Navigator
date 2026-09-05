// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { encodeCanonical, sha256, createManifest } from "../src/snapshots/manifest.ts";
import { bundle } from "./fixtures.ts";
function files(){return Object.fromEntries(bundle().map((d,i)=>[`records/${i}.json`,encodeCanonical(d)]));}
test("canonical key order",()=>assert.equal(encodeCanonical({z:1,a:2}),encodeCanonical({a:2,z:1})));
test("array order is material",()=>assert.notEqual(encodeCanonical([1,2]),encodeCanonical([2,1])));
test("SHA256 known vector",async()=>assert.equal(await sha256("abc"),"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"));
test("manifest enumeration order",async()=>{const f=files();assert.deepEqual(await createManifest(f,"fixture.knowledge","fixture.rules"),await createManifest(Object.fromEntries(Object.entries(f).reverse()),"fixture.knowledge","fixture.rules"));});
test("unsafe paths",async()=>{for(const path of ["../x.json","/x.json","C:/x.json","a\\b.json","a//b.json","a/./b.json"])await assert.rejects(()=>createManifest({[path]:"{}"},"fixture.knowledge","fixture.rules"));});
