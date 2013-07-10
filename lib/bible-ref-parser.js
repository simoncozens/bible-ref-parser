// A Bible reference parser, by Simon Cozens <simon@simon-cozens.org>
// Inspired by (and stealing a bit of data from) Jason Wall (Jason@walljm.com // www.walljm.com)

/*
The MIT License (MIT)

Copyright (c) 2013 Simon Cozens

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

BibleRefParser = function(ref, uOptions) {
  var options = { lang: "en" };
  if (uOptions) {
    for (var key in uOptions) { options[key] = uOptions[key]; }
  }
  var context = {
    bookId: 0
  };

  var result = {references: []};
  // Prototype only works on objects, fake it:
  for (var key in BibleRefParser.resultMethods) { result[key] = BibleRefParser.resultMethods[key]; }

  var addRange = function(c, v1, v2) {
    c = parseInt(c, 10); v1 = parseInt(v1, 10); v2 = parseInt(v2, 10);
    if (!v1) { v1 = 1; }
    if (!v2) { v2 = BibleRefParser.booksizes[context.bookId][c]; }
    context.chapter = c;
    result.references.push({
      bookId: context.bookId,
      chapter: c,
      startVerse: v1,
      endVerse: v2
    });
  };

  var addMultiRange = function(c1, v1, c2, v2) {
    c1 = parseInt(c1, 10); v1 = parseInt(v1, 10);
    c2 = parseInt(c2, 10); v2 = parseInt(v2, 10);
    while (c1 <= c2) {
      if (c1 == c2) {
        addRange(c1, v1, v2);
        return;
      } else {
        addRange(c1, v1); // From here until the end of the chapter
        // And now start again at the beginning of the next chapter
        c1++;
        v1 = 1;
      }
    }
  };

  // Set up RE list
  var bookRegexps = BibleRefParser.regexps[options.lang];
  if (!bookRegexps) {
    throw "Unknown language "+options.lang;
  }

  while (ref.match(/\S/)) {
    // Trim off leading space
    ref = ref.replace(/^\s+/,"");
    // Look for a book name
    for (var num in bookRegexps) {
      if (num == 0) { continue; }
      if (ref.match(bookRegexps[num].re)) {
        context.bookId = parseInt(num,10);
        // XXX Other stuff
        ref = ref.replace(bookRegexps[num].re, "");
        break;
      }
    }

    // If we didn't see a book name and we have no context, this reference is junk
    if (!context["bookId"]) {
      throw("Unparsable reference");
    }

    // Longest match case: ChA:VV-ChB:VV
    var mo = ref.match(/^[\s\.,;]*(\d+):(\d+)-(\d+):(\d+)\s*/);
    if (mo) {
      addMultiRange(mo[1],mo[2],mo[3],mo[4]);
      ref = ref.replace(/^[\s\.,;]*(\d+):(\d+)-(\d+):(\d+)\s*/,"");
      continue;
    }

    // Next longest match case: ChA:XX-YY
    mo = ref.match(/^[\s\.,;]*(\d+):(\d+)-(\d+)\s*/);
    if (mo) {
      addRange(mo[1],mo[2],mo[3]);
      ref = ref.replace(/^[\s\.,;]*(\d+):(\d+)-(\d+)\s*/,"");
      continue;
    }

    // Next longest match case: ChA:XX[-|ff.|etc]
    mo = ref.match(/^[\s\.,;]*(\d+):(\d+)(-|ff?.?)\s*/);
    if (mo) {
      addRange(mo[1],mo[2]);
      ref = ref.replace(/^[\s\.,;]*(\d+):(\d+)(-|ff?.?)\s*/,"");
      continue;
    }

    // Next longest match case: ChA:XX
    mo = ref.match(/^[\s\.,;]*(\d+):(\d+)\s*/);
    if (mo) {
      addRange(mo[1],mo[2],mo[2]);
      ref = ref.replace(/^[\s\.,;]*(\d+):(\d+)\s*/,"");
      continue;
    }
    // A chapter after a semicolon
    mo = ref.match(/^;\s*(\d+)\s*/);
    if (mo) {
      addRange(mo[1]);
      ref = ref.replace(/^;\s*(\d+)\s*/,"");
      continue;
    }

    // A verse after a comma
    mo = ref.match(/^,\s*(\d+)\s*/);
    if (mo) {
      if (!context.chapter) { throw("Unparsable reference"); }
      addRange(context.chapter,mo[1],mo[1]);
      ref = ref.replace(/^,\s*(\d+)\s*/,"");
      continue;
    }
    // Other punctuation and space junk
    if (ref.match(/^[\s\.,;:]+/)) {
      ref = ref.replace(/^[\s\.,;:]+/,"");
      continue;
    }
    // We should not be here
    if(options.strict) {
      throw("Junk at end of reference");
    } else {
      return result;
    }
  }
  return result;
};


BibleRefParser.resultMethods = {
  iterator: function () {
    var i = { refPtr: 0, versePtr: 0, references: this.references };
    i.next = function() {
      var ref = this.references[this.refPtr];
      if (!ref) return;
      if (this.versePtr === 0) this.versePtr = ref.startVerse;
      var v = { bookId: ref.bookId, chapter: ref.chapter, verse: this.versePtr };
      this.versePtr++;
      if (this.versePtr > ref.endVerse) {
        // Go to next reference in chain
        this.refPtr++; this.versePtr = 0;
      }
      return v;
    };
    return i;
  }
};

BibleRefParser.regexps = {};
BibleRefParser.regexps["en"] = [
    {},
 { re: /^(ge(n(esis)?)?|gn)\b/i, bookname: "Genesis", longbookname: "Genesis", lastchapter: 50 },
 { re: /^(ex(o(d(us)?)?)?|exd)\b/i, bookname: "Exodus", longbookname: "Exodus", lastchapter: 40 },
 { re: /^(le(v(i(ticus)?)?)?|lv)\b/i, bookname: "Leviticus", longbookname: "Leviticus", lastchapter: 27 },
 { re: /^(nu(m(b(ers?)?)?)?)\b/i, bookname: "Numbers", longbookname: "Book_of_Numbers", lastchapter: 36 },
 { re: /^(de(u(t(eronomy)?)?)?|dt)\b/i, bookname: "Deuteronomy", longbookname: "Deuteronomy", lastchapter: 34 },
 { re: /^(jos(h(ua)?)?)\b/i, bookname: "Joshua", longbookname: "Book_of_Joshua", lastchapter: 24 },
 { re: /^j(dg|ud(ges|g)?|u)\b/i, bookname: "Judges", longbookname: "Book_of_Judges", lastchapter: 21 },
 { re: /^ru(th)?\b/i, bookname: "Ruth", longbookname: "Book_of_Ruth", lastchapter: 4 },
 { re: /^(1st|first|[1i])\s*s(am(uel)?|ml|a)\b/i, bookname: "1 Samuel", longbookname: "First_Samuel", lastchapter: 31 },
 { re: /^(2nd|ii|sec(ond)?|2)\s*s(am(uel)?|ml|a)\b/i, bookname: "2 Samuel", longbookname: "Second_Samuel", lastchapter: 24 },
 { re: /^(1st|first|[1i])\s*k(gs|ings?|[in])?\b/i, bookname: "1 Kings", longbookname: "First_Kings", lastchapter: 22 },
 { re: /^(2nd|ii|sec(ond)?|2)\s*k(gs|ings?|[in])?\b/i, bookname: "2 Kings", longbookname: "Second_Kings", lastchapter: 25 },
 { re: /^(1st|first|[1i])\s*ch(ron(icles)?|r)?\b/i, bookname: "1 Chronicles", longbookname: "First_Chronicles", lastchapter: 29 },
 { re: /^(1st|first|[1i])\s*ch(ron(icles)?|r)?\b/i, bookname: "2 Chronicles", longbookname: "Second_Chronicles", lastchapter: 36 },
 { re: /^ez(ra|r)?\b/i,  bookname: "Ezra", longbookname: "Book_of_Ezra", lastchapter: 10 },
 { re: /^ne(h[ae]miah|h)?\b/i, bookname: "Nehemiah", longbookname: "Book_of_Nehemiah", lastchapter: 13 },
 { re: /^es(th(er)?|t)?\b/i, bookname: "Esther", longbookname: "Book_of_Esther", lastchapter: 10 },
 { re: /^j(ob|[bo])\b/i, bookname: "Job", longbookname: "Book_of_Job", lastchapter: 42 },
 { re: /^ps(alms?|[am])?\b/i, bookname: "Psalm", longbookname: "Psalm", lastchapter: 150 },
 { re: /^pr(ov(erbs?)?|vbs|[ov])?\b/i, bookname: "Proverbs", longbookname: "Book_of_Proverbs", lastchapter: 31 },
 { re: /^ec(cl(es(iastes?)?)?|[cl])?\b/i, bookname: "Ecclesiastes", longbookname: "Ecclesiastes", lastchapter: 12 },
 { re: /^(song\sof\ssolomon|song\sof\ssongs|sos|ss|son|so|song|songs)\b/i, bookname: "Song of Solomon", longbookname: "Song_of_Solomon", lastchapter: 8 },
 { re: /^i(sa(iah|[hi])|[as])\b/i, bookname: "Isaiah", longbookname: "Book_of_Isaiah", lastchapter: 66 },
 { re: /^je(r(emiah|imiah|e)|r)?\b/i, bookname: "Jeremiah", longbookname: "Book_of_Jeremiah", lastchapter: 52 },
 { re: /^la(mentations?|m)?\b/i, bookname: "Lamentations", longbookname: "Book_of_Lamentations", lastchapter: 5 },
 { re: /^ez(ek(iel)?|[ek])?\b/i, bookname: "Ezekiel", longbookname: "Book_of_Ezekiel", lastchapter: 48 },
 { re: /^d(an(iel)?|[aln])\b/i, bookname: "Daniel", longbookname: "Book_of_Daniel", lastchapter: 12 },
 { re: /^ho(sea|s)?\b/i, bookname: "Hosea", longbookname: "Book_of_Hosea", lastchapter: 14 },
 { re: /^j(oel?|l)\b/i, bookname: "Joel", longbookname: "Book_of_Joel", lastchapter: 3 },
 { re: /^am(os|o)?\b/i, bookname: "Amos", longbookname: "Book_of_Amos", lastchapter: 9 },
 { re: /^ob(ad(iah)?|a)?\b/i, bookname: "Obadiah", longbookname: "Book_of_Obadiah", lastchapter: 1 },
 { re: /^j(nh|on(ah)?)\b/i, bookname: "Jonah", longbookname: "Book_of_Jonah", lastchapter: 4 },
 { re: /^mi(cah|c)?\b/i, bookname: "Micah", longbookname: "Book_of_Micah", lastchapter: 7 },
 { re: /^na(hum|h)?\b/i, bookname: "Nahum", longbookname: "Book_of_Nahum", lastchapter: 3 },
 { re: /^ha(bakk?uk|b)?\b/i, bookname: "Habakkuk", longbookname: "Book_of_Habakkuk", lastchapter: 3 },
 { re: /^zep(haniah|h)?\b/i, bookname: "Zephaniah", longbookname: "Book_of_Zephaniah", lastchapter: 3 },
 { re: /^h(ag(g(ai|ia))?|g)\b/i, bookname: "Haggai", longbookname: "Book_of_Haggai", lastchapter: 2 },
 { re: /^z(ch|ec(hariah|h)?)\b/i, bookname: "Zechariah", longbookname: "Book_of_Zechariah", lastchapter: 14 },
 { re: /^mal(achi)?\b/i, bookname: "Malachi", longbookname: "Book_of_Malachi", lastchapter: 4 },
 { re: /^m(at(thew|t)?|t)\b/i, bookname: "Matthew", longbookname: "Gospel_of_Matthew", lastchapter: 28 },
 { re: /^m(ark|rk|[kr])\b/i, bookname: "Mark", longbookname: "Gospel_of_Mark", lastchapter: 16 },
 { re: /^l(ke|uke?|[ku])\b/i, bookname: "Luke", longbookname: "Gospel_of_Luke", lastchapter: 24 },
 { re: /^j(oh|h)?n\b/i, bookname: "John", longbookname: "Gospel_of_John", lastchapter: 21 },
 { re: /^ac(ts|t)?\b/i, bookname: "Acts", longbookname: "Acts_of_the_Apostles", lastchapter: 28 },
 { re: /^r(om(ans?)?|[mo])\b/i, bookname: "Romans", longbookname: "Epistle_to_the_Romans", lastchapter: 16 },
 { re: /^(1st|first|[1i])\s*co(rin(th(ians?)?|t)?|th)?\b/i, bookname: "1 Corinthians", longbookname: "First_Epistle_to_the_Corinthians", lastchapter: 16 },
 { re: /^(2nd|ii|sec(ond)?|2)\s*co(rin(th(ians?)?|t)?|th)?\b/i, bookname: "2 Corinthians", longbookname: "Second_Epistle_to_the_Corinthians", lastchapter: 13 },
 { re: /^ga(la(ti(ans?|ons?)|t)?|l)?\b/i, bookname: "Galatians", longbookname: "Epistle_to_the_Galatians", lastchapter: 6 },
 { re: /^ep(h(es(ians)?|[es])|h)?\b/i, bookname: "Ephesians", longbookname: "Epistle_to_the_Ephesians", lastchapter: 6 },
 { re: /^ph(il(ip(pians)?)?|i)?\b/i, bookname: "Philippians", longbookname: "Epistle_to_the_Philippians", lastchapter: 4 },
 { re: /^co(los(sians?|s)?|l)?\b/i, bookname: "Colossians", longbookname: "Epistle_to_the_Colossians", lastchapter: 4 },
 { re: /^(1st|first|[1i])\s*th(es(sa(lonians?)?|s)?|e)?\b/i, bookname: "1 Thessalonians", longbookname: "First_Epistle_to_the_Thessalonians", lastchapter: 5 },
 { re: /^(2nd|ii|sec(ond)?|2)\s*th(es(sa(lonians?)?|s)?|e)?\b/i, bookname: "2 Thessalonians", longbookname: "Second_Epistle_to_the_Thessalonians", lastchapter: 3 },
 { re: /^(1st|first|[1i])\s*t(im(othy?)?|[im])\b/i, bookname: "1 Timothy", longbookname: "First_Epistle_to_Timothy", lastchapter: 6 },
 { re: /^(2nd|ii|sec(ond)?|2)\s*t(im(othy?)?|m)\b/i, bookname: "2 Timothy", longbookname: "Second_Epistle_to_Timothy", lastchapter: 4 },
 { re: /^tit(us)?\b/i, bookname: "Titus", longbookname: "Epistle_to_Titus", lastchapter: 3 },
 { re: /^ph(ile(mon|m)?|lmn|[lm])\b/i, bookname: "Philemon", longbookname: "Epistle_to_Philemon", lastchapter: 1 },
 { re: /^he(brews?|b)?\b/i, bookname: "Hebrews", longbookname: "Epistle_to_the_Hebrews", lastchapter: 13 },
 { re: /^j(a(mes?|[ms])|ms|[am])\b/i, bookname: "James", longbookname: "Epistle_of_James", lastchapter: 5 },
 { re: /^(1st|first|[1i])\s*p(et(er|e)?|[et])?\b/i, bookname: "1 Peter", longbookname: "First_Epistle_of_Peter", lastchapter: 5 },
 { re: /^(2nd|ii|sec(ond)?|2)\s*p(et(er|e)?|[et])?\b/i,bookname: "2 Peter", longbookname: "Second_Epistle_of_Peter", lastchapter: 3 },
 { re: /^(1st|first|[1i])\s*j(ohn|[no])\b/i, bookname: "1 John", longbookname: "First_Epistle_of_John", lastchapter: 5 },
 { re: /^(2nd|ii|sec(ond)?|2)\s*j(ohn|[no])\b/i, bookname: "2 John", longbookname: "Second_Epistle_of_John", lastchapter: 1 },
 { re: /^(3rd|iii|third|3)\s*j(ohn|[no])\b/i, bookname: "3 John", longbookname: "Third_Epistle_of_John", lastchapter: 1 },
 { re: /^(3rd|iii|third|3)\s*j(ohn|[no])\b/i,  bookname: "Jude", longbookname: "Epistle_of_Jude", lastchapter: 1 },
 { re: /^r(ev(elations?)?|[ev])\b/i, bookname: "Revelation", longbookname: "The_Apocalypse_Of_John", lastchapter: 22 },
];


BibleRefParser.booksizes = [
    [],
    [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26],
    [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38],
    [17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34],
    [54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13],
    [46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12],
    [18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33],
    [36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25],
    [22, 23, 18, 22],
    [28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31, 13],
    [27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25],
    [53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53],
    [18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30],
    [54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30],
    [17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23],
    [11, 70, 13, 24, 17, 22, 28, 36, 15, 44],
    [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31],
    [22, 23, 15, 17, 14, 14, 10, 17, 32, 3],
    [22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17],
    [6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6],
    [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31],
    [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14],
    [17, 17, 11, 16, 16, 13, 13, 14],
    [31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24],
    [19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34],
    [22, 22, 66, 22, 22],
    [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35],
    [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13],
    [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9],
    [20, 32, 21],
    [15, 16, 15, 13, 27, 14, 17, 14, 15],
    [21],
    [16, 10, 10, 11],
    [16, 13, 12, 13, 15, 16, 20],
    [15, 13, 19],
    [17, 20, 19],
    [18, 15, 20],
    [15, 23],
    [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21],
    [14, 17, 18, 6],
    [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20],
    [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20],
    [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53],
    [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25],
    [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31],
    [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27],
    [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24],
    [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 13],
    [24, 21, 29, 31, 26, 18],
    [23, 22, 21, 32, 33, 24],
    [30, 30, 21, 23],
    [29, 23, 25, 18],
    [10, 20, 13, 18, 28],
    [12, 17, 18],
    [20, 15, 16, 16, 25, 21],
    [18, 26, 17, 22],
    [16, 15, 15],
    [25],
    [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25],
    [27, 26, 18, 17, 20],
    [25, 25, 22, 19, 14],
    [21, 22, 18],
    [10, 29, 24, 21, 21],
    [13],
    [15],
    [25],
    [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 18, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21]
];