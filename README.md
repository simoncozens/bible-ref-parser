bible-ref-parser
================

This is a library to help with the tedious job of parsing user-inputted Bible reference strings and turning them into Javascript objects. It deals with most formats that end-users throw at it.

It assumes (erroneously, of course) that all Bibles have the same books with the same names, in the same order, with the same number of chapters and verses. 

Example
-------

```javascript

var b = BibleRefParser("Gen 1:2-12,14; 2; Lev 3:3ff");
console.log(b.references)
/*
   [ { bookId: 1, chapter: 1, startVerse: 2, endVerse: 12 },
     { bookId: 1, chapter: 1, startVerse: 14, endVerse: 14 },
     { bookId: 1, chapter: 2, startVerse: 1, endVerse: 24 },
     { bookId: 3, chapter: 3, startVerse: 3, endVerse: 35 }
   ],
*/

var iter = b.iterator;

var v = it.next(); /* { bookId: 1, chapter: 1, verse: 2 } */
v = it.next(); /* { bookId: 1, chapter: 1, verse: 3 } */
/* ... */

```

Tests
-----

For more examples, see the tests in <a href="test/test.js">`test/test.js`</a>. These are <a href="http://visionmedia.github.io/mocha/">mocha</a> unit tests that can be run from node:

    mocha -u qunit