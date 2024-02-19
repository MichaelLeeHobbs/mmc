/*** THIS IS A WORK IN PROGRESS ***/

const JavaStringSymbol: unique symbol = Symbol('JavaString');
const JavaObjectSymbol: unique symbol = Symbol('JavaObject');

type JavaClass = {};

class JavaObject {
    [JavaObjectSymbol]: void; // Unique property to differentiate from regular objects
    constructor();

    /** Creates and returns a copy of this object. */
    protected clone(): JavaObject;

    /** Indicates whether some other object is "equal to" this one. */
    equals(obj: JavaObject): JavaBoolean;

    /** Called by the garbage collector on an object when garbage collection determines that there are no more references to the object. */
    finalize(): void;

    /** Returns the runtime class of this Object. */
    getClass(): JavaClass;

    /** Returns a hash code value for the object. */
    hashCode(): JavaInteger;

    /** Wakes up a single thread that is waiting on this object's monitor. */
    notify(): void;

    /** Wakes up all threads that are waiting on this object's monitor. */
    notifyAll(): void;

    /** Returns a string representation of the object. */
    toString(): string; // Todo - is this a string or a JavaString?
    /** Causes the current thread to wait until another thread invokes the notify() method or the notifyAll() method for this object. */
    wait(): void;
    /** Causes the current thread to wait until either another thread invokes the notify() method or the notifyAll() method for this object, or a specified amount of time has elapsed. */
    wait(timeout: JavaLong): void;
    /** Causes the current thread to wait until another thread invokes the notify() method or the notifyAll() method for this object, or some other thread interrupts the current thread, or a certain amount of real time has elapsed. */
    wait(timeout: JavaLong, nanos: JavaInteger): void;
}

class JavaString extends JavaObject implements CharSequence {
    [JavaStringSymbol]: void; // Unique property to differentiate from regular strings
    constructor();
    constructor(byteArray: JavaByte[]);
    constructor(byteArray: JavaByte[], charset: JavaString);
    constructor(ascii: JavaByte[], hibyte: JavaInteger);
    constructor(bytes: JavaByte[], offset: JavaInteger, length: JavaInteger);
    constructor(ascii: JavaByte[], hibyte: JavaInteger, offset: JavaInteger, count: JavaInteger);
    constructor(bytes: JavaByte[], offset: JavaInteger, length: JavaInteger, charsetName: JavaString);
    constructor(bytes: JavaByte[], charsetName: JavaString);
    constructor(chars: JavaChar[]);
    constructor(chars: JavaChar[], offset: JavaInteger, count: JavaInteger);
    constructor(codePoints: JavaInteger[], offset: JavaInteger, count: JavaInteger);
    constructor(original: JavaString);
    constructor(buffer: JavaStringBuffer);
    constructor(builder: JavaStringBuilder);


    /** Returns the JavaChar value at the specified index. */
    charAt(index: JavaInteger): JavaChar

    /** Returns the character (Unicode code point) at the specified index. */
    codePointAt(index: JavaInteger): JavaInteger

    /** Returns the character (Unicode code point) before the specified index.*/
    codePointBefore(index: JavaInteger): JavaInteger

    /** Returns the number of Unicode code points in the specified text range of this String. */
    codePointCount(beginIndex: JavaInteger, endIndex: JavaInteger): JavaInteger

    /** Compares two strings lexicographically. */
    compareTo(anotherString: String): JavaInteger

    /** Compares two strings lexicographically, ignoring case differences.*/
    compareToIgnoreCase(str: String): JavaInteger

    /** Concatenates the specified string to the end of this string. */
    concat(str: String): String

    /** Returns true if and only if this string contains the specified sequence of JavaChar values. */
    contains(s: CharSequence): JavaBoolean

    /** Compares this string to the specified CharSequence. */
    contentEquals(cs: CharSequence): JavaBoolean
    /** Compares this string to the specified StringBuffer.*/
    contentEquals(sb: JavaStringBuffer): JavaBoolean

    /** Equivalent to valueOf(JavaChar[]). */
    static copyValueOf(data: JavaChar[]): JavaString
    /** Equivalent to valueOf(JavaChar[], JavaInteger, JavaInteger). */
    static copyValueOf(data: JavaChar[], offset: JavaInteger, count: JavaInteger): JavaString

    /** Tests if this string ends with the specified suffix.*/
    endsWith(suffix: String): JavaBoolean

    /** Compares this string to the specified object.*/
    equals(anObject: Object): JavaBoolean

    /** Compares this String to another String, ignoring case considerations. */
    equalsIgnoreCase(anotherString: String): JavaBoolean

    /** Returns a formatted string using the specified locale, format string, and arguments. */
    static format(l: Locale, format: JavaString, ...args: any[]): JavaString
    /** Returns a formatted string using the specified format string and arguments. */
    static format(format: JavaString, ...args: any[]): JavaString

    /** Encodes this String into a sequence of bytes using the platform's default charset, storing the result into a new byte array. */
    getBytes(): JavaByte[]
    /** Encodes this String into a sequence of bytes using the given charset, storing the result into a new byte array. */
    getBytes(charset: Charset): JavaByte[]
    /** Deprecated. This method does not properly convert characters into bytes. As of JDK 1.1, the preferred way to do this is via the getBytes() method, which uses the platform's default charset. */
    getBytes(srcBegin: JavaInteger, srcEnd: JavaInteger, dst: JavaByte[], dstBegin: JavaInteger): void
    /** Encodes this String into a sequence of bytes using the named charset, storing the result into a new byte array. */
    getBytes(charsetName: JavaString): JavaByte[]

    /** Copies characters from this string into the destination character array. */
    getChars(srcBegin: JavaInteger, srcEnd: JavaInteger, dst: JavaChar[], dstBegin: JavaInteger): void

    /** Returns a hash code for this string. */
    hashCode(): JavaInteger

    /** Returns the index within this string of the first occurrence of the specified character. */
    indexOf(ch: JavaInteger): JavaInteger
    /** Returns the index within this string of the first occurrence of the specified character, starting the search at the specified index. */
    indexOf(ch: JavaInteger, fromIndex: JavaInteger): JavaInteger
    /** Returns the index within this string of the first occurrence of the specified substring. */
    indexOf(str: String): JavaInteger
    /** Returns the index within this string of the first occurrence of the specified substring, starting at the specified index. */
    indexOf(str: String, fromIndex: JavaInteger): JavaInteger

    /** Returns a canonical representation for the string object. */
    intern(): JavaString

    /** Returns true if, and only if, length() is 0. */
    isEmpty(): JavaBoolean

    /** Returns a new String composed of copies of the CharSequence elements joined together with a copy of the specified delimiter. */
    static join(delimiter: CharSequence, elements: CharSequence[]): JavaString
    /** Returns a new String composed of copies of the CharSequence elements joined together with a copy of the specified delimiter. */
    static join(delimiter: CharSequence, elements: JavaString[]): JavaString

    /** Returns the index within this string of the last occurrence of the specified character. */
    lastIndexOf(ch: JavaInteger): JavaInteger
    /** Returns the index within this string of the last occurrence of the specified character, searching backward starting at the specified index. */
    lastIndexOf(ch: JavaInteger, fromIndex: JavaInteger): JavaInteger
    /** Returns the index within this string of the last occurrence of the specified substring. */
    lastIndexOf(str: String): JavaInteger
    /** Returns the index within this string of the last occurrence of the specified substring, searching backward starting at the specified index. */
    lastIndexOf(str: String, fromIndex: JavaInteger): JavaInteger

    /** Returns the length of this string. */
    length(): JavaInteger

    /** Tells whether or not this string matches the given regular expression. */
    matches(regex: String): JavaBoolean

    /** Returns the index within this String that is offset from the given index by codePointOffset code points. */
    offsetByCodePoints(index: JavaInteger, codePointOffset: JavaInteger): JavaInteger

    /** Tests if two string regions are equal. */
    regionMatches(ignoreCase: JavaBoolean, toffset: JavaInteger, other: String, ooffset, JavaInteger, len, JavaInteger): JavaBoolean
    /** Tests if two string regions are equal. */
    regionMatches(toffset: JavaInteger, other: String, ooffset: JavaInteger, len, JavaInteger): JavaBoolean

    /** Returns a string resulting from replacing all occurrences of oldChar in this string with newChar. */
    replace(oldChar: JavaChar, newChar: JavaChar): String
    /** Replaces each substring of this string that matches the literal target sequence with the specified literal replacement sequence. */
    replace(target: CharSequence, replacement: CharSequence): String

    /** Replaces each substring of this string that matches the given regular expression with the given replacement. */
    replaceAll(regex: String, replacement: String): String

    /** Replaces the first substring of this string that matches the given regular expression with the given replacement. */
    replaceFirst(regex: String, replacement: String): String

    /** Splits this string around matches of the given regular expression. */
    split(regex: JavaString): JavaString[]
    /** Splits this string around matches of the given regular expression. */
    split(regex: JavaString, limit: JavaInteger): JavaString[]

    /** Tests if this string starts with the specified prefix. */
    startsWith(prefix: String): JavaBoolean
    /** Tests if the substring of this string beginning at the specified index starts with the specified prefix. */
    startsWith(prefix: String, toffset: JavaInteger): JavaBoolean

    /** Returns a character sequence that is a subsequence of this sequence. */
    subSequence(beginIndex: JavaInteger, endIndex: JavaInteger): CharSequence

    /** Returns a string that is a substring of this string. */
    substring(beginIndex: JavaInteger): String
    /** Returns a string that is a substring of this string. */
    substring(beginIndex: JavaInteger, endIndex: JavaInteger): String

    /** Converts this string to a new character array. */
    toCharArray(): JavaChar[]

    /** Converts all of the characters in this String to lower case using the rules of the default locale. */
    toLowerCase(): JavaString
    /** Converts all of the characters in this String to lower case using the rules of the given Locale. */
    toLowerCase(locale: Locale): JavaString

    /** This object (which is already a string!) is itself returned. */
    toString(): string

    /** Converts all of the characters in this String to upper case using the rules of the default locale. */
    toUpperCase(): JavaString
    /** Converts all of the characters in this String to upper case using the rules of the given Locale. */
    toUpperCase(locale: Locale): JavaString

    /** Returns a string whose value is this string, with any leading and trailing whitespace removed. */
    trim(): JavaString

    /** Returns the string representation of the boolean argument. */
    static valueOf(b: boolean): JavaString
    /** Returns the string representation of the JavaChar argument. */
    static valueOf(c: JavaChar): JavaString
    /** Returns the string representation of the JavaChar array argument. */
    static valueOf(data: JavaChar[]): JavaString
    /** Returns the string representation of a specific subarray of the JavaChar array argument. */
    static valueOf(data: JavaChar[], offset: JavaInteger, count: JavaInteger): JavaString
    /** Returns the string representation of the double argument. */
    static valueOf(d: JavaDouble): JavaString
    /** Returns the string representation of the float argument. */
    static valueOf(f: JavaFloat): JavaString
    /** Returns the string representation of the JavaInteger argument. */
    static valueOf(i: JavaInteger): JavaString
    /** Returns the string representation of the long argument. */
    static valueOf(l: JavaLong): JavaString
    /** Returns the string representation of the Object argument. */
    static valueOf(obj: Object): JavaString
}

interface CharSequence {
    /** Returns the char value at the specified index. */
    charAt(index: JavaInteger): JavaChar;

    /** Returns a stream of int zero-extending the char values from this sequence. */
    chars(): IntStream;

    /** Returns a stream of code point values from this sequence. */
    codePoints(): IntStream;

    /** Returns the length of this character sequence. */
    length(): JavaInteger;

    /** Returns a CharSequence that is a subsequence of this sequence. */
    subSequence(start: JavaInteger, end: JavaInteger): CharSequence;

    /** Returns a string containing the characters in this sequence in the same order as this sequence. */
    toString(): string; // Todo - is this a string or a JavaString?
}

class Charset extends JavaObject {

}

class JavaStringBuffer extends JavaObject {

}

class JavaStringBuilder extends JavaObject {

}

class JavaChar extends JavaObject {

}


class JavaInteger extends JavaObject {

}

class JavaDouble extends JavaObject {

}

class JavaLong extends JavaObject {

}

class JavaFloat extends JavaObject {

}

class JavaBoolean extends JavaObject {

}

class JavaShort extends JavaObject {

}

class Locale extends JavaObject {

}

class List<T> extends JavaObject {

}

class JavaMap<T, U> extends JavaObject {

}

class JavaByte extends JavaObject {
    static BYTES;
    static MAX_VALUE;
    static MIN_VALUE;
    static SIZE;
    static TYPE;

    constructor(value: JavaByte | JavaString);

    byteValue(): JavaByte;

    compare(x: JavaByte, y: JavaByte): JavaInteger;

    compareTo(anotherByte: JavaByte): JavaInteger;

    decode(nm: JavaString): JavaByte;

    doubleValue(): JavaDouble;

    equals(obj: JavaObject): JavaBoolean;

    floatValue(): JavaFloat;

    hashCode(): JavaInteger;

    longValue(): JavaLong;

    parseByte(s: JavaString): JavaByte;
    parseByte(s: JavaString, radix: JavaInteger): JavaByte;

    shortValue(): JavaShort;

    toString(): JavaString;

    static toString(b: JavaByte): JavaString;

    static toUnsignedInt(x: JavaByte): JavaInteger;

    static toUnsignedLong(x: JavaByte): JavaLong;

    static valueOf(b: JavaByte): JavaByte;
    static valueOf(s: JavaString): JavaByte;
    static valueOf(s: JavaString, radix: JavaInteger): JavaByte;
}


declare global {


    /** Gets the Attachment IDs for the specified channel and message. If no channel or message is specified, the current channel and message are used. */
    function getAttachmentIds(channelId?: string, messageId?: string): JavaString[];


    /** The current message. */
    var msg: any;

    /** The current message template. */
    var tmp: any;

    // TODO - is this correct?
    /** The current message. */
    var message = new com.mirth.connect.userutil.ImmutableMessage();

    /** The response message. */
    var response: ImmutableResponse;

    /** The response status. response.getStatus() */
    var responseStatus: any; // response.getStatus();

    /** The response error message. response.getError() */
    var responseErrorMessage: any; // response.getError();

    /** The response status message. response.getStatusMessage() */
    var responseStatusMessage: any; // response.getStatusMessage();


    // TODO - what is this?
    /** The version? */
    var version: any;

    /** The current connector map. */
    var connectorMap: any;

    var channelMap: any;

    var sourceMap: any;

    var globalMap: any;

    var globalChannelMap: any;

    var responseMap: any;

    /** Get or Put connectorMap values */
    function $co(key: string | number, value?: any): any;

    /** Get or Put channelMap values */
    function $c(key: string | number, value?: any): any;

    /** Get or Put sourceMap values */
    function $s(key: string | number, value?: any): any;

    /** Get or Put globalChannelMap values */
    function $gc(key: string | number, value?: any): any;

    /** Get or Put globalMap values */
    function $g(key: string | number, value?: any): any;

    /** Get or Put configurationMap values - note: the configurationMap is read-only */
    function $cfg(key: string | number, value?: any): any;

    /** Get or Put responseMap values */
    function $r(key: string | number, value?: any): any;

    /** Get the key from the first map that contains it */
    function $(key: string | number, value?: any): any;

    var SMTPConnectionFactory: any;
    var DatabaseConnectionFactory: DatabaseConnectionFactory; // = new DatabaseConnectionFactory();
    var executeCachedQuery: any;
    var createDatabaseConnection: any;
    var createSMTPConnection: any;
    var executeUpdate: any;
    var SerializerFactory: any;
    var alerts: AlertSender; // = new AlertSender(channelId);

    /** The current channel ID. */
    var channelId: string;

    /** The current channel name. */
    var channelName: string;

    var replacer: TemplateValueReplacer; // = new TemplateValueReplacer();

    var contextFactory: ContextFactory; // = new ContextFactory();
    var FileUtil: {}
    var DateUtil: {}

    /** Helper function to create segments */
    function createSegment(name: JavaString, msgObj: XML, index: JavaInteger): XML;

    /** Helper function to create segments after specified field */
    function createSegmentAfter(name: JavaString, segment: XML): XML;

    /** Creates an Attachment and adds it to the message attachments. */
    function addAttachment(data: String | JavaByte[], type: String, base64Encode: boolean): any;

    /** Gets the Attachments and base64 decodes them if specified. */
    function getAttachments(base64Decode?: boolean): List<Attachment>;

    /**
     * Updates the attachment.
     * @param arg1
     * @param arg2
     * @param arg3
     * @param arg4
     * @param arg5
     */
    function updateAttachment(arg1, arg2, arg3, arg4, arg5): any;


    /** Script used to check for existence of segment */
    function validate(mapping, defaultValue: any, replacement: any): any;

    /** Helper function to get the length of an XMLList or array */
    function getArrayOrXmlLength(obj): JavaInteger;

    /** Helper function to create a new String but leave undefined/null values alone */
    function newStringOrUndefined(value): String | undefined | null;

    /** Helper function to create a new Boolean but leave undefined/null values alone */
    function newBooleanOrUndefined(value): Boolean | undefined | null;

    /** Helper function to create a new Number but leave undefined/null values alone */
    function newNumberOrUndefined(value): Number | undefined | null;

    /** An instance of the VMRouter class. new VMRouter() */
    var router: VMRouter; // new VMRouter();


    /** Mirth Connect Connector Message */
    var connectorMessage: {
        /** Returns the ID of the channel associated with this connector message. */
        getChannelId(): String;
        /** Returns the channel map. */
        getChannelMap(): JavaMap<String, Object>;
        /** Returns the Name of the channel associated with this connector message. */
        getChannelName(): String;
        /** Returns the message ID of the message. */
        getMessageId(): number;
    };


    var XmlUtil: {}


    var destinationSet: {}

    var logger: {
        // FIXME
        addAppender(): void;
        assertLog(): void;
        callAppenders(): void;
        debug(): void;
        debug(): void;
        error(): void;
        error(): void;
        exists(): void;
        fatal(): void;
        fatal(): void;
        forcedLog(): void;
        getAdditivity(): void;
        getAllAppenders(): void;
        getAppender(): void;
        getChainedPriority(): void;
        getCurrentCategories(): void;
        getDefaultHierarchy(): void;
        getEffectiveLevel(): void;
        getHierarchy(): void;
        getInstance(): void;
        getInstance(): void;
        getLevel(): void;
        getLoggerRepository(): void;
        getName(): void;
        getParent(): void;
        getPriority(): void;
        getResourceBundle(): void;
        getResourceBundleString(): void;
        getRoot(): void;
        info(): void;
        info(): void;
        isAttached(): void;
        isDebugEnabled(): void;
        isEnabledFor(): void;
        isInfoEnabled(): void;
        l7dlog(): void;
        l7dlog(): void;
        log(): void;
        log(): void;
        log(): void;
        removeAllAppenders(): void;
        removeAppender(): void;
        removeAppender(): void;
        setAdditivity(): void;
        setLevel(): void;
        setPriority(): void;
        setResourceBundle(): void;
        shutdown(): void;
        warn(): void;
        warn(): void;
    }


    /**
     * Represents an XML class with functionalities for manipulating and querying XML data.
     * Instances of this class provide methods to add namespaces, append children, manage attributes and elements,
     * and perform various other operations on XML data.
     *
     * @see https://svn.wso2.org/repos/wso2/tags/carbon/0.1alpha/mashup/java/xdocs/e4xquickstart.html
     * @global
     */
    class XML {
        /** Adds the namespace to the in-scope namespaces of the element. */
        addNamespace(namespace: String): void;

        /** Adds child as a new child of the element, after all other children. */
        appendChild(child: XML): void;

        /** Returns the attribute of with the requested name. */
        attribute(attributeName: String): String;

        /** Returns the attributes of this element. */
        attributes(): [String];

        /** Returns the child element with the given propertyName, or if propertyName is an integer, returns the child in that position. */
        child(propertyName: String): XML;

        /** Returns the index of this children among its siblings. */
        childIndex(): number;

        /** Returns all the children of this object. */
        children(): [XML];

        /** Returns all the comments that are children of this XML object. */
        comments(): [String];

        /** Compares this element with the value, primarily provided to enable an XML element and an XML list to be used interchangeably. */
        contains(value: any): boolean;

        /** Returns a deep copy of the element. The parent property of the copy will be set to null. */
        copy(): XML;

        /** Returns the descendant elements (children, grandchildren, etc.). If a name is provided, only elements with that name are returned. */
        descendants(name?: String): XML;

        /** Returns the child elements. If a name is provided, only elements with that name are returned. */
        elements(name?: String): XML;

        /** Returns true for elements with child elements, otherwise false. */
        hasComplexContent(): boolean;

        /** Returns true for attributes, text nodes, or elements without child elements, otherwise false. */
        hasSimpleContent(): boolean;

        /** Returns an array of Namespace objects representing the namespaces in scope for this object. */
        inScopeNamespaces(): [Object]; // FIXME - is this the correct return type?
        /** Inserts child2 immediately after child1 in the XML object's children list. */
        insertChildAfter(child1: XML, child2: XML): void;

        /** Inserts child2 immediately prior to child1 in the XML object's children list. */
        insertChildBefore(child1: XML, child2: XML): void;

        /** Returns 1 for XML objects (allowing an XML object to be treated like an XML List with a single item.) */
        length(): number;

        /** Returns the local name of this object. */
        localName(): String;

        /** Returns the qualified name of this object. */
        name(): String;

        /** Returns the namespace associated with this object, or if a prefix is specified, an in-scope namespace with that prefix. */
        namespace(prefix?: String): String;

        /** An array of Namespace objects representing the namespace declarations associated with this object. */
        namespaceDeclarations(): [String];

        /** A String representing the kind of object this is (e.g. "element"). */
        nodeKind(): String;

        /** Merge adjacent text nodes and eliminate empty ones. */
        normalize(): void;

        /** The parent of this object. For an XML List object, this returns undefined unless all the items of the list have the same parent. */
        parent(): XML;

        /** A list of all processing instructions that are children of this element. If a name is provided, only processing instructions matching this name will be returned. */
        processingInstructions(name?: String): [Object]; // FIXME - is this the correct return type?
        /** Add a new child to an element, prior to all other children. */
        prependChild(value: String): void;

        /** Removes a namespace from the in-scope namespaces of the element. */
        removeNamespace(namespace: String): void;

        /** Replace a child with a new one. */
        replace(propertyName: String, value: XML): void;

        /** Replace the children of the object with the value (typically an XML List). */
        setChildren(value: XML): void;

        /** Sets the local name of the XML object to the requested value. */
        setLocalName(name: String): void;

        /** Sets the name of the XML object to the requested value (possibly qualified). */
        setName(name: String): void;

        /** Sets the namespace of the XML object to the requested value. */
        setNamespace(ns: String): void;

        /** Concatenation of all text node children. */
        text(): String;

        /** For elements without element children, returns the values of the text node children. For elements with element children, returns same as toXMLString. For other kinds of objects, the value of the object. */
        toString(): String;

        /** Returns this XML object. */
        valueOf(): String;
    }

    class VMRouter {
        /** Dispatches a message to a channel, specified by the deployed channel name. If the dispatch fails for any reason (for example, if the target channel is not started), a Response object with the ERROR status and the error message will be returned. */
        routeMessage(channelName: JavaString, rawMessage: RawMessage | JavaString): Response;

        /** Dispatches a message to a channel, specified by the deployed channel ID. If the dispatch fails for any reason (for example, if the target channel is not started), a Response object with the ERROR status and the error message will be returned. */
        routeMessageByChannelId(channelId: JavaString | string, rawMessage: RawMessage | JavaString): Response;

    }


    class TemplateValueReplacer {

    }

    class AlertSender {

    }

    class DatabaseConnectionFactory {

    }

    class ContextFactory {

    }


    declare namespace com {
        declare namespace mirth {
            declare namespace connect {
                declare namespace server {
                    declare namespace userutil {
                        class RawMessage {
                            constructor(rawBytes: JavaByte[]);
                            constructor(rawBytes: JavaByte[], destinationMetaDataIds: Collection<Number>);
                            constructor(rawBytes: JavaByte[], destinationMetaDataIds: Collection<Number>, sourceMap: Map<JavaString, JavaObject>);
                            constructor(rawData: JavaString);
                            constructor(rawData: JavaString, destinationMetaDataIds: Collection<Number>);
                            constructor(rawData: JavaString, destinationMetaDataIds: Collection<Number>, sourceMap: Map<JavaString, JavaObject>);

                            /** Removes references to any data (textual or binary) currently stored by the raw message. */
                            clearMessage(): void;
                            /** Deprecated. This method is deprecated and will soon be removed. Please use getSourceMap() instead. */
                            getChannelMap(): JavaMap<JavaString, JavaObject>;
                            /** Returns the collection of integers (metadata IDs) representing which destinations to dispatch the message to. */
                            getDestinationMetaDataIds(): Collection<JavaInteger>;
                            /** Returns the collection of integers (metadata IDs) representing which destinations to dispatch the message to. */
                            getDestinationMetaDataIds(): Collection<JavaInteger>;
                            /** Returns the binary data (byte array) to be dispatched to a channel. */
                            getRawBytes(): JavaByte[];
                            /** Returns the textual data to be dispatched to a channel. */
                            getRawData(): JavaString;
                            /** Returns the source map to be used at the beginning of the channel dispatch. */
                            getSourceMap(): JavaMap<JavaString, JavaObject>;
                            /** Deprecated. This method is deprecated and will soon be removed. Please use setSourceMap(sourceMap) instead. */
                            setChannelMap(channelMap: JavaMap<JavaString, JavaObject>): void;
                            /** Sets which destinations to dispatch the message to. */
                            setDestinationMetaDataIds(destinationMetaDataIds: Collection<Number>): void;
                            /** Sets the source map to be used at the beginning of the channel dispatch. */
                            setSourceMap(sourceMap: JavaMap<JavaString, JavaObject>): void;
                        }

                        class ImmutableResponse {
                            constructor(status: any, errorMessage: any, statusMessage: any);

                            /** Returns the error string associated with this response, if it exists. */
                            getError(): JavaString;

                            /** Returns the actual response data, as a string. */
                            getMessage(): JavaString;

                            /** Returns the Status (e.g. */
                            getNewMessageStatus(): com.mirth.connect.userutil.Status;

                            /** Returns a brief message explaining the reason for the current status. */
                            getStatusMessage(): JavaString;

                            getStatus(): any;
                        }
                    }
                }
                declare namespace userutil {
                    enum Status {
                        ERROR,
                        FILTERED,
                        PENDING,
                        QUEUED,
                        RECEIVED,
                        SENT,
                        TRANSFORMED,
                    }

                    class ImmutableMessage {
                        constructor(message: Message);

                        /** Returns a list of attachments associated with this message. */
                        getAttachments(): List<ImmutableAttachment>;

                        /** Returns the ID of the channel associated with this message. */
                        getChannelId(): JavaString;

                        /** Returns a map of connector messages associated with this message. */
                        getConnectorMessages(): JavaMap<JavaInteger, ImmutableConnectorMessage>;

                        /** Returns a Map of destination connector names linked to their corresponding connector metadata ID. */
                        getDestinationIdMap(): JavaMap<JavaInteger, JavaString>;

                        /** This method is deprecated and will soon be removed. Please use getDestinationIdMap() instead. */
                        getDestinationNameMap(): JavaMap<JavaString, JavaString>;

                        /** Returns the ID of the original channel this message was reprocessed from. */
                        getImportChannelId(): JavaString;

                        /** Returns the ID of the original message this one was imported from. */
                        getImportId(): JavaLong;

                        /** Returns a "merged" connector message containing data from all connector messages combined. */
                        getMergedConnectorMessage(): ImmutableConnectorMessage;

                        /** Returns the sequential ID of this message, as a Long. */
                        getMessageId(): JavaLong;

                        /** Returns the ID of the original message this one was reprocessed from. */
                        getOriginalId(): JavaLong;

                        /** This method is deprecated and will soon be removed. This method currently returns the received date of the source connector message. */
                        getReceivedDate(): JavaDate;

                        /** Returns the ID of the server associated with this message. */
                        getServerId(): JavaString;

                        /** Returns whether this message has finished processing through a channel. */
                        isProcessed(): JavaBoolean;

                        /** Returns a string representation of the object. */
                        toString(): string; // Todo - is this a string or a JavaString?
                    }
                }
            }
        }
    }
}

export {};
