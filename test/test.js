
var libpath = process.env['TEST_COV'] ? '../lib-cov' : '../lib';
require(libpath+"/bible-ref-parser.js");
var assert = require("assert");

test('John 3:16', function(){
  var b = BibleRefParser("John 3:16");
  assert.deepEqual(b.references,
    [ { bookId: 43, chapter: 3, startVerse: 16, endVerse: 16, bookOsis: "John" },
    ]
  );
});

test('John 3:16 Junk (non-strict)', function(){
  var b = BibleRefParser("John 3:16 junk at end of reference");
  assert.deepEqual(b.references,
    [ { bookId: 43, chapter: 3, startVerse: 16, endVerse: 16, bookOsis: "John" },
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
    [ { bookId: 1, chapter: 1, startVerse: 1, endVerse: 25, bookOsis: "Gen" },
      { bookId: 1, chapter: 2, startVerse: 1, endVerse: 4, bookOsis: "Gen" } ]
  );
});

test('Gen 1:1-2:4; 3:1-3:11', function(){
  var b = BibleRefParser("Gen 1:1-2:4; 3:1-3:11");
  assert.deepEqual(b.references,
    [ { bookId: 1, chapter: 1, startVerse: 1, endVerse: 25, bookOsis: "Gen" },
      { bookId: 1, chapter: 2, startVerse: 1, endVerse: 4, bookOsis: "Gen" },
      { bookId: 1, chapter: 3, startVerse: 1, endVerse: 11, bookOsis: "Gen" },
   ]
  );
});

test('Gen 1:1-2:4; Lev 3:1-3:11', function(){
  var b = BibleRefParser("Gen 1:1-2:4; Lev 3:1-3:11");
  assert.deepEqual(b.references,
    [ { bookId: 1, chapter: 1, startVerse: 1, endVerse: 25, bookOsis: "Gen" },
      { bookId: 1, chapter: 2, startVerse: 1, endVerse: 4, bookOsis: "Gen" },
      { bookId: 3, chapter: 3, startVerse: 1, endVerse: 11, bookOsis: "Lev" },
   ]
  );
});

test('Gen 1:1-2:4, 2:14-16; Lev 3:1-3:11; 3:13-16', function(){
  var b = BibleRefParser("Gen 1:1-2:4, 2:14-16; Lev 3:1-3:11; 3:13-16");
  assert.deepEqual(b.references,
    [ { bookId: 1, chapter: 1, startVerse: 1, endVerse: 25, bookOsis: "Gen" },
      { bookId: 1, chapter: 2, startVerse: 1, endVerse: 4, bookOsis: "Gen" },
      { bookId: 1, chapter: 2, startVerse: 14, endVerse: 16, bookOsis: "Gen" },
      { bookId: 3, chapter: 3, startVerse: 1, endVerse: 11, bookOsis: "Lev" },
      { bookId: 3, chapter: 3, startVerse: 13, endVerse: 16, bookOsis: "Lev" },
   ]
  );
});

test('Gen 1:4-,2:3', function(){
  var b = BibleRefParser("Gen 1:4-,2:3");
  assert.deepEqual(b.references,
    [ { bookId: 1, chapter: 1, startVerse: 4, endVerse: 25, bookOsis: "Gen" },
      { bookId: 1, chapter: 2, startVerse: 3, endVerse: 3, bookOsis: "Gen" },
   ]
  );
});

test('Gen 1:4-; 2 ; 3:3', function(){
  var b = BibleRefParser("Gen 1:4-; 2 ; 3:3");
  assert.deepEqual(b.references,
    [ { bookId: 1, chapter: 1, startVerse: 4, endVerse: 25, bookOsis: "Gen" },
      { bookId: 1, chapter: 2, startVerse: 1, endVerse: 24, bookOsis: "Gen" },
      { bookId: 1, chapter: 3, startVerse: 3, endVerse: 3, bookOsis: "Gen" },

   ]
  );
});


test('Gen 1:4-, 2 ; 3:3', function(){
  var b = BibleRefParser("Gen 1:4-, 2 ; 3:3");
  assert.deepEqual(b.references,
    [ { bookId: 1, chapter: 1, startVerse: 4, endVerse: 25, bookOsis: "Gen" },
      { bookId: 1, chapter: 1, startVerse: 2, endVerse: 2, bookOsis: "Gen" },
      { bookId: 1, chapter: 3, startVerse: 3, endVerse: 3, bookOsis: "Gen" },

   ]
  );
});

test("Iterator", function(){
  var b = BibleRefParser("Gen 1:2,4,6,8");
  var it = b.iterator();
  var v = it.next();
  assert.deepEqual(v,{ bookId: 1, chapter: 1, verse: 2, bookOsis: "Gen" });
  v = it.next();
  assert.deepEqual(v,{ bookId: 1, chapter: 1, verse: 4, bookOsis: "Gen" });
  v = it.next();
  assert.deepEqual(v,{ bookId: 1, chapter: 1, verse: 6, bookOsis: "Gen" });
  v = it.next();
  assert.deepEqual(v,{ bookId: 1, chapter: 1, verse: 8, bookOsis: "Gen" });
  v = it.next();
  assert.deepEqual(v, undefined);
});