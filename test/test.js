
var libpath = process.env['TEST_COV'] ? '../lib-cov' : '../lib';
require(libpath+"/bible-ref-parser.js");
var assert = require("assert");

test('John 3:16', function(){
  var b = BibleRefParser("John 3:16");
  assert.deepEqual(b.references,
    [ { bookId: "John", chapter: 3, startVerse: 16, endVerse: 16 },
    ]
  );
});

test('John 3:16 Junk (non-strict)', function(){
  var b = BibleRefParser("John 3:16 junk at end of reference");
  assert.deepEqual(b.references,
    [ { bookId: "John", chapter: 3, startVerse: 16, endVerse: 16 },
    ]
  );
});

test('John 3:16 Junk (strict)', function(){
  assert.throws(
    function() { BibleRefParser("John 3:16 junk at end of reference", {strict: 1}); },
    "Junk at end of reference"
  );
});

test('3:16', function(){
  assert.throws(
    function() { BibleRefParser("3:16", {strict: 1}); },
    "Unparsable reference"
  );
});

test('Bad language', function(){
  assert.throws(
    function() { BibleRefParser("3:16", {lang: "XX"}); },
    "Unknown language XX"
  );
});
test('Gen 1:1-2:4', function(){
  var b = BibleRefParser("Gen 1:1-2:4");
  assert.deepEqual(b.references,
    [ { bookId: "Gen", chapter: 1, startVerse: 1, endVerse: 31 },
      { bookId: "Gen", chapter: 2, startVerse: 1, endVerse: 4 } ]
  );
});

test('Gen 1:1-2:4; 3:1-3:11', function(){
  var b = BibleRefParser("Gen 1:1-2:4; 3:1-3:11");
  assert.deepEqual(b.references,
    [ { bookId: "Gen", chapter: 1, startVerse: 1, endVerse: 31 },
      { bookId: "Gen", chapter: 2, startVerse: 1, endVerse: 4 },
      { bookId: "Gen", chapter: 3, startVerse: 1, endVerse: 11 },
   ]
  );
});

test('Gen 1:1-2:4; Lev 3:1-3:11', function(){
  var b = BibleRefParser("Gen 1:1-2:4; Lev 3:1-3:11");
  assert.deepEqual(b.references,
    [ { bookId: "Gen", chapter: 1, startVerse: 1, endVerse: 31 },
      { bookId: "Gen", chapter: 2, startVerse: 1, endVerse: 4 },
      { bookId: "Lev", chapter: 3, startVerse: 1, endVerse: 11 },
   ]
  );
});

test('Gen 1:1-2:4, 2:14-16; Lev 3:1-3:11; 3:13-16', function(){
  var b = BibleRefParser("Gen 1:1-2:4, 2:14-16; Lev 3:1-3:11; 3:13-16");
  assert.deepEqual(b.references,
    [ { bookId: "Gen", chapter: 1, startVerse: 1, endVerse: 31 },
      { bookId: "Gen", chapter: 2, startVerse: 1, endVerse: 4 },
      { bookId: "Gen", chapter: 2, startVerse: 14, endVerse: 16 },
      { bookId: "Lev", chapter: 3, startVerse: 1, endVerse: 11 },
      { bookId: "Lev", chapter: 3, startVerse: 13, endVerse: 16 },
   ]
  );
});

test('Gen 1:4-,2:3', function(){
  var b = BibleRefParser("Gen 1:4-,2:3");
  assert.deepEqual(b.references,
    [ { bookId: "Gen", chapter: 1, startVerse: 4, endVerse: 31 },
      { bookId: "Gen", chapter: 2, startVerse: 3, endVerse: 3 },
   ]
  );
});

test('Gen 1:4-; 2 ; 3:3', function(){
  var b = BibleRefParser("Gen 1:4-; 2 ; 3:3");
  assert.deepEqual(b.references,
    [ { bookId: "Gen", chapter: 1, startVerse: 4, endVerse: 31 },
      { bookId: "Gen", chapter: 2, startVerse: 1, endVerse: 25 },
      { bookId: "Gen", chapter: 3, startVerse: 3, endVerse: 3 },

   ]
  );
});


test('Gen 1:4-, 2 ; 3:3', function(){
  var b = BibleRefParser("Gen 1:4-, 2 ; 3:3");
  assert.deepEqual(b.references,
    [ { bookId: "Gen", chapter: 1, startVerse: 4, endVerse: 31 },
      { bookId: "Gen", chapter: 1, startVerse: 2, endVerse: 2 },
      { bookId: "Gen", chapter: 3, startVerse: 3, endVerse: 3 },

   ]
  );
});

test("Iterator", function(){
  var b = BibleRefParser("Gen 1:2,4,6,8");
  var it = b.iterator();
  var v = it.next();
  assert.deepEqual(v,{ bookId: "Gen", chapter: 1, verse: 2 });
  v = it.next();
  assert.deepEqual(v,{ bookId: "Gen", chapter: 1, verse: 4 });
  v = it.next();
  assert.deepEqual(v,{ bookId: "Gen", chapter: 1, verse: 6 });
  v = it.next();
  assert.deepEqual(v,{ bookId: "Gen", chapter: 1, verse: 8 });
  v = it.next();
  assert.deepEqual(v, undefined);
});

test('Gen 2', function(){
  var b = BibleRefParser("Gen 2");
  assert.deepEqual(b.references,
    [ 
      { bookId: "Gen", chapter: 2, startVerse: 1, endVerse: 25 },
   ]
  );
});
test('Basic stringification: Gen 1:4-10', function(){
  var b = BibleRefParser("Gen 1:4-10");
  assert.equal(b.toString(), "Gen 1:4-10");
});

test('Stringification: Gen 1:4-, 2 ; 3:3', function(){
  var b = BibleRefParser("Gen 1:4-, 2 ; 3:3");
  assert.equal(b.toString(), "Gen 1:4-,2; 3:3");
});

test('Stringification: Gen 1:2,4,6,8', function(){
  var b = BibleRefParser("Gen 1:2,4,6,8");
  assert.equal(b.toString(), "Gen 1:2,4,6,8");
});

test('Gen 1:1-2:4, 2:14-16; Lev 3:1-3:11; 3:13-16', function(){
  var b = BibleRefParser("Gen 1:1-2:4, 2:14-16; Lev 3:1-3:11; 3:13-16");
  assert.equal(b.toString(),"Gen 1; 2:1-4,14-16; Lev 3:1-11,13-16");
});