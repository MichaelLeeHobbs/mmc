/*
 * Rhino feature probe suite. Runs UNDER Rhino (via RunProbes.java).
 *
 * Each probe is isolated so a PARSE error in one snippet does not abort the
 * rest: every snippet is run through eval(codeString) inside a try/catch.
 *
 * Output: one structured line per probe (real tab characters):
 *   RESULT\t<category>\t<feature>\t<YES|NO|PARTIAL>\t<short detail>
 *
 * For pure syntax/feature checks: YES if it parses+runs, NO if it throws
 * (detail includes the error class).
 * For BEHAVIOR checks: compare observed vs ES6-expected and report YES
 * (spec-correct), PARTIAL (works but non-spec, detail = what it did), or NO.
 */

var TAB = String.fromCharCode(9);

function emit(category, feature, status, detail) {
  if (detail === undefined || detail === null) {
    detail = "";
  }
  // Keep detail single-line.
  detail = String(detail).replace(/[\r\n\t]+/g, " ");
  print("RESULT" + TAB + category + TAB + feature + TAB + status + TAB + detail);
}

function errLabel(e) {
  // Best-effort short label for a thrown value.
  if (e && e.name) {
    var m = e.message ? (": " + e.message) : "";
    return String(e.name) + m;
  }
  return String(e);
}

/**
 * Pure feature/syntax probe.
 * codeString is eval'd; if it returns truthy (or just doesn't throw and
 * returns undefined) it's YES, otherwise reports based on the result.
 * We treat "ran without throwing" as YES unless the snippet explicitly
 * returns the string "NO"/"PARTIAL:..." to signal a behavior mismatch.
 */
function feature(category, name, codeString) {
  try {
    var r = eval(codeString);
    if (typeof r === "string" && r.indexOf("PARTIAL:") === 0) {
      emit(category, name, "PARTIAL", r.substring("PARTIAL:".length));
    } else if (r === "NO") {
      emit(category, name, "NO", "assertion failed");
    } else if (typeof r === "string" && r.indexOf("NO:") === 0) {
      emit(category, name, "NO", r.substring("NO:".length));
    } else if (r === false) {
      emit(category, name, "NO", "returned false");
    } else {
      emit(category, name, "YES", typeof r === "string" ? r : "");
    }
  } catch (e) {
    emit(category, name, "NO", errLabel(e));
  }
}

/**
 * Behavior probe: codeString must return one of:
 *   "YES:detail" | "PARTIAL:detail" | "NO:detail"
 * If it throws, that's NO with the error label.
 */
function behavior(category, name, codeString) {
  try {
    var r = eval(codeString);
    var s = String(r);
    if (s.indexOf("YES:") === 0) {
      emit(category, name, "YES", s.substring(4));
    } else if (s.indexOf("PARTIAL:") === 0) {
      emit(category, name, "PARTIAL", s.substring(8));
    } else if (s.indexOf("NO:") === 0) {
      emit(category, name, "NO", s.substring(3));
    } else {
      emit(category, name, "PARTIAL", "unexpected probe result: " + s);
    }
  } catch (e) {
    emit(category, name, "NO", errLabel(e));
  }
}

/* ============================ Scoping ============================ */

feature("Scoping", "let declaration", "let a1 = 1; a1 === 1");
feature("Scoping", "const declaration", "const a2 = 1; a2 === 1");

behavior("Scoping", "const reassignment throws",
  "try { eval('const cc1 = 1; cc1 = 2;'); 'NO:reassignment allowed (no error)'; }" +
  " catch (e) { 'YES:threw ' + errLabel(e); }");

behavior("Scoping", "block scoping (let does not leak)",
  "var __r;" +
  " try {" +
  "   eval('{ let __blk = 1; } (typeof __blk === \"undefined\")') ?" +
  "     (__r = 'YES:block-scoped, did not leak') :" +
  "     (__r = 'PARTIAL:let leaked out of block');" +
  " } catch (e) { __r = 'NO:' + errLabel(e); }" +
  " __r;");

behavior("Scoping", "for-let per-iteration binding (closure capture)",
  "var __r;" +
  " try {" +
  "   var __got = eval('(function(){ var f=[]; for (let i=0;i<3;i++){ f.push(function(){return i;}); } return f[0]()+\",\"+f[1]()+\",\"+f[2](); })()');" +
  "   if (__got === '0,1,2') { __r = 'YES:per-iteration binding (0,1,2)'; }" +
  "   else if (__got === '3,3,3') { __r = 'PARTIAL:captures final value (3,3,3) - not per-iteration'; }" +
  "   else { __r = 'PARTIAL:got ' + __got; }" +
  " } catch (e) { __r = 'NO:' + errLabel(e); }" +
  " __r;");

behavior("Scoping", "const re-declared each loop iteration",
  "var __r;" +
  " try {" +
  "   eval('for (var k=0;k<2;k++){ const c = k; }');" +
  "   __r = 'YES:no redeclaration error across iterations';" +
  " } catch (e) { __r = 'NO:' + errLabel(e); }" +
  " __r;");

behavior("Scoping", "for-const-of per-iteration const",
  "var __r;" +
  " try {" +
  "   var __sum = eval('(function(){ var s=0; for (const x of [1,2,3]){ s += x; } return s; })()');" +
  "   __r = (__sum === 6) ? 'YES:for-const-of works (sum=6)' : 'PARTIAL:sum=' + __sum;" +
  " } catch (e) { __r = 'NO:' + errLabel(e); }" +
  " __r;");

/* ============================ Functions ============================ */

feature("Functions", "arrow function", "eval('(x=>x+1)(1)') === 2");
feature("Functions", "default parameters", "eval('(function(a, b=2){ return a+b; })(1)') === 3");
feature("Functions", "rest parameters", "eval('(function(...a){ return a.length; })(1,2,3)') === 3");
feature("Functions", "spread in call", "eval('Math.max(...[1,2,3])') === 3");

/* ============================ Destructuring ============================ */

feature("Destructuring", "array destructuring", "eval('var [da,db]=[1,2]; da+\",\"+db') === '1,2'");
feature("Destructuring", "array swap", "eval('var s1=1,s2=2; [s1,s2]=[s2,s1]; s1+\",\"+s2') === '2,1'");
feature("Destructuring", "object destructuring", "eval('var o={x:5}; var {x}=o; x') === 5");
feature("Destructuring", "nested destructuring", "eval('var {p:{q}}={p:{q:7}}; q') === 7");
feature("Destructuring", "destructuring with defaults", "eval('var {a=9}={}; a') === 9");
feature("Destructuring", "array param destructuring", "eval('(function([a,b]){ return a+b; })([2,3])') === 5");
feature("Destructuring", "object param destructuring", "eval('(function({a,b}){ return a+b; })({a:2,b:3})') === 5");

/* ============================ Literals/objects ============================ */

behavior("Literals", "template literal interpolation",
  "var __r;" +
  " try {" +
  "   var __v = eval('var tx=5; `val=${tx}`;');" +
  "   if (__v === 'val=5') { __r = 'YES:interpolated correctly'; }" +
  "   else { __r = 'PARTIAL:parsed but produced ' + JSON.stringify(__v) + ' (no interpolation)'; }" +
  " } catch (e) { __r = 'NO:' + errLabel(e); }" +
  " __r;");

feature("Literals", "object shorthand properties", "eval('var v1=1; var o={v1}; o.v1') === 1");
feature("Literals", "computed property names", "eval('var k=\"kk\"; var o={[k]:3}; o.kk') === 3");
feature("Literals", "object spread", "eval('var a={x:1}; var b={...a, y:2}; b.x+\",\"+b.y') === '1,2'");
feature("Literals", "binary literal 0b", "eval('0b101') === 5");
feature("Literals", "octal literal 0o", "eval('0o17') === 15");
feature("Literals", "exponentiation operator **", "eval('2 ** 10') === 1024");

/* ============================ Iteration/collections ============================ */

feature("Iteration", "for-of loop", "eval('(function(){ var s=0; for (var x of [1,2,3]) s+=x; return s; })()') === 6");
feature("Iteration", "Map", "eval('var m=new Map(); m.set(\"a\",1); m.get(\"a\")') === 1");
feature("Iteration", "Set", "eval('var s=new Set([1,1,2]); s.size') === 2");
feature("Iteration", "WeakMap", "eval('var k={}; var w=new WeakMap(); w.set(k,5); w.get(k)') === 5");
feature("Iteration", "Symbol", "eval('typeof Symbol(\"x\")') === 'symbol' || typeof Symbol === 'function'");
feature("Iteration", "generators (function*)", "eval('(function(){ function* g(){ yield 1; yield 2; } var it=g(); return it.next().value + it.next().value; })()') === 3");

/* ============================ Classes ============================ */

feature("Classes", "class declaration", "eval('class C { constructor(){ this.v=1; } } new C().v') === 1");
feature("Classes", "extends / super", "eval('class A { m(){ return 1; } } class B extends A { m(){ return super.m()+1; } } new B().m()') === 2");
feature("Classes", "static method", "eval('class C { static s(){ return 9; } } C.s()') === 9");
feature("Classes", "getter", "eval('class C { get g(){ return 4; } } new C().g') === 4");

/* ============================ Built-ins (ES2015+) ============================ */

feature("BuiltIns", "Array.from", "typeof Array.from==='function' && Array.from('ab').length === 2");
feature("BuiltIns", "Array.of", "typeof Array.of==='function' && Array.of(1,2,3).length === 3");
feature("BuiltIns", "Array.prototype.includes", "typeof [].includes==='function' && [1,2].includes(2)");
feature("BuiltIns", "Array.prototype.find", "typeof [].find==='function' && [1,2,3].find(function(x){return x>1;}) === 2");
feature("BuiltIns", "Array.prototype.flat", "typeof [].flat==='function' && [1,[2]].flat().length === 2");
feature("BuiltIns", "Array.prototype.flatMap", "typeof [].flatMap==='function' && [1,2].flatMap(function(x){return [x,x];}).length === 4");
feature("BuiltIns", "String.prototype.includes", "typeof ''.includes==='function' && 'abc'.includes('b')");
feature("BuiltIns", "String.prototype.startsWith", "typeof ''.startsWith==='function' && 'abc'.startsWith('a')");
feature("BuiltIns", "String.prototype.endsWith", "typeof ''.endsWith==='function' && 'abc'.endsWith('c')");
feature("BuiltIns", "String.prototype.padStart", "typeof ''.padStart==='function' && '5'.padStart(3,'0') === '005'");
feature("BuiltIns", "String.prototype.repeat", "typeof ''.repeat==='function' && 'ab'.repeat(2) === 'abab'");
feature("BuiltIns", "Object.assign", "typeof Object.assign==='function' && Object.assign({},{a:1}).a === 1");
feature("BuiltIns", "Object.entries", "typeof Object.entries==='function' && Object.entries({a:1}).length === 1");
feature("BuiltIns", "Object.values", "typeof Object.values==='function' && Object.values({a:1})[0] === 1");
feature("BuiltIns", "Number.isInteger", "typeof Number.isInteger==='function' && Number.isInteger(3) && !Number.isInteger(3.5)");
feature("BuiltIns", "Math.trunc", "typeof Math.trunc==='function' && Math.trunc(4.7) === 4");

/* ============================ ES2020+ ============================ */

feature("ES2020", "optional chaining ?.", "eval('var o=null; o?.x') === undefined");
feature("ES2020", "nullish coalescing ??", "eval('var o=null; o ?? 5') === 5");
behavior("ES2020", "optional catch binding",
  "var __r;" +
  " try { eval('try { throw 1; } catch { }'); __r='YES:catch without binding allowed'; }" +
  " catch (e) { __r='NO:' + errLabel(e); }" +
  " __r;");
feature("ES2020", "BigInt", "typeof BigInt==='function' && eval('10n + 5n') === eval('15n')");
feature("ES2020", "globalThis", "typeof globalThis !== 'undefined'");
feature("ES2020", "Promise", "typeof Promise === 'function'");
behavior("ES2020", "async / await syntax",
  "var __r;" +
  " try { eval('(async function(){ return await 1; })'); __r='YES:async/await parses'; }" +
  " catch (e) { __r='NO:' + errLabel(e); }" +
  " __r;");

/* ============================ Mirth / Rhino specific ============================ */

feature("MirthRhino", "Java interop (java.lang.System)", "typeof java.lang.System.currentTimeMillis() === 'number'");
feature("MirthRhino", "new java.util.ArrayList()", "eval('var l=new java.util.ArrayList(); l.add(\"a\"); l.size()') === 1");
feature("MirthRhino", "Packages.java.util.UUID", "String(Packages.java.util.UUID.randomUUID()).length === 36");
behavior("MirthRhino", "importPackage",
  "var __r;" +
  " try { importPackage(java.util); __r = (typeof java.util.ArrayList === 'function' || typeof java.util.ArrayList === 'object') ? 'YES:importPackage available' : 'PARTIAL:importPackage ran'; }" +
  " catch (e) { __r='NO:' + errLabel(e); }" +
  " __r;");
behavior("MirthRhino", "importClass",
  "var __r;" +
  " try { importClass(java.util.ArrayList); var l=new ArrayList(); l.add(1); __r = (l.size()===1) ? 'YES:importClass available' : 'PARTIAL:importClass ran'; }" +
  " catch (e) { __r='NO:' + errLabel(e); }" +
  " __r;");
behavior("MirthRhino", "E4X XML literal + child access",
  "var __r;" +
  " try {" +
  "   var x = eval('new XML(\"<a><b>hi</b></a>\")');" +
  "   var child = eval('x.b.toString()');" +
  "   __r = (child === 'hi') ? 'YES:E4X XML works (child=hi)' : 'PARTIAL:XML ok but child=' + child;" +
  " } catch (e) { __r='NO:' + errLabel(e) + ' (E4X may need full Mirth scope)'; }" +
  " __r;");

print("DONE");
