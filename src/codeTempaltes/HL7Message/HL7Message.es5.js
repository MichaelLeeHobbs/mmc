// noinspection ES6ConvertVarToLetConst

// If we are in a Node.js environment, require the Encoding module
if (typeof require !== 'undefined') {
    var Encoding = require('./Encoding.es5')
}

/**
 * Create an empty HL7Message or optionally one based on the encoded HL7 string.
 * @param {XML|string} [hl7] - The HL7 message
 * @param {[*]} [rules=[]] - An array of rules to apply to the HL7 message
 * @constructor
 */
function HL7Message(hl7, rules) {
    Object.defineProperty(this, 'raw', {get: () => hl7, configurable: true})
    Object.defineProperty(this, 'encoding', {get: () => this._encoding, configurable: false, enumerable: true})
    Object.defineProperty(this, 'segments', {get: () => this._segments, configurable: false, enumerable: true})
    Object.defineProperty(this, 'rules', {get: () => this._rules, configurable: false, enumerable: true})
    Object.defineProperty(this, 'isValid', {
        get: function () {
            this.validate();
            return this._validationIssues.length === 0;
        },
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(this, 'validationIssues', {
        get: () => this._validationIssues,
        configurable: false,
        enumerable: true
    });
    Object.defineProperty(this, 'logs', {
        get: () => this._logs,
        configurable: false,
        enumerable: true
    });

    this._segments = []
    this._encoding = new Encoding()
    this._rules = rules || [];
    this._validationIssues = []
    this._logs = []

    if (hl7) {
        this.parse(hl7)
    } else {
        this.parse('MSH|^~\\&')
    }
}

/**
 * Converts known Java objects (String, Number types, byte[]) and ensures JS primitives are returned.
 * Passes through other types.
 * @param {*} val - The value to potentially convert.
 * @return {*} - The JavaScript primitive or the original value.
 */
HL7Message.toJsPrimitive = function (val) {
    if (val === null || val === undefined) {
        return val;
    }

    const valType = typeof val;

    // 1. Handle explicit convert to JavaScript primitives
    if (valType === 'string' || valType === 'number' || valType === 'boolean') {
        return val; // Already a JS primitive
    }

    // 2. Handle Java Objects that have getClass()
    if (valType === 'object' && typeof val.getClass === 'function') {
        const className = val.getClass().getName();
        switch (className) {
            case 'java.lang.String':
                return String(val);
            case 'java.lang.Integer':
            case 'java.lang.Long':
            case 'java.lang.Short':
            case 'java.lang.Byte':
                return parseInt(String(val), 10);
            case 'java.lang.Double':
            case 'java.lang.Float':
                return parseFloat(String(val));
            case 'java.lang.Boolean':
                return Boolean(val);
            case 'java.lang.Character':
                return String(val);
            default:
                break;
        }
    }
    if (val instanceof java.lang.Object) {
        return val.toString(); // Fallback for other Java objects
    }

    // 3. Handle Plain JavaScript Objects (recursive conversion for properties)
    if (valType === 'object' && !Array.isArray(val) && Object.getPrototypeOf(val) === Object.prototype) {
        const result = {};
        Object.keys(val).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(val, key)) {
                // Pass down the charset for potential nested byte arrays
                result[key] = HL7Message.toJsPrimitive(val[key]);
            }
        });
        return result;
    }

    // 4. Handle JavaScript Arrays (recursive conversion for elements)
    if (Array.isArray(val)) {
        // Pass down the charset for potential nested byte arrays
        return val.map(item => HL7Message.toJsPrimitive(item));
    }

    try {
        return val.toString(); // Fallback for other types, convert to string
    } catch (_e) {
        return String(val); // If toString fails, convert to string
    }
};

/**
 * HL7 Parser
 * @param {string|XML} [hl7]
 * @param {Encoding} [encoding]
 * @return {[]}
 */
HL7Message.parser = function (hl7, encoding) {
    // Check for Mirth XML object and convert to string if necessary
    if (typeof XML !== 'undefined') {
        if (hl7 instanceof XML) {
            hl7 = String(SerializerFactory.getSerializer('HL7V2').fromXML(hl7))
        }
    }

    if (hl7 instanceof HL7Message) {
        hl7 = hl7.toString()
    }

    // Validate the input message
    HL7Message.assert(typeof hl7 === 'string', 'Invalid Message! Message must be XML or string!')
    HL7Message.assert(hl7.indexOf('MSH') === 0, 'Invalid Message! Message must start with "MSH"')

    // Initialize encoding if not provided
    encoding = encoding || new Encoding(({hl7: hl7}))

    // Helper function to reduce array elements into an object with 1-based index keys
    const reducer = (acc, val, i) => {
        acc[i + 1] = val
        return acc
    }

    // Function to parse components within a field
    const parseComp = (comp, incEmpty) => {
        // Split the component into subcomponents using the subcomponent delimiter
        // Then reduce these subcomponents into an object with 1-based index keys
        return comp.split(encoding.subcomponent).reduce((acc, subcomponent, i) => {
            // For each subcomponent, accumulate it in an object with 1-based index keys
            return reducer(acc, subcomponent, i, incEmpty)
        }, {})
    }

    // Function to parse a field into its components
    const parseField = (field, incEmpty) => {
        // Split the field into components using the component delimiter
        // Then reduce these components into an object with 1-based index keys
        return field.split(encoding.component).reduce((acc, comp, i) => {
            // For each component, accumulate it in an object with 1-based index keys
            return reducer(acc, parseComp(comp, incEmpty), i)
        }, {})
    }

    // Function to parse fields within a segment
    const parseFields = (fields, name, mod) => {
        // `fields` is an array of field strings within a segment
        // `name` is the segment name (e.g., "PID", "OBR")
        // `mod` is a modifier used to adjust field indices (used for special handling of "MSH" segment)

        // Reduce the `fields` array into an object with 1-based index keys
        return fields.reduce((acc, fieldRep, fieldIndex, fieldArr) => {
            // Determine if this is the last field in the array
            const incEmpty = fieldArr.length - 1 === fieldIndex

            // Split the field repetition into individual fields using the field repetition delimiter
            // Then reduce these fields into an object with 1-based index keys
            const value = fieldRep.split(encoding.fieldRepetition).reduce((acc, field, i) => {
                return reducer(acc, parseField(field, incEmpty), i)
            }, {})

            // Only include the field in the accumulator if it has non-empty values
            if (Object.keys(value).length !== 0) {
                // Adjust the field index by adding 1 and the optional `mod` value
                acc[fieldIndex + 1 + (mod || 0)] = value
            }

            // Return the accumulated object for the next iteration
            return acc
        }, {0: name || ''})  // Initialize the accumulator with the segment name at index 0
    }

    // Function to parse a segment
    const parseSegment = (hl7) => {
        var fields, name

        // Check if the segment is "MSH" (Message Header)
        if (hl7.indexOf('MSH') === 0) {
            // Split the "MSH" segment into fields using the field delimiter
            fields = hl7.split(encoding.field)

            // Extract the segment name ("MSH")
            name = fields.shift()

            // Remove the encoding characters field (second field in the "MSH" segment)
            fields.shift()

            // Parse the remaining fields
            const _fields = parseFields(fields, name, 2)

            // Manually set the first and second fields with special handling for "MSH"
            // The first field (encoding characters) is directly set as the field delimiter
            _fields[1] = {1: {1: {1: encoding.field}}}

            // The second field contains the encoding characters concatenated together
            _fields[2] = {1: {1: {1: [encoding.component, encoding.fieldRepetition, encoding.escape, encoding.subcomponent].join('')}}}

            // Return the parsed fields object for the "MSH" segment
            return _fields
        }

        // For all other segments (non-"MSH")
        // Split the segment into fields using the field delimiter
        fields = hl7.split(encoding.field)

        // Extract the segment name (e.g., "PID", "OBR")
        name = fields.shift()

        // Parse the fields and return the resulting object
        return parseFields(fields, name)
    }

    // Split the HL7 message into segments and parse each segment
    return [hl7.split(encoding.segment).map((hl7) => parseSegment(hl7)), encoding]
}

/**
 * Throws an error if the predicate is falsy
 * @param {*} predicate - The condition to check
 * @param {string} msg - The error message
 * @return {boolean} - Returns true if the predicate is truthy
 */
HL7Message.assert = function (predicate, msg) {
    if (!predicate) {
        throw new Error(msg);
    }
}

/**
 * Check if a value is a plain object ie not an array/null/undefined/string/number or new Date() or new Map() or new Set()
 * @param {*} arg
 * @return {boolean}
 */
HL7Message.isPOJO = (arg) => arg != null && typeof arg === 'object' && Object.getPrototypeOf(arg) === Object.prototype;


/**
 * Converts an array to an Element
 * @param {[string|number]|*} arr
 * @param convertPrimitivesInElements
 * @return {*} - Returns an object with a 1 based index if the array is an array otherwise returns the original value
 */
HL7Message.arrayToElement = (arr, convertPrimitivesInElements) => {
    // First, ensure 'arr' itself is a JS type if it was a Java collection that needs conversion to JS array
    // This is a simplification. A true java.util.List would need explicit conversion to JS Array.
    // However, toJsPrimitive will handle if 'arr' is a single Java String/Number.
    const jsArrOrVal = convertPrimitivesInElements ? HL7Message.toJsPrimitive(arr) : arr;

    if (!Array.isArray(jsArrOrVal)) { // Check if it's a JS array
        return jsArrOrVal; // Return the (possibly converted) single element
    }
    // It is a JS array
    return jsArrOrVal.reduce((acc, ele, i) => {
        // Ensure each element within the array is also converted
        acc[i + 1] = convertPrimitivesInElements ? HL7Message.toJsPrimitive(ele) : ele;
        return acc;
    }, {});
};

/**
 * Checks if a value is a string or number
 * @param {*} value - The value to check
 * @return {boolean} - Returns true if the value is a string or number
 */
HL7Message.isStrNum = (value) => ['string', 'number'].indexOf(typeof value) > -1;

/**
 * Check in n is a positive integer
 * @param {*} n - The value to check
 * @return {boolean}
 */
HL7Message.isPositiveInteger = (n) => parseInt(n) > 0 && parseInt(n).toString() === n.toString()

/**
 * Try to execute a function and return a default value if it fails
 * @param {function} fn
 * @param {*} def
 * @return {*}
 * @private
 */
HL7Message._try = (fn, def) => {
    try {
        return fn()
    } catch (_e) {
        return def
    }
}

/**
 * Transforms a HL7 path string into an object.
 * @param {string} path
 * @param {boolean} [autoResolve=true]
 * @return {[seg: string, segIdx: number, field: string, fieldIdx: string, comp: string, sub: string, autoResolve: boolean]}
 * @private
 */
HL7Message.prototype._hl7KeyParser = function (path, autoResolve) {
    autoResolve = autoResolve == null ? true : autoResolve
    // HL7Message.assert(typeof path === 'string', 'Path must be a string!')
    HL7Message.assert(typeof path === 'string' && path.trim(), 'Path must be a non-empty string!')
    const regex = /([A-Z\d]{3})(?:\[(\d+)])?(?:\.(\d+))?(?:\[(\d+)])?(?:\.(\d+))?(?:\.(\d+))?/
    const matches = regex.exec(path)
    HL7Message.assert(matches, 'Invalid HL7 Path! Path: ' + path)
    let [, seg, segIdx, field, fieldIdx, comp, sub] = matches

    // Resolve segment index if it is missing but a field is present
    segIdx = (parseInt(field) > 0 && !segIdx) ? '1' : segIdx

    // Resolve field index if it is missing but a component is present
    fieldIdx = (parseInt(comp) > 0 && !fieldIdx) ? '1' : fieldIdx

    // Auto-resolve missing indices if autoResolve is true
    if (autoResolve) {
        segIdx = (seg) ? segIdx || '1' : segIdx
        fieldIdx = (seg && field) ? fieldIdx || '1' : fieldIdx
        comp = (seg && field && fieldIdx) ? comp || '1' : comp
        sub = (seg && field && comp) ? sub || '1' : sub
    }

    return [seg, parseInt(segIdx), field, fieldIdx, comp, sub, autoResolve]
}

/**
 * The get() method returns a specified element from a HL7Message object. If the value that is associated to the provided path is an object, and autoResolve
 * is false then you will get a reference to that object and any change made to that object will effectively modify it inside the HL7Message object.
 * @param {string} path
 * @param {boolean} [autoResolve=true]
 * @return {(string|object|undefined)}
 */
HL7Message.prototype.get = function (path, autoResolve) {
    return this._getRef(this._hl7KeyParser(path, autoResolve == null ? true : autoResolve), false)
}

/**
 * Returns an array of values based on the path, start, and stop. The path must have one % to mark the wild card value.
 * @example
 * // returns an array with the values MSH.3.1, MSH.4.1, MSH.5.1, and MSH.6.1
 * msg.getRange('MSH.%.1', 3, 6)
 * @param {string} path
 * @param {number} start
 * @param {number} stop
 * @param {boolean} [autoResolve=true]
 * @return {[string]}
 */
HL7Message.prototype.getRange = function (path, start, stop, autoResolve) {
    autoResolve = typeof autoResolve === 'boolean' ? autoResolve : true
    const out = []
    for (let i = start; i <= stop; i++) {
        let key = this._hl7KeyParser(path.replace('%', i.toString()), autoResolve)
        let [seg, segIdx, field, fieldIdx, comp, sub] = key
        out.push(this._getRef([seg, segIdx, field, fieldIdx, comp])[sub] || '')
    }
    return out
}

/**
 * Sets a value for the specified HL7 path. The value can contain text, number, an Object; that represents sub values, or an Array; where the array will be
 * treated as an Objects with the properties i, where is a number starting at 1 going to l the length of the array.
 * @param {string} path
 * @param {(string|number|Object|array)} value
 * @param {boolean} [autoResolve=false]
 */
HL7Message.prototype.set = function (path, value, autoResolve) {
    this._logs.push({msg: 'set', path: path, value: value, autoResolve: autoResolve})
    value = HL7Message.toJsPrimitive(value) // Convert Java objects to JS primitives if necessary
    this._logs.push({msg: 'set->value converted', path: path, value: value, autoResolve: autoResolve})
    try {
        autoResolve = typeof autoResolve === 'boolean' ? autoResolve : false
        value = value || ''
        if (typeof value === 'number') {
            value = value.toString()
        }
        // convert an array value to an object with 1 base index
        value = HL7Message.arrayToElement(value, true)

        const key = this._hl7KeyParser(path, autoResolve)
        const [seg, segIdx, field, fieldIdx, comp, sub] = key

        // what do they want? segment, field, component, subcomponent
        if (sub) {
            return this._setSubcomponent(seg, segIdx, field, fieldIdx, comp, sub, value)
        }
        if (comp) {
            return this._setComponent(seg, segIdx, field, fieldIdx, comp, value)
        }
        if (fieldIdx) {
            return this._setField(seg, segIdx, field, fieldIdx, value)
        }
        if (field) {
            return this._setFields(seg, segIdx, field, value)
        }
        if (seg) {
            return this._setSegment(seg, segIdx, value)
        }
    } catch (e) {
        var errVal
        try {
            errVal = JSON.stringify(value)
        } catch (_e) {
            errVal = value
        }
        e.message = 'Failed to set ' + path + ' to ' + errVal + ' - ' + e.message
        throw e
    }
}
/**
 * The delete() method removes the specified element from a HL7Message object by path.
 * @todo
 * @param path
 */
HL7Message.prototype.delete = function (path) {
    const key = this._hl7KeyParser(path)
    const [seg, segIdx, field, fieldIdx, comp, sub] = key

    let ref;
    if (sub) {
        ref = this._getRef([seg, segIdx, field, fieldIdx, comp], false)
        if (ref && ref[sub]) {
            delete ref[sub]
        }
    } else if (comp) {
        ref = this._getRef([seg, segIdx, field, fieldIdx], false)
        if (ref && ref[comp]) {
            delete ref[comp]
        }
    } else if (fieldIdx) {
        ref = this._getRef([seg, segIdx, field], false)
        if (ref && ref[fieldIdx]) {
            delete ref[fieldIdx]
        }
    } else if (field) {
        ref = this._getRef([seg, segIdx], false)
        if (ref && ref[field]) {
            delete ref[field]
        }
    } else if (seg) {
        const index = this._getSegmentIndex(seg, segIdx)
        if (index !== -1) {
            this._segments.splice(index, 1)
        }
    }
}

/**
 * The deleteAllSegments() method removes all instances of the specified element from a HL7Message object by path.
 * @param segmentName
 */
HL7Message.prototype.deleteAllSegments = function (segmentName) {
    this._segments = this._segments.filter(segment => segment[0] !== segmentName);
};

/**
 * Get a reference to an element
 * @private
 * @param {[string, number, string?, string?, string?, string?]} key - [seg: string, segIdx: number, field: string, fieldIdx: string, comp: string, sub: string]
 * @param {boolean} [autoCreate=true]
 * @return {*}
 */
HL7Message.prototype._getRef = function (key, autoCreate) {
    if (!key) {
        return;
    }
    autoCreate = typeof autoCreate === 'boolean' ? autoCreate : true;
    const [seg, segIdx, field, fieldIdx, comp, sub] = key;

    const segment = this._getOrCreateSegment(seg, segIdx, autoCreate);
    if (!segment || field == null) {
        return segment || '';
    }

    const fieldRef = this._getOrCreateField(segment, field, fieldIdx, autoCreate);
    if (!fieldRef || comp == null) {
        return fieldRef;
    }

    const compRef = this._getOrCreateComponent(fieldRef, comp, autoCreate);
    if (!compRef || sub == null) {
        return compRef;
    }

    return this._getOrCreateSubcomponent(compRef, sub, autoCreate);
};

HL7Message.prototype._getOrCreateSegment = function (seg, segIdx, autoCreate) {
    let segment = this.getSegment(seg, segIdx);
    if (!segment && autoCreate) {
        this._segments.push({'0': seg});
        segment = this.getSegment(seg, segIdx);
    }
    return segment;
};

HL7Message.prototype._getOrCreateField = function (segment, field, fieldIdx, autoCreate) {
    segment[field] = !segment[field] && autoCreate ? {} : segment[field];
    if (!segment[field] || fieldIdx == null) {
        return segment[field];
    }

    segment[field][fieldIdx] = !segment[field][fieldIdx] && autoCreate ? {} : segment[field][fieldIdx];
    return segment[field][fieldIdx];
};

HL7Message.prototype._getOrCreateComponent = function (fieldRef, comp, autoCreate) {
    fieldRef[comp] = !fieldRef[comp] && autoCreate ? {} : fieldRef[comp];
    return fieldRef[comp];
};

HL7Message.prototype._getOrCreateSubcomponent = function (compRef, sub, autoCreate) {
    compRef[sub] = !compRef[sub] && autoCreate ? '' : compRef[sub];
    return compRef[sub];
};

/**
 * Get a segments computed index
 * @param {string} seg
 * @param {number} segIdx
 * @return {number}
 * @private
 */
HL7Message.prototype._getSegmentIndex = function (seg, segIdx) {
    let count = 0
    return this.segments.findIndex((segment) => {
        if (segment[0] === seg) {
            count++
        }
        return count === segIdx
    })
}

/**
 * Returns a filtered array of segments by segment name.
 * @example
 * // returns all OBX segments
 * hl7message.getSegments('OBX')
 * @param {string} seg
 * @return {*[]}
 */
HL7Message.prototype.getSegments = function (seg) {
    HL7Message.assert(typeof seg === 'string', 'seg must be a string')
    return this.segments.filter(segment => segment[0] === seg)
}

/**
 * Returns a specific segment by seg and segIdx
 * @example
 * hl7message.getSegment('OBX', 3) // returns OBX[3]
 * @param {string} seg - The segment name, e.g., 'OBX'
 * @param {number} [segIdx = 1] - The segment index, defaults to 1
 * @return {*}
 */
HL7Message.prototype.getSegment = function (seg, segIdx) {
    segIdx = segIdx || 1
    HL7Message.assert(typeof seg === 'string', 'seg must be a string')
    HL7Message.assert(typeof segIdx === 'number', 'segIdx must be a number')
    const segmentIndex = this._getSegmentIndex(seg, segIdx)
    return this.segments[segmentIndex]
}

HL7Message.prototype._setSegment = function (seg, segIdx, value) {
    // Log the operation
    this._logs.push({msg: 'setSegment', seg: seg, segIdx: segIdx, value: value})
    segIdx = segIdx || 1
    value = value || ''
    value = HL7Message.arrayToElement(value, true)
    value = HL7Message.isStrNum(value) ? {1: value} : value
    Object.keys(value).forEach((field) => this._setFields(seg, segIdx, field, value[field]))
}

HL7Message.prototype._setFields = function (seg, segIdx, field, value) {
    // Log the operation
    this._logs.push({msg: 'setFields', seg: seg, segIdx: segIdx, field: field, value: value})
    segIdx = segIdx || 1
    value = value || ''
    value = HL7Message.arrayToElement(value, true)
    value = HL7Message.isStrNum(value) ? {1: value} : value
    Object.keys(value).forEach((key) => {
        var _value = value[key]
        if (HL7Message.isStrNum(_value)) {
            return this._setComponent(seg, segIdx, field, 1, key, _value)
        }
        this._setField(seg, segIdx, field, key, _value)
    })
}

HL7Message.prototype._setField = function (seg, segIdx, field, fieldIdx, value) {
    // Log the operation
    this._logs.push({msg: 'setField', seg: seg, segIdx: segIdx, field: field, fieldIdx: fieldIdx, value: value})
    segIdx = segIdx || 1
    fieldIdx = fieldIdx || 1
    value = value || ''
    value = HL7Message.arrayToElement(value, true)
    value = HL7Message.isStrNum(value) ? {1: value} : value
    Object.keys(value).forEach((comp) => this._setComponent(seg, segIdx, field, fieldIdx, comp, value[comp]))
}

HL7Message.prototype._setComponent = function (seg, segIdx, field, fieldIdx, comp, value) {
    // Log the operation
    this._logs.push({msg: 'setComponent', seg: seg, segIdx: segIdx, field: field, fieldIdx: fieldIdx, comp: comp, value: value})
    value = value || ''
    value = HL7Message.arrayToElement(value, true)
    value = HL7Message.isStrNum(value) ? {1: value} : value

    // check if every key of component is a string or number that is an integer > 0
    const isComponentValid = HL7Message.isPOJO(value) ? Object.keys(value).every((k) => HL7Message.isPositiveInteger(k)) : false
    if (!isComponentValid) {
        throw new Error(['Failed to set ', seg, '[', segIdx, '].', field, '[', fieldIdx, '].', comp, ' expected Component got ', JSON.stringify(value)].join(''))
    }
    Object.keys(value).forEach((sub) => this._setSubcomponent(seg, segIdx, field, fieldIdx, comp, sub, value[sub]))
}
/**
 *
 * @param {string} seg
 * @param {number} segIdx
 * @param {string} field
 * @param {string} fieldIdx
 * @param {string} comp
 * @param {string} sub
 * @param {(string|number)} value
 * @private
 */
HL7Message.prototype._setSubcomponent = function (seg, segIdx, field, fieldIdx, comp, sub, value) {
    // Log the operation
    this._logs.push({
        msg: 'setSubcomponent',
        seg: seg,
        segIdx: segIdx,
        field: field,
        fieldIdx: fieldIdx,
        comp: comp,
        sub: sub,
        value: value,
        valueType: typeof value
    })
    value = value || ''
    const assertMsg = 'value(' + value + ') expected string or number but got ' + typeof value + ' for subcomponent '
        + seg + '[' + segIdx + '].' + field + '[' + fieldIdx + '].' + comp + '.' + sub
    HL7Message.assert(HL7Message.isStrNum(value), assertMsg)
    // A subcomponent value should be primitive
    this._getRef([seg, segIdx, field, fieldIdx, comp], true)[sub] = value
}

/**
 * Converts an array to an HL7 path string.
 * @param {[seg: string, segIdx?: string | number, field?: string | number, fieldIdx?: string | number, comp?: string | number, sub?: string | number]} arr
 * @return {*|string}
 */
HL7Message.prototype.arrayToHl7Path = function (arr) {
    const [seg, segIdx, field, fieldIdx, comp, sub] = arr
    HL7Message.assert(seg, 'Array must have a segment')
    let path = seg
    if (segIdx) {
        path += '[' + segIdx + ']'
    }
    if (!field) {
        return path
    }
    path += '.' + field
    if (fieldIdx) {
        path += '[' + fieldIdx + ']'
    }
    if (!comp) {
        return path
    }
    path += '.' + comp
    if (!sub) {
        return path
    }
    return path + '.' + sub
}

/**
 * Searches for a value in a specific field within segments and returns the value from another field in the same segment.
 * Optionally applies an extractor regex to the return field value.
 * @param {string} searchPath - The path of the field to search in (e.g., 'OBX.5.1').
 * @param {RegExp} searchValue - The regular expression to match the search value.
 * @param {string} returnPath - The path of the field to return the value from (e.g., 'OBX.5.2').
 * @param {RegExp} [extractor] - Optional regular expression to extract data from the return field.
 * @return {(string[])} - The matched value(s) from the return field, possibly after applying the extractor.
 */
HL7Message.prototype.findInSegment = function (searchPath, searchValue, returnPath, extractor) {
    const [searchSeg, , searchField, searchFieldIdx, searchComp, searchSub] = this._hl7KeyParser(searchPath);
    const [, , returnField, returnFieldIdx, returnComp, returnSub] = this._hl7KeyParser(returnPath);

    // Get all segments of the type specified in searchSeg
    const segments = this.getSegments(searchSeg);
    return segments.reduce((acc, segment) => {
        const searchFieldValue = HL7Message._try(() => segment[searchField][searchFieldIdx][searchComp][searchSub], '');
        if (searchValue.test(searchFieldValue)) {
            let returnFieldValue = HL7Message._try(() => segment[returnField][returnFieldIdx][returnComp][returnSub], '');
            if (extractor instanceof RegExp) {
                const match = extractor.exec(returnFieldValue);
                if (match) {
                    acc.push(match[1] || match[0]); // Use match[1] if available, otherwise match[0]
                }
            } else {
                acc.push(returnFieldValue);
            }
        }
        return acc;
    }, []);
};

/**
 * Finds a segment based on a search path and value.
 * @param {string} searchPath - The path to search for the segment (e.g., 'OBX.5.1').
 * @param {RegExp} searchValue - A regular expression to match the value in the specified field.
 * @return {*}
 */
HL7Message.prototype.findSegment = function (searchPath, searchValue) {
    const [searchSeg, , searchField, searchFieldIdx, searchComp, searchSub] = this._hl7KeyParser(searchPath);
    const segments = this.getSegments(searchSeg);
    return segments.find(segment => {
        const fieldValue = HL7Message._try(() => segment[searchField][searchFieldIdx][searchComp][searchSub], '');
        return searchValue.test(fieldValue);
    });
}


/**
 * Compares two HL7Message objects and returns the differences.
 * @param {HL7Message} other - The other HL7Message object to compare with.
 * @param {Object} options - An object with options to ignore case.
 * @param {boolean} [options.ignoreCase=false] - Whether to ignore case when comparing values.
 * @return {string[]} - An array of differences in the format 'path: value1 != value2'.
 */
HL7Message.prototype.diff = function (other, options) {
    options = options || {ignoreCase: false};
    const differences = [];
    const filter = (keys) => (k) => keys.indexOf(k) === -1 && keys.push(k);
    const generateKeys = (objA, objB) => {
        objA = objA || {};
        objB = objB || {};
        const keys = []
        Object.keys(objA).forEach(filter(keys));
        Object.keys(objB).forEach(filter(keys));
        return keys;
    }
    const $t = (cb) => {
        try {
            return cb();
        } catch (_e) {
            // do nothing i.e. return undefined
        }
    }

    const compareSubComponents = (seg1, seg2, segIdx) => {
        const fields1 = Object.keys(seg1).filter(k => k !== '0');
        const fields2 = Object.keys(seg2).filter(k => k !== '0');
        const allFields = generateKeys(fields1, fields2);

        allFields.forEach(field => {
            const subFieldKeys = generateKeys(seg1[field], seg2[field]);

            subFieldKeys.forEach(subField => {
                const componentKeys = generateKeys($t(() => seg1[field][subField]), $t(() => seg2[field][subField]));

                componentKeys.forEach(comp => {
                    const subComponentKeys = generateKeys($t(() => seg1[field][subField][comp]), $t(() => seg2[field][subField][comp]));

                    subComponentKeys.forEach(subComp => {
                        const value1 = $t(() => seg1[field][subField][comp][subComp]) || '';
                        const value2 = $t(() => seg2[field][subField][comp][subComp]) || '';
                        const path = this.arrayToHl7Path([seg1['0'], segIdx, field, subField, comp, subComp]);
                        const isDifferent = options.ignoreCase ? value1.toLowerCase() !== value2.toLowerCase() : value1 !== value2;
                        if (isDifferent) {
                            differences.push(path + ': ' + value1 + ' != ' + value2);
                        }
                    });
                });
            });
        });
    };

    // Index segments by their type and index within their type
    const indexSegments = (seg) => {
        return seg.reduce((acc, segment) => {
            const type = segment['0'];
            (acc[type] = acc[type] || []).push(segment);
            return acc;
        }, {});
    };

    const thisIndexedSegments = indexSegments(this.segments);
    const otherIndexedSegments = indexSegments(other.segments);

    // Compare segments of the same type
    Object.keys(thisIndexedSegments).forEach(type => {
        const thisSegments = thisIndexedSegments[type];
        const otherSegments = otherIndexedSegments[type] || [];

        thisSegments.forEach((segment, idx) => {
            const segIdx = idx + 1;
            const otherSegment = otherSegments[idx];

            if (!otherSegment) {
                differences.push(this.arrayToHl7Path([type, segIdx]) + ': missing in other');
            } else {
                compareSubComponents.call(this, segment, otherSegment, segIdx);
            }
        });
    });

    // Check for missing segments in this message
    Object.keys(otherIndexedSegments).forEach(type => {
        const thisSegments = thisIndexedSegments[type] || [];
        const otherSegments = otherIndexedSegments[type];

        otherSegments.forEach((segment, idx) => {
            const segIdx = idx + 1;
            if (!thisSegments[idx]) {
                differences.push(this.arrayToHl7Path([type, segIdx]) + ': missing in this');
            }
        });
    });

    return differences;
};

/**
 * Validate the HL7 message against the set rules.
 * @return {string[]} - An array of validation issues.
 */
HL7Message.prototype.validate = function () {
    const issues = [];

    // Iterate over the rules and apply each rule to the message
    this._rules.forEach(rule => {
        const result = rule(this);
        if (result !== true) {
            issues.push(result);
        }
    });

    this._validationIssues = issues;
    return issues;
};

/**
 * Add a validation rule.
 * @param {function} rule - A function that takes the HL7Message and returns true if valid, otherwise an error message.
 * @return {HL7Message} - Returns the HL7Message object for chaining.
 */
HL7Message.prototype.addRule = function (rule) {
    HL7Message.assert(typeof rule === 'function', 'Rule must be a function')
    this._rules.push(rule);
    return this;
};

/**
 * Add multiple validation rules.
 * @param {function[]} rules - An array of functions that take the HL7Message and return true if valid, otherwise an error message.
 * @return {HL7Message} - Returns the HL7Message object for chaining.
 */
HL7Message.prototype.addRules = function (rules) {
    HL7Message.assert(Array.isArray(rules), 'Rules must be an array')
    rules.forEach(rule => this.addRule(rule));
}

/**
 * Add a rule that checks if a field is required.
 * @param {string} path - The path to the field to validate.
 * @param {string} [errorText=''] - The error message to return if the field is missing.
 * @return {HL7Message} - Returns the HL7Message object for chaining.
 */
HL7Message.prototype.addRuleIsRequired = function (path, errorText) {
    this.addRule((message) => {
        if (!message.get(path)) {
            return (path + ' is missing. ' + errorText || '').trim();
        }
        return true;
    });
    return this;
}

/**
 * Add multiple rules that check if fields are required.
 * @param {Array<[string, string]>} rules - An array of tuples where the first element is the path to the field to validate and the second element is the error message to return if the field is missing.
 * @return {HL7Message} - Returns the HL7Message object for chaining
 */
HL7Message.prototype.addRulesIsRequired = function (rules) {
    HL7Message.assert(Array.isArray(rules), 'Rules must be an array')
    rules.forEach(([path, errorText]) => this.addRuleIsRequired(path, errorText));
    return this;
}

/**
 * Add a rule that checks if a field matches a regular expression.
 * @param {string} path - The path to the field to validate.
 * @param {RegExp} regex - The regular expression to match against.
 * @param {string} errorText - The error message to return if the field is missing.
 * @return {HL7Message} - Returns the HL7Message object for chaining
 */
HL7Message.prototype.addRuleMatches = function (path, regex, errorText) {
    HL7Message.assert(path, 'path is required')
    HL7Message.assert(regex instanceof RegExp, 'regex must be a regular expression')

    this.addRule((message) => {
        const value = message.get(path);
        if (!regex.test(value)) {
            return (path + ' does not match the required pattern: ' + regex + ' ' + errorText || '').trim();
        }
        return true;
    });
    return this;
}

/**
 * Add multiple rules that check if fields match regular expressions.
 * @param {[string, RegExp, string][]} rules - An array of tuples where the first element is the path to the field to validate. The second element is the regular expression to match against. The third element is the error message to return if the field does not match the regular expression.
 * @return {HL7Message} - Returns the HL7Message object for chaining
 */
HL7Message.prototype.addRulesMatches = function (rules) {
    HL7Message.assert(Array.isArray(rules), 'Rules must be an array')
    rules.forEach(([path, regex, errorText]) => this.addRuleMatches(path, regex, errorText));
    return this;
}

/**
 * Add an Enum rule that checks if a field is equal to a value in a list of values.
 * @param {string} path - The path to the field to validate.
 * @param {(string|number)[]} values - An array of values to match against.
 * @param {string} [errorText=''] - The error message to return if the field does not match any of the values.
 * @return {HL7Message} - Returns the HL7Message object for chaining
 */
HL7Message.prototype.addRuleEnum = function (path, values, errorText) {
    HL7Message.assert(path, 'path is required')
    HL7Message.assert(Array.isArray(values), 'values must be an array')

    this.addRule((message) => {
        const value = message.get(path);
        if (values.indexOf(value) === -1) {
            return (path + ' does not match the required values: [' + values.join(', ') + '] ' + errorText || '').trim();
        }
        return true;
    });
    return this;
}

/**
 * Add multiple Enum rules that check if fields are equal to values in a list of values.
 * @param {[string, (string|number)[], string][]} rules - An array of tuples where the first element is the path to the field to validate. The second element is an array of values to match against. The third element is the error message to return if the field does not match any of the values.
 * @return {HL7Message} - Returns the HL7Message object for chaining
 */
HL7Message.prototype.addRulesEnum = function (rules) {
    HL7Message.assert(Array.isArray(rules), 'Rules must be an array')
    rules.forEach(([path, values, errorText]) => this.addRuleEnum(path, values, errorText));
    return this;
}

/**
 * The toString() method returns a string representing the encoded HL7 messages.
 * @return {string}
 */
HL7Message.prototype.toString = function () {
    const {segment, field, fieldRepetition, subcomponent, component} = this.encoding

    /**
     * Reduces an object to an array optionally passing the results in to a callback {cb} function for additionally transformation
     * @private
     * @param {Object} elements
     * @param {string} joiner
     * @param {function} [cb]
     * @return {string}
     */
    const reducer = (elements, joiner, cb) => {
        if (!elements) {
            return ''
        }
        return Object.keys(elements).reduce((acc, idx) => {
            acc[idx - 1] = typeof cb === 'function' ? cb(elements[idx]) : elements[idx]
            return acc
        }, []).join(joiner)
    }

    const reduceComponents = (comp) => reducer(comp, subcomponent)
    const reduceField = (field) => reducer(field, component, reduceComponents)
    const reduceFields = (fields) => reducer(fields, fieldRepetition, reduceField)
    const reduceSegment = (segment) => (acc, idxFields, i) => {
        var fields = segment[idxFields]
        // this is to fix the duplicate field separator on the MSH segment
        if (segment[0] === 'MSH' && i > 1) {
            idxFields--
        }
        // handle segment name
        acc[idxFields] = (idxFields === '0') ? fields : reduceFields(fields)
        return acc
    }
    return this.segments.map((seg) => Object.keys(seg).reduce(reduceSegment(seg), []).join(field)).join(segment)
}

/**
 * Returns the HL7 as Mirth XML
 * @param {Object} [options]
 * @param {boolean} [options.removeNullish=true] - Remove nullish values before converting to XML
 * @param {boolean} [options.replaceInvalidChars=true] - Replace invalid characters with a space before converting to XML
 * @return {XML}
 */
HL7Message.prototype.toXML = function (options) {
    options = options || {removeNullish: true}
    options.removeNullish = typeof options.removeNullish === 'boolean' ? options.removeNullish : true
    options.replaceInvalidChars = typeof options.replaceInvalidChars === 'boolean' ? options.replaceInvalidChars : true
    // check if we are in Mirth/Rhino environment
    if (typeof XML === 'undefined') {
        throw new Error('XML type not detected! HL7Message.toXML is only valid in Mirth environment')
    }
    let raw = this.toString()
    if (options.removeNullish) {
        raw = raw
            .replace(/null/g, '')
            .replace(/undefined/g, '')
    }

    if (options.replaceInvalidChars) {
        raw = raw.replace(/[^\r\n\x20-\x7E]+/g, ' ')
    }
    return new XML(SerializerFactory.getSerializer('HL7V2').toXML(raw))
}

/**
 * The valueOf() method returns the primitive value of the HL7Message object.
 * @return {any}
 */
HL7Message.prototype.valueOf = function () {
    return JSON.parse(JSON.stringify(this._segments))
}

/**
 * Parse an HL7 encoded string. Replaces the current message values!
 * @param {string} hl7
 */
HL7Message.prototype.parse = function (hl7) {
    const [segments, encoding] = HL7Message.parser(hl7)
    this._encoding = encoding
    this._segments = segments
    Object.defineProperty(this, 'raw', {get: () => hl7, configurable: true})
}
/**
 * Returns a formatted JSON string where each segment is a single row in the returned array.
 * @return {string}
 */
HL7Message.prototype.formattedJSON = function () {
    const json = this.valueOf()
    return '[\n' + json.reduce((acc, ele, i, arr) => {
        return acc + '  ' + JSON.stringify(ele) + (i < arr.length - 1 ? ',' : '') + '\n'
    }, '') + ']'
}
/**
 * Return a new HL7Message instance that is an ACK of this HL7Message instance.
 * @return {HL7Message}
 */
HL7Message.prototype.createAckMessage = function () {
    const ack = new HL7Message()
    ack.encoding.fromJSON(this.encoding.toJSON())
    let dt = (new Date()).toISOString().replace(/[-:TZ]/g, '')
    ack.set('MSH.3.1', this.get('MSH.5.1'))
    ack.set('MSH.4.1', this.get('MSH.6.1'))
    ack.set('MSH.5.1', this.get('MSH.3.1'))
    ack.set('MSH.6.1', this.get('MSH.4.1'))
    ack.set('MSH.7.1', dt)
    ack.set('MSH.9.1', 'ACK')
    ack.set('MSH.10.1', dt)
    ack.set('MSH.11.1', 'P')
    ack.set('MSH.12.1', this.get('MSH.12.1'))
    ack.set('MSA.1.1', 'AA')
    ack.set('MSA.2.1', this.get('MSH.10.1'))
    return ack
}

// If we are in a Node.js environment, export the HL7Message module
if (typeof module !== 'undefined') {
    module.exports = HL7Message
}

/* global require */
