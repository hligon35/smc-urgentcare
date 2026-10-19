import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { externalizeInlineScripts, exportedHtmlFiles } from "../scripts/export-scripts.mjs";

test("nested patient portal scripts become same-origin assets without changing inert JSON", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "smc-csp-"));
  try {
    await mkdir(path.join(dir,"portal","dashboard"),{recursive:true});
    const sample = '<html><head><script type="application/ld+json">{"a":1}</script></head><body><script>window.__expo=1;</script><script src="/_expo/entry.js"></script></body></html>';
    const input = path.join(dir,"portal","dashboard","index.html");
    await writeFile(input,sample);
    await writeFile(path.join(dir,"index.html"),'<script>window.main=1;</script>');
    const result = await externalizeInlineScripts(dir);
    assert.equal(result.pages,2);
    assert.equal(result.externalized,2);
    const output=await readFile(input,"utf8");
    assert.match(output,/<script type="application\/ld\+json">\{"a":1\}<\/script>/);
    assert.match(output,/src="\/_expo\/static\/js\/web\/init-[a-f0-9]{24}\.js"/);
    assert.doesNotMatch(output,/<script[^>]*>window\.__expo/);
    const hash=output.match(/init-[a-f0-9]{24}\.js/)[0];
    assert.equal(await readFile(path.join(dir,"_expo","static","js","web",hash),"utf8"),"window.__expo=1;");
    const all=[];
    for await (const file of exportedHtmlFiles(dir)) all.push(file);
    assert.equal(all.length,2);
    const repeat=await externalizeInlineScripts(dir);
    assert.equal(repeat.externalized,0,"reprocessing should be idempotent");
  } finally { await rm(dir,{recursive:true,force:true}); }
});
