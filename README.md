HEY, DON'T USE THIS
===================

<a
href="https://github.com/openbibleinfo/Bible-Passage-Reference-Parser">This</a>
looks way better instead; use that. This repository should be considered
unmaintained. Sorry; I should have done better research.

 
bible-ref-parser
================

This is a library to help with the tedious job of parsing user-inputted Bible reference strings and turning them into Javascript objects. It deals with most formats that end-users throw at it.

Example
-------

```javascript

var b = BibleRefParser("Gen 1:2-12,14; 2; Lev 3:3ff");
console.log(b.references)
/*
   [ { bookId: "Gen", chapter: 1, startVerse: 2, endVerse: 12 },
     { bookId: "Gen", chapter: 1, startVerse: 14, endVerse: 14 },
     { bookId: "Gen", chapter: 2, startVerse: 1, endVerse: 24 },
     { bookId: "Lev", chapter: 3, startVerse: 3, endVerse: 35 }
   ],
*/

var iter = b.iterator;

var v = it.next(); /* { bookId: "Gen", chapter: 1, verse: 2 } */
v = it.next(); /* { bookId: "Gen", chapter: 1, verse: 3 } */
/* ... */

b.toString(); // Canonical representation: "Gen 1:2-12,14; 2; Lev 3:3-"
```

The book IDs are taken from OSIS/SBL normative abbreviations for Bible book names. Generating an `osisRef` ID from a reference entry should be a simple matter of programming.

Tests
-----

For more examples, see the tests in <a href="test/test.js">`test/test.js`</a>. These are <a href="http://visionmedia.github.io/mocha/">mocha</a> unit tests that can be run from node:

    mocha -u qunit
