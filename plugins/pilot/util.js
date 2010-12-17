/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Skywriter Team (skywriter@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {

throw new Error("pilot/util is deprecated. If you need one of the functions from this\
module please copy the code to the appropriate placein pilot/(lang|dom|event)");

/**
 * Create an object representing a de-serialized query section of a URL.
 * Query keys with multiple values are returned in an array.
 * <p>Example: The input "foo=bar&foo=baz&thinger=%20spaces%20=blah&zonk=blarg&"
 * Produces the output object:
 * <pre>{
 *   foo: [ "bar", "baz" ],
 *   thinger: " spaces =blah",
 *   zonk: "blarg"
 * }
 * </pre>
 * <p>Note that spaces and other urlencoded entities are correctly handled
 * @see dojo.queryToObject()
 * While dojo.queryToObject() is mainly for URL query strings, this version
 * allows to specify a separator character
 */
exports.queryToObject = function(str, seperator) {
    var ret = {};
    var qp = str.split(seperator || "&");
    var dec = decodeURIComponent;
    qp.forEach(function(item) {
        if (item.length) {
            var parts = item.split("=");
            var name = dec(parts.shift());
            var val = dec(parts.join("="));
            if (exports.isString(ret[name])){
                ret[name] = [ret[name]];
            }
            if (Array.isArray(ret[name])){
                ret[name].push(val);
            } else {
                ret[name] = val;
            }
        }
    });
    return ret;
};

/**
 * Takes a name/value mapping object and returns a string representing a
 * URL-encoded version of that object for use in a GET request
 * <p>For example, given the input:
 * <code>{ blah: "blah", multi: [ "thud", "thonk" ] }</code>
 * The following string would be returned:
 * <code>"blah=blah&multi=thud&multi=thonk"</code>
 * @param map {Object} The object to convert
 * @return {string} A URL-encoded version of the input
 */
exports.objectToQuery = function(map) {
    // FIXME: need to implement encodeAscii!!
    var enc = encodeURIComponent;
    var pairs = [];
    var backstop = {};
    for (var name in map) {
        var value = map[name];
        if (value != backstop[name]) {
            var assign = enc(name) + "=";
            if (value.isArray) {
                for (var i = 0; i < value.length; i++) {
                    pairs.push(assign + enc(value[i]));
                }
            } else {
                pairs.push(assign + enc(value));
            }
        }
    }
    return pairs.join("&");
};

/**
 * Holds the count to keep a unique value for setTimeout
 * @private See rateLimit()
 */
var nextRateLimitId = 0;

/**
 * Holds the timeouts so they can be cleared later
 * @private See rateLimit()
 */
var rateLimitTimeouts = {};

/**
 * Delay calling some function to check that it's not called again inside a
 * maxRate. The real function is called after maxRate ms unless the return
 * value of this function is called before, in which case the clock is restarted
 */
exports.rateLimit = function(maxRate, scope, func) {
    if (maxRate) {
        var rateLimitId = nextRateLimitId++;

        return function() {
            if (rateLimitTimeouts[rateLimitId]) {
                clearTimeout(rateLimitTimeouts[rateLimitId]);
            }

            rateLimitTimeouts[rateLimitId] = setTimeout(function() {
                func.apply(scope, arguments);
                delete rateLimitTimeouts[rateLimitId];
            }, maxRate);
        };
    }
};

/**
 * A la Prototype endsWith(). Takes a regex excluding the '$' end marker
 */
exports.endsWith = function(str, end) {
    if (!str) {
        return false;
    }
    return str.match(new RegExp(end + "$"));
};

/**
 * A la Prototype include().
 */
exports.include = function(array, item) {
    return array.indexOf(item) > -1;
};

/**
 * Like include, but useful when you're checking for a specific
 * property on each object in the list...
 *
 * Returns null if the item is not in the list, otherwise
 * returns the index of the item.
 */
exports.indexOfProperty = function(array, propertyName, item) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][propertyName] == item) {
            return i;
        }
    }
    return null;
};

/**
 * A la Prototype last().
 */
exports.last = function(array) {

return array[array.length - 1];
};

/**
 * Knock off any undefined items from the end of an array
 */
exports.shrinkArray = function(array) {
    var newArray = [];

    var stillAtBeginning = true;
    array.reverse().forEach(function(item) {
        if (stillAtBeginning && item === undefined) {
            return;
        }

        stillAtBeginning = false;

        newArray.push(item);
    });

    return newArray.reverse();
};

/**
 * Create an array
 * @param number The size of the new array to create
 * @param character The item to put in the array, defaults to ' '
 */
exports.makeArray = function(number, character) {
    if (number < 1) {
        return []; // give us a normal number please!
    }
    if (!character){character = ' ';}

    var newArray = [];
    for (var i = 0; i < number; i++) {
        newArray.push(character);
    }
    return newArray;
};

/**
 * Given a row, find the number of leading spaces.
 * E.g. an array with the string "  aposjd" would return 2
 * @param row The row to hunt through
 */
exports.leadingSpaces = function(row) {
    var numspaces = 0;
    for (var i = 0; i < row.length; i++) {
        if (row[i] == ' ' || row[i] == '' || row[i] === undefined) {
            numspaces++;
        } else {
            return numspaces;
        }
    }
    return numspaces;
};

/**
 * Given a row, find the number of leading tabs.
 * E.g. an array with the string "		aposjd" would return 2
 * @param row The row to hunt through
 */
exports.leadingTabs = function(row) {
    var numtabs = 0;
    for (var i = 0; i < row.length; i++) {
        if (row[i] == '	' || row[i] == '' || row[i] === undefined) {
            numtabs++;
        } else {
            return numtabs;
        }
    }
    return numtabs;
};

/**
 * Given a row, extract a copy of the leading spaces or tabs.
 * E.g. an array with the string "	    	aposjd" would return an array with the
 * string "	    	".
 * @param row The row to hunt through
 */
exports.leadingWhitespace = function(row) {
    var leading = [];
    for (var i = 0; i < row.length; i++) {
        if (row[i] == ' ' || row[i] == '	' || row[i] == '' || row[i] === undefined) {
            leading.push(row[i]);
        } else {
            return leading;
        }
    }
    return leading;
};

/**
 * Given a camelCaseWord convert to "Camel Case Word"
 */
exports.englishFromCamel = function(camel) {
    camel.replace(/([A-Z])/g, function(str) {
        return " " + str.toLowerCase();
    }).trim();
};


/** Returns true if the DOM element "b" is inside the element "a". */
if (typeof(document) !== 'undefined' && document.compareDocumentPosition) {
    exports.contains = function(a, b) {
        return a.compareDocumentPosition(b) & 16;
    };
} else {
    exports.contains = function(a, b) {
        return a !== b && (a.contains ? a.contains(b) : true);
    };
}

/**
 * Create a random password of the given length (default 16 chars)
 */
exports.randomPassword = function(length) {
    length = length || 16;
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    var pass = "";
    for (var x = 0; x < length; x++) {
        var charIndex = Math.floor(Math.random() * chars.length);
        pass += chars.charAt(charIndex);
    }
    return pass;
};

/**
 * Is the passed object free of members, i.e. are there any enumerable
 * properties which the objects claims as it's own using hasOwnProperty()
 */
exports.isEmpty = function(object) {
    for (var x in object) {
        if (object.hasOwnProperty(x)) {
            return false;
        }
    }
    return true;
};

/**
 * Does the name of a project indicate that it is owned by someone else
 * TODO: This is a major hack. We really should have a File object that include
 * separate owner information.
 */
exports.isMyProject = function(project) {
    return project.indexOf("+") == -1;
};

/**
 * Format a date as dd MMM yyyy
 */
exports.formatDate = function (date) {
    if (!date) {
        return "Unknown";
    }
    return date.getDate() + " " +
        exports.formatDate.shortMonths[date.getMonth()] + " " +
        date.getFullYear();
};

/**
 * Month data for exports.formatDate
 */
exports.formatDate.shortMonths = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

/**
 * Is the passed object either null or undefined (using ===)
 */
exports.none = function(obj) {
    return obj === null || obj === undefined;
};

/**
 * Creates a clone of the passed object.  This function can take just about
 * any type of object and create a clone of it, including primitive values
 * (which are not actually cloned because they are immutable).
 * If the passed object implements the clone() method, then this function
 * will simply call that method and return the result.
 *
 * @param object {Object} the object to clone
 * @param deep {Boolean} do a deep clone?
 * @returns {Object} the cloned object
 */
exports.clone = function(object, deep) {
    if (Array.isArray(object) && !deep) {
        return object.slice();
    }

    if (typeof object === 'object' || Array.isArray(object)) {
        if (object === null) {
            return null;
        }

        var reply = (Array.isArray(object) ? [] : {});
        for (var key in object) {
            if (deep && (typeof object[key] === 'object'
                            || Array.isArray(object[key]))) {
                reply[key] = exports.clone(object[key], true);
            } else {
                 reply[key] = object[key];
            }
        }
        return reply;
    }

    if (object && typeof(object.clone) === 'function') {
        return object.clone();
    }

    // That leaves numbers, booleans, undefined. Doesn't it?
    return object;
};

/**
 * Basically taken from Sproutcore.
 * Replaces the count items from idx with objects.
 */
exports.replace = function(arr, idx, amt, objects) {
    return arr.slice(0, idx).concat(objects).concat(arr.slice(idx + amt));
};

/**
 * Return true if the two frames match.  You can also pass only points or sizes.
 * @param r1 {Rect} the first rect
 * @param r2 {Rect} the second rect
 * @param delta {Float} an optional delta that allows for rects that do not match exactly. Defaults to 0.1
 * @returns {Boolean} true if rects match
 */
exports.rectsEqual = function(r1, r2, delta) {
    if (!r1 || !r2) {
        return r1 == r2;
    }

    if (!delta && delta !== 0) {
        delta = 0.1;
    }

    if ((r1.y != r2.y) && (Math.abs(r1.y - r2.y) > delta)) {
        return false;
    }

    if ((r1.x != r2.x) && (Math.abs(r1.x - r2.x) > delta)) {
        return false;
    }

    if ((r1.width != r2.width) && (Math.abs(r1.width - r2.width) > delta)) {
        return false;
    }

    if ((r1.height != r2.height) && (Math.abs(r1.height - r2.height) > delta)) {
        return false;
    }

    return true;
};

});