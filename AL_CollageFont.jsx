//  json2.js
//  2017-06-12
//  Public Domain.
//  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

//  USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
//  NOT CONTROL.

//  This file creates a global JSON object containing two methods: stringify
//  and parse. This file provides the ES5 JSON capability to ES3 systems.
//  If a project might run on IE8 or earlier, then this file should be included.
//  This file does nothing on ES5 systems.

//      JSON.stringify(value, replacer, space)
//          value       any JavaScript value, usually an object or array.
//          replacer    an optional parameter that determines how object
//                      values are stringified for objects. It can be a
//                      function or an array of strings.
//          space       an optional parameter that specifies the indentation
//                      of nested structures. If it is omitted, the text will
//                      be packed without extra whitespace. If it is a number,
//                      it will specify the number of spaces to indent at each
//                      level. If it is a string (such as "\t" or "&nbsp;"),
//                      it contains the characters used to indent at each level.
//          This method produces a JSON text from a JavaScript value.
//          When an object value is found, if the object contains a toJSON
//          method, its toJSON method will be called and the result will be
//          stringified. A toJSON method does not serialize: it returns the
//          value represented by the name/value pair that should be serialized,
//          or undefined if nothing should be serialized. The toJSON method
//          will be passed the key associated with the value, and this will be
//          bound to the value.

//          For example, this would serialize Dates as ISO strings.

//              Date.prototype.toJSON = function (key) {
//                  function f(n) {
//                      // Format integers to have at least two digits.
//                      return (n < 10)
//                          ? "0" + n
//                          : n;
//                  }
//                  return this.getUTCFullYear()   + "-" +
//                       f(this.getUTCMonth() + 1) + "-" +
//                       f(this.getUTCDate())      + "T" +
//                       f(this.getUTCHours())     + ":" +
//                       f(this.getUTCMinutes())   + ":" +
//                       f(this.getUTCSeconds())   + "Z";
//              };

//          You can provide an optional replacer method. It will be passed the
//          key and value of each member, with this bound to the containing
//          object. The value that is returned from your method will be
//          serialized. If your method returns undefined, then the member will
//          be excluded from the serialization.

//          If the replacer parameter is an array of strings, then it will be
//          used to select the members to be serialized. It filters the results
//          such that only members with keys listed in the replacer array are
//          stringified.

//          Values that do not have JSON representations, such as undefined or
//          functions, will not be serialized. Such values in objects will be
//          dropped; in arrays they will be replaced with null. You can use
//          a replacer function to replace those with JSON values.

//          JSON.stringify(undefined) returns undefined.

//          The optional space parameter produces a stringification of the
//          value that is filled with line breaks and indentation to make it
//          easier to read.

//          If the space parameter is a non-empty string, then that string will
//          be used for indentation. If the space parameter is a number, then
//          the indentation will be that many spaces.

//          Example:

//          text = JSON.stringify(["e", {pluribus: "unum"}]);
//          // text is '["e",{"pluribus":"unum"}]'

//          text = JSON.stringify(["e", {pluribus: "unum"}], null, "\t");
//          // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

//          text = JSON.stringify([new Date()], function (key, value) {
//              return this[key] instanceof Date
//                  ? "Date(" + this[key] + ")"
//                  : value;
//          });
//          // text is '["Date(---current time---)"]'

//      JSON.parse(text, reviver)
//          This method parses a JSON text to produce an object or array.
//          It can throw a SyntaxError exception.

//          The optional reviver parameter is a function that can filter and
//          transform the results. It receives each of the keys and values,
//          and its return value is used instead of the original value.
//          If it returns what it received, then the structure is not modified.
//          If it returns undefined then the member is deleted.

//          Example:

//          // Parse the text. Values that look like ISO date strings will
//          // be converted to Date objects.

//          myData = JSON.parse(text, function (key, value) {
//              var a;
//              if (typeof value === "string") {
//                  a =
//   /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
//                  if (a) {
//                      return new Date(Date.UTC(
//                         +a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]
//                      ));
//                  }
//                  return value;
//              }
//          });

//          myData = JSON.parse(
//              "[\"Date(09/09/2001)\"]",
//              function (key, value) {
//                  var d;
//                  if (
//                      typeof value === "string"
//                      && value.slice(0, 5) === "Date("
//                      && value.slice(-1) === ")"
//                  ) {
//                      d = new Date(value.slice(5, -1));
//                      if (d) {
//                          return d;
//                      }
//                  }
//                  return value;
//              }
//          );

//  This is a reference implementation. You are free to copy, modify, or
//  redistribute.

/*jslint
    eval, for, this
*/

/*property
    JSON, apply, call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== "object") {
  JSON = {};
}

(function () {
  "use strict";

  var rx_one = /^[\],:{}\s]*$/;
  var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
  var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
  var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  function f(n) {
    // Format integers to have at least two digits.
    return (n < 10)
      ? "0" + n
      : n;
  }

  function this_value() {
    return this.valueOf();
  }

  if (typeof Date.prototype.toJSON !== "function") {

    Date.prototype.toJSON = function () {

      return isFinite(this.valueOf())
        ? (
          this.getUTCFullYear()
          + "-"
          + f(this.getUTCMonth() + 1)
          + "-"
          + f(this.getUTCDate())
          + "T"
          + f(this.getUTCHours())
          + ":"
          + f(this.getUTCMinutes())
          + ":"
          + f(this.getUTCSeconds())
          + "Z"
        )
        : null;
    };

    Boolean.prototype.toJSON = this_value;
    Number.prototype.toJSON = this_value;
    String.prototype.toJSON = this_value;
  }

  var gap;
  var indent;
  var meta;
  var rep;


  function quote(string) {

    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.

    rx_escapable.lastIndex = 0;
    return rx_escapable.test(string)
      ? "\"" + string.replace(rx_escapable, function (a) {
        var c = meta[a];
        return typeof c === "string"
          ? c
          : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
      }) + "\""
      : "\"" + string + "\"";
  }


  function str(key, holder) {

    // Produce a string from holder[key].

    var i;          // The loop counter.
    var k;          // The member key.
    var v;          // The member value.
    var length;
    var mind = gap;
    var partial;
    var value = holder[key];

    // If the value has a toJSON method, call it to obtain a replacement value.

    if (
      value
      && typeof value === "object"
      && typeof value.toJSON === "function"
    ) {
      value = value.toJSON(key);
    }

    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.

    if (typeof rep === "function") {
      value = rep.call(holder, key, value);
    }

    // What happens next depends on the value's type.

    switch (typeof value) {
      case "string":
        return quote(value);

      case "number":

        // JSON numbers must be finite. Encode non-finite numbers as null.

        return (isFinite(value))
          ? String(value)
          : "null";

      case "boolean":
      case "null":

        // If the value is a boolean or null, convert it to a string. Note:
        // typeof null does not produce "null". The case is included here in
        // the remote chance that this gets fixed someday.

        return String(value);

      // If the type is "object", we might be dealing with an object or an array or
      // null.

      case "object":

        // Due to a specification blunder in ECMAScript, typeof null is "object",
        // so watch out for that case.

        if (!value) {
          return "null";
        }

        // Make an array to hold the partial results of stringifying this object value.

        gap += indent;
        partial = [];

        // Is the value an array?

        if (Object.prototype.toString.apply(value) === "[object Array]") {

          // The value is an array. Stringify every element. Use null as a placeholder
          // for non-JSON values.

          length = value.length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || "null";
          }

          // Join all of the elements together, separated with commas, and wrap them in
          // brackets.

          v = partial.length === 0
            ? "[]"
            : gap
              ? (
                "[\n"
                + gap
                + partial.join(",\n" + gap)
                + "\n"
                + mind
                + "]"
              )
              : "[" + partial.join(",") + "]";
          gap = mind;
          return v;
        }

        // If the replacer is an array, use it to select the members to be stringified.

        if (rep && typeof rep === "object") {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === "string") {
              k = rep[i];
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (
                  (gap)
                    ? ": "
                    : ":"
                ) + v);
              }
            }
          }
        } else {

          // Otherwise, iterate through all of the keys in the object.

          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (
                  (gap)
                    ? ": "
                    : ":"
                ) + v);
              }
            }
          }
        }

        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0
          ? "{}"
          : gap
            ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
            : "{" + partial.join(",") + "}";
        gap = mind;
        return v;
    }
  }

  // If the JSON object does not yet have a stringify method, give it one.

  if (typeof JSON.stringify !== "function") {
    meta = {    // table of character substitutions
      "\b": "\\b",
      "\t": "\\t",
      "\n": "\\n",
      "\f": "\\f",
      "\r": "\\r",
      "\"": "\\\"",
      "\\": "\\\\"
    };
    JSON.stringify = function (value, replacer, space) {

      // The stringify method takes a value and an optional replacer, and an optional
      // space parameter, and returns a JSON text. The replacer can be a function
      // that can replace values, or an array of strings that will select the keys.
      // A default replacer method can be provided. Use of the space parameter can
      // produce text that is more easily readable.

      var i;
      gap = "";
      indent = "";

      // If the space parameter is a number, make an indent string containing that
      // many spaces.

      if (typeof space === "number") {
        for (i = 0; i < space; i += 1) {
          indent += " ";
        }

        // If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === "string") {
        indent = space;
      }

      // If there is a replacer, it must be a function or an array.
      // Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== "function" && (
        typeof replacer !== "object"
        || typeof replacer.length !== "number"
      )) {
        throw new Error("JSON.stringify");
      }

      // Make a fake root object containing our value under the key of "".
      // Return the result of stringifying the value.

      return str("", { "": value });
    };
  }


  // If the JSON object does not yet have a parse method, give it one.

  if (typeof JSON.parse !== "function") {
    JSON.parse = function (text, reviver) {

      // The parse method takes a text and an optional reviver function, and returns
      // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key) {

        // The walk method is used to recursively walk the resulting structure so
        // that modifications can be made.

        var k;
        var v;
        var value = holder[key];
        if (value && typeof value === "object") {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = walk(value, k);
              if (v !== undefined) {
                value[k] = v;
              } else {
                delete value[k];
              }
            }
          }
        }
        return reviver.call(holder, key, value);
      }


      // Parsing happens in four stages. In the first stage, we replace certain
      // Unicode characters with escape sequences. JavaScript handles many characters
      // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      rx_dangerous.lastIndex = 0;
      if (rx_dangerous.test(text)) {
        text = text.replace(rx_dangerous, function (a) {
          return (
            "\\u"
            + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
          );
        });
      }

      // In the second stage, we run the text against regular expressions that look
      // for non-JSON patterns. We are especially concerned with "()" and "new"
      // because they can cause invocation, and "=" because it can cause mutation.
      // But just to be safe, we want to reject all unexpected forms.

      // We split the second stage into 4 regexp operations in order to work around
      // crippling inefficiencies in IE's and Safari's regexp engines. First we
      // replace the JSON backslash pairs with "@" (a non-JSON character). Second, we
      // replace all simple value tokens with "]" characters. Third, we delete all
      // open brackets that follow a colon or comma or that begin the text. Finally,
      // we look to see that the remaining characters are only whitespace or "]" or
      // "," or ":" or "{" or "}". If that is so, then the text is safe for eval.

      if (
        rx_one.test(
          text
            .replace(rx_two, "@")
            .replace(rx_three, "]")
            .replace(rx_four, "")
        )
      ) {

        // In the third stage we use the eval function to compile the text into a
        // JavaScript structure. The "{" operator is subject to a syntactic ambiguity
        // in JavaScript: it can begin a block or an object literal. We wrap the text
        // in parens to eliminate the ambiguity.

        j = eval("(" + text + ")");

        // In the optional fourth stage, we recursively walk the new structure, passing
        // each name/value pair to a reviver function for possible transformation.

        return (typeof reviver === "function")
          ? walk({ "": j }, "")
          : j;
      }

      // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError("JSON.parse");
    };
  }
}());

function main(thisObj) {
  var dataPath = Folder.decode(Folder.userData) + '/Aescripts/AL_CollageFont';
  var f = new Folder(dataPath);
  if (!f.exists) f.create();

  function fileExist(filename) {
    var file = new File(dataPath + "/" + filename + ".txt");
    return file.exists
  }

  function writeFile(object, filename) {
    var myFile = new File(dataPath + "/" + filename + ".txt");
    myFile.open("w");
    myFile.encoding = "UTF-8";
    myFile.write(JSON.stringify(object));
    myFile.close();
  }

  function readFile(filename) {
    var file = new File(dataPath + "/" + filename + ".txt");
    file.open('r');
    file.encoding = 'UTF-8';
    return JSON.parse(file.readln());
  }

  var CTScriptsRaw = [
    CTScript.CT_ROMAN_SCRIPT,
    CTScript.CT_JAPANESE_SCRIPT,
    CTScript.CT_TRADITIONALCHINESE_SCRIPT,
    CTScript.CT_KOREAN_SCRIPT,
    CTScript.CT_ARABIC_SCRIPT,
    CTScript.CT_HEBREW_SCRIPT,
    CTScript.CT_GREEK_SCRIPT,
    CTScript.CT_CYRILLIC_SCRIPT,
    CTScript.CT_RIGHTLEFT_SCRIPT,
    CTScript.CT_DEVANAGARI_SCRIPT,
    CTScript.CT_GURMUKHI_SCRIPT,
    CTScript.CT_GUJARATI_SCRIPT,
    CTScript.CT_ORIYA_SCRIPT,
    CTScript.CT_BENGALI_SCRIPT,
    CTScript.CT_TAMIL_SCRIPT,
    CTScript.CT_TELUGU_SCRIPT,
    CTScript.CT_KANNADA_SCRIPT,
    CTScript.CT_MALAYALAM_SCRIPT,
    CTScript.CT_SINHALESE_SCRIPT,
    CTScript.CT_BURMESE_SCRIPT,
    CTScript.CT_KHMER_SCRIPT,
    CTScript.CT_THAI_SCRIPT,
    CTScript.CT_LAOTIAN_SCRIPT,
    CTScript.CT_GEORGIAN_SCRIPT,
    CTScript.CT_ARMENIAN_SCRIPT,
    CTScript.CT_SIMPLIFIEDCHINESE_SCRIPT,
    CTScript.CT_TIBETAN_SCRIPT,
    CTScript.CT_MONGOLIAN_SCRIPT,
    CTScript.CT_GEEZ_SCRIPT,
    CTScript.CT_EASTEUROPEANROMAN_SCRIPT,
    CTScript.CT_VIETNAMESE_SCRIPT,
    CTScript.CT_EXTENDEDARABIC_SCRIPT,
    CTScript.CT_KLINGON_SCRIPT,
    CTScript.CT_EMOJI_SCRIPT,
    CTScript.CT_ROHINGYA_SCRIPT,
    CTScript.CT_JAVANESE_SCRIPT,
    CTScript.CT_SUNDANESE_SCRIPT,
    CTScript.CT_LONTARA_SCRIPT,
    CTScript.CT_SYRIAC_SCRIPT,
    CTScript.CT_TAITHAM_SCRIPT,
    CTScript.CT_BUGINESE_SCRIPT,
    CTScript.CT_BALINESE_SCRIPT,
    CTScript.CT_CHEROKEE_SCRIPT,
    CTScript.CT_MANDAIC_SCRIPT,
    CTScript.CT_VAI_SCRIPT,
    CTScript.CT_THAANA_SCRIPT,
    CTScript.CT_BRAVANESE_SCRIPT,
    CTScript.CT_BRAHMI_SCRIPT,
    CTScript.CT_CARIAN_SCRIPT,
    CTScript.CT_CYPRIOT_SCRIPT,
    CTScript.CT_EGYPTIAN_SCRIPT,
    CTScript.CT_IMPERIALARAMAIC_SCRIPT,
    CTScript.CT_PAHLAVI_SCRIPT,
    CTScript.CT_PARTHIAN_SCRIPT,
    CTScript.CT_KHAROSHTHI_SCRIPT,
    CTScript.CT_LYCIAN_SCRIPT,
    CTScript.CT_LYDIAN_SCRIPT,
    CTScript.CT_PHOENICIAN_SCRIPT,
    CTScript.CT_PERSIAN_SCRIPT,
    CTScript.CT_SHAVIAN_SCRIPT,
    CTScript.CT_SUMAKKCUNEIFORM_SCRIPT,
    CTScript.CT_UGARITIC_SCRIPT,
    CTScript.CT_GLAGOLITIC_SCRIPT,
    CTScript.CT_GOTHIC_SCRIPT,
    CTScript.CT_OGHAM_SCRIPT,
    CTScript.CT_OLDITALIC_SCRIPT,
    CTScript.CT_ORKHON_SCRIPT,
    CTScript.CT_RUNIC_SCRIPT,
    CTScript.CT_MEROITICCURSIVE_SCRIPT,
    CTScript.CT_COPTIC_SCRIPT,
    CTScript.CT_OLCHIKI_SCRIPT,
    CTScript.CT_SORASOMPENG_SCRIPT,
    CTScript.CT_OLDHANGUL_SCRIPT,
    CTScript.CT_LISU_SCRIPT,
    CTScript.CT_NKO_SCRIPT,
    CTScript.CT_ADLAM_SCRIPT,
    CTScript.CT_BAMUM_SCRIPT,
    CTScript.CT_BASSAVAH_SCRIPT,
    CTScript.CT_NEWA_SCRIPT,
    CTScript.CT_NEWTAILU_SCRIPT,
    CTScript.CT_SCRIPT,
    CTScript.CT_OSAGE_SCRIPT,
    CTScript.CT_UCAS_SCRIPT,
    CTScript.CT_TIFINAGH_SCRIPT,
    CTScript.CT_KAYAHLI_SCRIPT,
    CTScript.CT_LAO_SCRIPT,
    CTScript.CT_TAILE_SCRIPT,
    CTScript.CT_TAIVIET_SCRIPT,
    CTScript.CT_DONTKNOW_SCRIPT,
  ]

  var CTScripts = ['ROMAN', 'JAPANESE', 'TRADITIONALCHINESE', 'KOREAN', 'ARABIC', 'HEBREW', 'GREEK', 'CYRILLIC', 'RIGH',
    'DEVANAGARI',
    'GURMUKHI',
    'GUJARATI',
    'ORIYA',
    'BENGALI',
    'TAMIL',
    'TELUGU',
    'KANNADA',
    'MALAYALAM',
    'SINHALESE',
    'BURMESE',
    'KHMER',
    'THAI',
    'LAOTIAN',
    'GEORGIAN',
    'ARMENIAN',
    'SIMPLIFIEDCHINESE',
    'TIBETAN',
    'MONGOLIAN',
    'GEEZ',
    'EASTEUROPEANROMAN',
    'VIETNAMESE',
    'EXTENDEDARABIC',
    'KLINGON',
    'EMOJI',
    'ROHINGYA',
    'JAVANESE',
    'SUNDANESE',
    'LONTARA',
    'SYRIAC',
    'TAITHAM',
    'BUGINESE',
    'BALINESE',
    'CHEROKEE',
    'MANDAIC',
    'VAI',
    'THAANA',
    'BRAVANESE',
    'BRAHMI',
    'CARIAN',
    'CYPRIOT',
    'EGYPTIAN',
    'IMPERIALARAMAIC',
    'PAHLAVI',
    'PARTHIAN',
    'KHAROSHTHI',
    'LYCIAN',
    'LYDIAN',
    'PHOENICIAN',
    'PERSIAN',
    'SHAVIAN',
    'SUMAKKCUNEIFORM',
    'UGARITIC',
    'GLAGOLITIC',
    'GOTHIC',
    'OGHAM',
    'OLDITALIC',
    'ORKHON',
    'RUNIC',
    'MEROITICCURSIVE',
    'COPTIC',
    'OLCHIKI',
    'SORASOMPENG',
    'OLDHANGUL',
    'LISU',
    'NKO',
    'ADLAM',
    'BAMUM',
    'BASSAVAH',
    'NEWA',
    'NEWTAILU',
    'SCRIPT',
    'OSAGE',
    'UCAS',
    'TIFINAGH',
    'KAYAHLI',
    'LAO',
    'TAILE',
    'TAIVIET',
    'DONTKNOW'
  ]

  var settings = {};
  function makeSettings() {
    for (var i = 0; i < CTScripts.length; i++) {
      settings[CTScripts[i]] = false
    }
    settings['ROMAN'] = true
    writeFile(settings, 'settings');
  }
  if (!fileExist('settings')) {
    makeSettings()
  } else {
    try {
      settings = readFile('settings');
    } catch (e) {
      makeSettings()
    }
  }

  var mainWin = (thisObj instanceof Panel) ? thisObj : new Window("palette", scriptname, undefined, { resizeable: true });

  var group = mainWin.add('group')
  group.orientation = 'row'

  group.add('statictext', undefined, 'frame num')
  var frameNum = group.add('edittext');
  frameNum.preferredSize.width = 36;

  function makeFrameNum() {
    frameNum.text = '2'
    writeFile(frameNum.text, 'frameNum')
  }
  if (!fileExist('frameNum')) {
    makeFrameNum()
  } else {
    try {
      frameNum.text = readFile('frameNum')
    } catch (e) {
      makeFrameNum()
    }
  }

  frameNum.onChanging = function () {
    var reg = new RegExp(/^[0-9]+$/);
    var res = reg.test(frameNum.text);
    if (!res) frameNum.text = ''
    writeFile(frameNum.text, 'frameNum')
  }

  var settingIconBinary = "\u0089PNG\r\n\x1A\n\x00\x00\x00\rIHDR\x00\x00\x00\x12\x00\x00\x00\x12\b\x06\x00\x00\x00V\u00CE\u008EW\x00\x00\x00\u0080IDAT8\u008D\u00BD\u0094]\x0E\u0080 \f\u0083\u0099\u00F1\u00C6;\x07g\u0086\u00A7\x12\u00FE\u00CAj4~O\b\u00A5+\u008C\u0098R\u0080\u00BB\x17w/\u0091\u00EE\u008A\x04*\u00CDH\u00AD\u00CC\u00F4K\u00A2~Q\x19\x03c&\n9\u00E7\u00B6\u00DF\u00E6\u00C5\u00D9\fb6\x0Fn\u00A5\u00DA\u00C9\x10\fw\u00F4\u00F4\u00B2\u00FBo\u00DBm\u009E\u00D3D&K\u00A27\u00D0\u00AE\u00B1TL3$\u008A\u008Et\u00D2\u00D2\u00AE\u00A1r\u00D4-\u00F0\u00FD\u0083\u00DC\u009D]y\u009C\u0098[\u00BA\u00D6WQ\u00C62\u00BF\u00FF\u008F*\u00D6Ba7\u0089\b\u00D7\u00B9\x00\x00\x00\x00IEND\u00AEB`\u0082";

  var btnGroup = mainWin.add('group')

  var exeBtn = btnGroup.add('button', undefined, 'execute');
  var settingBtn = btnGroup.add('iconbutton', [0, 0, 27, 27], settingIconBinary);

  mainWin.onResize = function () {
    mainWin.layout.resize();
  }

  mainWin.layout.layout();

  exeBtn.onClick = function () {
    try {
      var comp = app.project.activeItem;
      var selectedLayers = comp.selectedLayers;
      if (parseInt(frameNum.text) == 0) return
      app.beginUndoGroup("collage font");
      var allFonts = app.fonts.allFonts
      for (var i = 0; i < selectedLayers.length; i++) {
        var selectedLayer = selectedLayers[i]
        if (selectedLayer.matchName == 'ADBE Text Layer') {
          var stopper = 0
          for (var j = 0; j < (selectedLayer.outPoint - selectedLayer.inPoint) / comp.frameDuration; j = j + parseInt(frameNum.text)) {
            var time = selectedLayer.inPoint + j * comp.frameDuration
            var sourceText = selectedLayer.text.sourceText
            var textDocument = sourceText.value
            var tmpFontGroup = allFonts[Math.floor(generateRandomNumber() * allFonts.length)]
            var tmpFont = tmpFontGroup[Math.floor(generateRandomNumber() * tmpFontGroup.length)]
            var continueFlag = false
            for (var k = 0; k < tmpFont.writingScripts.length; k++) {
              for (var l = 0; l < CTScripts.length; l++) {
                if (settings[CTScripts[l]] && tmpFont.writingScripts[k] == CTScriptsRaw[l]) {
                  continueFlag = true
                  continue
                }
              }
            }
            if (!continueFlag) {
              if (stopper > 10000) {
                alert('stopper!!!!')
                return
              }
              j = j - parseInt(frameNum.text)
              stopper++
            } else {
              textDocument.font = tmpFont.postScriptName
              sourceText.setValueAtTime(time, textDocument)
            }
          }
        }
      }
      app.endUndoGroup();
    } catch (e) {
      alert(e.message + e.line)
    }
  }

  var settingOpened = false;
  settingBtn.onClick = function () {
    try {
      if (!settingOpened) {
        settings = readFile('settings');

        var wnd = new Window("palette");
        wnd.text = "Settings";
        wnd.orientation = "row";
        wnd.alignChildren = ["left", "top"];
        wnd.spacing = 30;
        wnd.margins = 16;

        var ctscriptsBtns = []
        var groups = []
        var step = 20

        for (var i = 0; i < CTScripts.length; i = i + step) {
          var tmpGroup = wnd.add('group')
          tmpGroup.orientation = 'column'
          tmpGroup.alignChildren = ["left", "center"];
          groups.push(tmpGroup)
        }

        for (var i = 0; i < CTScripts.length; i++) {
          var tmpBtn = groups[Math.floor(i / step)].add('radiobutton', undefined, CTScripts[i])
          tmpBtn.value = settings[CTScripts[i]]
          tmpBtn.onClick = toggleRadioButtons
          ctscriptsBtns.push(tmpBtn)
        }

        function toggleRadioButtons() {
          for (var i = 0; i < ctscriptsBtns.length; i++) {
            if (ctscriptsBtns[i] !== this) {
              ctscriptsBtns[i].value = false;
            }
          }
          this.value = true;
        }

        blank = wnd.add('statictext', undefined, undefined)

        mainWin.enabled = false
        blank.onDraw = function () { }

        wnd.onClose = function () {
          for (var i = 0; i < CTScripts.length; i++) {
            settings[CTScripts[i]] = ctscriptsBtns[i].value
          }

          settingOpened = false;
          mainWin.enabled = true
          writeFile(settings, 'settings');
        }
        wnd.layout.layout();
        wnd.center();
        wnd.show();

        settingOpened = true;
      }
    } catch (e) {
      alert(e.message + e.line)
    }
  }
}
main(this);
