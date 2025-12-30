/**
 * Type definitions for Mirth Connect / Rhino.js
 *
 * String Type Conventions:
 * ========================
 *
 * In Rhino.js (used by Mirth Connect), there are three string-related types:
 *
 * 1. `string` (lowercase) - JavaScript primitive string
 *    - Used for: toString() methods (required by TypeScript's Object base class)
 *    - Used for: Global Mirth JS wrapper function returns
 *    - typeof returns: "string"
 *
 * 2. `String` (capitalized) - JavaScript String wrapper object
 *    - Rarely used in this file
 *    - typeof returns: "object"
 *
 * 3. `java.lang.String` - Java String object
 *    - Used for: All Java class method returns and parameters
 *    - typeof returns: "object"
 *    - Rhino auto-converts between java.lang.String and JS string in most contexts
 *
 * When a Java method returns java.lang.String, it's technically a Java object,
 * but Rhino seamlessly converts it to a JS string in most operations.
 * We use java.lang.String for accuracy about what the Java API actually returns.
 *
 * Java Type Conventions:
 * ======================
 *
 * Java types are namespaced according to their Java package:
 * - java.lang.Object, java.lang.Integer, java.lang.Long, etc.
 * - java.util.List, java.util.Map, java.util.Collection, etc.
 *
 * Java Primitive Type Aliases:
 * ============================
 *
 * Java primitives are mapped to TypeScript's `number` type since JavaScript
 * only has one numeric type. These aliases provide documentation hints:
 * - `int` = number (Java 32-bit signed integer)
 * - `long` = number (Java 64-bit signed integer)
 *
 * Note: JavaScript's number is a 64-bit float, so large Java longs may lose precision.
 */

/**
 * Java primitive type aliases.
 * In Rhino, Java numeric primitives are converted to JavaScript numbers.
 * These type aliases provide hints about the original Java type.
 */

/** Java 64-bit signed integer. Maps to JavaScript number. */
type long = number;

/** Java 32-bit signed integer. Maps to JavaScript number. */
type int = number;

/** Java 8-bit signed integer. Maps to JavaScript number. */
type byte = number;

declare global {


    /** Gets the Attachment IDs for the specified channel and message. If no channel or message is specified, the current channel and message are used. */
    function getAttachmentIds(channelId?: string, messageId?: string): java.lang.String[];


    /** The current message. */
    var msg: any;

    /** The current message template. */
    var tmp: any;

    // TODO - is this correct?
    /** The current message. */
    var message: com.mirth.connect.userutil.ImmutableMessage;

    /** The response message. */
    var response: com.mirth.connect.server.userutil.ImmutableResponse;

    /** The response status. */
    var responseStatus: any;

    /** The response error message. */
    var responseErrorMessage: any;

    /** The response status message. */
    var responseStatusMessage: any;


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
    function $co(key: string | number, value?: unknown): unknown;

    /** Get or Put channelMap values */
    function $c(key: string | number, value?: unknown): unknown;

    /** Get or Put sourceMap values */
    function $s(key: string | number, value?: unknown): unknown;

    /** Get or Put globalChannelMap values */
    function $gc(key: string | number, value?: unknown): unknown

    /** Get or Put globalMap values */
    function $g(key: string | number, value?: unknown): unknown;

    /** Get or Put configurationMap values - note: the configurationMap is read-only */
    function $cfg(key: string | number, value?: unknown): unknown;

    /** Get or Put responseMap values */
    function $r(key: string | number, value?: unknown): unknown;

    /** Get the key from the first map that contains it */
    function $(key: string | number, value?: unknown): unknown;


    var SMTPConnectionFactory: any;
    var databaseConnectionFactory: com.mirth.connect.server.userutil.DatabaseConnectionFactory;
    var executeCachedQuery: any;
    var createDatabaseConnection: any;
    var createSMTPConnection: any;
    var executeUpdate: any;
    var SerializerFactory: any;
    var alerts: com.mirth.connect.server.userutil.AlertSender;

    /** The current channel ID. */
    var channelId: string;

    /** The current channel name. */
    var channelName: string;

    var replacer: TemplateValueReplacer;

    var contextFactory: com.mirth.connect.server.userutil.ContextFactory;

    /** Provides file utility methods. */
    var FileUtil: typeof com.mirth.connect.server.userutil.FileUtil;

    /** Provides date/time utility methods. */
    var DateUtil: typeof com.mirth.connect.server.userutil.DateUtil;

    /**
     * Utility object used in the preprocessor or source filter/transformer to prevent the message from being sent to specific destinations.
     * Available in: Preprocessor, Source Filter, Source Transformer
     */
    var destinationSet: com.mirth.connect.server.userutil.DestinationSet;

    /** Helper function to create segments */
    function createSegment(name: java.lang.String, msgObj: XML, index: java.lang.Integer): XML;

    /** Helper function to create segments after specified field */
    function createSegmentAfter(name: java.lang.String, segment: XML): XML;

    /** Creates an Attachment and adds it to the message attachments. */
    function addAttachment(data: String | byte[], type: String, base64Encode: boolean): any;

    /** Gets the Attachments and base64 decodes them if specified. */
    function getAttachments(base64Decode?: boolean): java.util.List<com.mirth.connect.server.userutil.Attachment>;

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
    function getArrayOrXmlLength(obj): java.lang.Integer;

    /** Helper function to create a new String but leave undefined/null values alone */
    function newStringOrUndefined(value): String | undefined | null;

    /** Helper function to create a new Boolean but leave undefined/null values alone */
    function newBooleanOrUndefined(value): Boolean | undefined | null;

    /** Helper function to create a new Number but leave undefined/null values alone */
    function newNumberOrUndefined(value): Number | undefined | null;

    var router: VMRouter;


    /** Mirth Connect Connector Message */
    var connectorMessage: {
        /** Returns the ID of the channel associated with this connector message. */
        getChannelId(): java.lang.String;
        /** Returns the channel map. */
        getChannelMap(): java.util.Map<java.lang.String, Object>;
        /** Returns the Name of the channel associated with this connector message. */
        getChannelName(): java.lang.String;
        /** Returns the message ID of the message. */
        getMessageId(): java.lang.Integer | number;
    };


    var XmlUtil: {};

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
     * This is an E4X (ECMAScript for XML) class - a JavaScript extension in Rhino.
     * All string returns are JavaScript strings, not java.lang.String.
     *
     * @see https://svn.wso2.org/repos/wso2/tags/carbon/0.1alpha/mashup/java/xdocs/e4xquickstart.html
     * @global
     */
    class XML {
        /** Adds the namespace to the in-scope namespaces of the element. */
        addNamespace(namespace: string): void;

        /** Adds child as a new child of the element, after all other children. */
        appendChild(child: XML): XML;

        /** Returns the attribute of with the requested name. */
        attribute(attributeName: string): string;

        /** Returns the attributes of this element. */
        attributes(): string[];

        /** Returns the child element with the given propertyName, or if propertyName is an integer, returns the child in that position. */
        child(propertyName: string): XML;

        /** Returns the index of this children among its siblings. */
        childIndex(): number;

        /** Returns all the children of this object. */
        children(): XML[];

        /** Returns all the comments that are children of this XML object. */
        comments(): string[];

        /** Compares this element with the value, primarily provided to enable an XML element and an XML list to be used interchangeably. */
        contains(value: any): boolean;

        /** Returns a deep copy of the element. The parent property of the copy will be set to null. */
        copy(): XML;

        /** Returns the descendant elements (children, grandchildren, etc.). If a name is provided, only elements with that name are returned. */
        descendants(name?: string): XML;

        /** Returns the child elements. If a name is provided, only elements with that name are returned. */
        elements(name?: string): XML;

        /** Returns true for elements with child elements, otherwise false. */
        hasComplexContent(): boolean;

        /** Returns true for attributes, text nodes, or elements without child elements, otherwise false. */
        hasSimpleContent(): boolean;

        /** Returns an array of Namespace objects representing the namespaces in scope for this object. */
        inScopeNamespaces(): object[];

        /** Inserts child2 immediately after child1 in the XML object's children list. */
        insertChildAfter(child1: XML, child2: XML): void;

        /** Inserts child2 immediately prior to child1 in the XML object's children list. */
        insertChildBefore(child1: XML, child2: XML): void;

        /** Returns 1 for XML objects (allowing an XML object to be treated like an XML List with a single item.) */
        length(): number;

        /** Returns the local name of this object. */
        localName(): string;

        /** Returns the qualified name of this object. */
        name(): string;

        /** Returns the namespace associated with this object, or if a prefix is specified, an in-scope namespace with that prefix. */
        namespace(prefix?: string): string;

        /** An array of Namespace objects representing the namespace declarations associated with this object. */
        namespaceDeclarations(): string[];

        /** A string representing the kind of object this is (e.g. "element"). */
        nodeKind(): string;

        /** Merge adjacent text nodes and eliminate empty ones. */
        normalize(): void;

        /** The parent of this object. For an XML List object, this returns undefined unless all the items of the list have the same parent. */
        parent(): XML;

        /** A list of all processing instructions that are children of this element. If a name is provided, only processing instructions matching this name will be returned. */
        processingInstructions(name?: string): object[];

        /** Add a new child to an element, prior to all other children. */
        prependChild(value: string): void;

        /** Removes a namespace from the in-scope namespaces of the element. */
        removeNamespace(namespace: string): void;

        /** Replace a child with a new one. */
        replace(propertyName: string, value: XML): void;

        /** Replace the children of the object with the value (typically an XML List). */
        setChildren(value: XML): void;

        /** Sets the local name of the XML object to the requested value. */
        setLocalName(name: string): void;

        /** Sets the name of the XML object to the requested value (possibly qualified). */
        setName(name: string): void;

        /** Sets the namespace of the XML object to the requested value. */
        setNamespace(ns: string): void;

        /** Concatenation of all text node children. */
        text(): string;

        /** For elements without element children, returns the values of the text node children. For elements with element children, returns same as toXMLString. For other kinds of objects, the value of the object. */
        toString(): string;

        /** Returns this XML object. */
        valueOf(): string;
    }

    class VMRouter {
        /** Dispatches a message to a channel, specified by the deployed channel name. If the dispatch fails for any reason (for example, if the target channel is not started), a Response object with the ERROR status and the error message will be returned. */
        routeMessage(channelName: java.lang.String, rawMessage: com.mirth.connect.server.userutil.RawMessage | java.lang.String): com.mirth.connect.userutil.Response;

        /** Dispatches a message to a channel, specified by the deployed channel ID. If the dispatch fails for any reason (for example, if the target channel is not started), a Response object with the ERROR status and the error message will be returned. */
        routeMessageByChannelId(channelId: java.lang.String | string, rawMessage: com.mirth.connect.server.userutil.RawMessage | java.lang.String): com.mirth.connect.userutil.Response;

    }


    class TemplateValueReplacer {

    }


    namespace java {
        namespace io {
            /** Marker interface for serializable classes. */
            interface Serializable {
                // Marker interface - no methods required
            }

            /** Output stream for writing objects. */
            class ObjectOutputStream extends java.lang.Object {
                // Implementation details not needed for type definitions
            }

            /** Input stream for reading objects. */
            class ObjectInputStream extends java.lang.Object {
                // Implementation details not needed for type definitions
            }

            /** Exception thrown when an encoding is not supported. */
            class UnsupportedEncodingException extends java.lang.Exception {
                constructor();
                constructor(message: java.lang.String);
            }

            /** Signals that an I/O exception of some sort has occurred. */
            class IOException extends java.lang.Exception {
                constructor();
                constructor(message: java.lang.String);
                constructor(cause: java.lang.Throwable);
                constructor(message: java.lang.String, cause: java.lang.Throwable);
            }

            /**
             * An abstract representation of file and directory pathnames.
             */
            class File extends java.lang.Object implements java.io.Serializable {
                constructor(pathname: java.lang.String);
                constructor(parent: java.lang.String, child: java.lang.String);
                constructor(parent: File, child: java.lang.String);

                /** Tests whether the file or directory denoted by this abstract pathname exists. */
                exists(): boolean;

                /** Returns the name of the file or directory. */
                getName(): java.lang.String;

                /** Returns the pathname string of this abstract pathname's parent. */
                getParent(): java.lang.String | null;

                /** Returns the abstract pathname of this abstract pathname's parent. */
                getParentFile(): File | null;

                /** Returns the absolute pathname string of this abstract pathname. */
                getAbsolutePath(): java.lang.String;

                /** Tests whether the file denoted by this abstract pathname is a directory. */
                isDirectory(): boolean;

                /** Tests whether the file denoted by this abstract pathname is a normal file. */
                isFile(): boolean;

                /** Returns the length of the file denoted by this abstract pathname. */
                length(): long;

                /** Deletes the file or directory denoted by this abstract pathname. */
                delete(): boolean;

                /** Creates the directory named by this abstract pathname. */
                mkdir(): boolean;

                /** Creates the directory named by this abstract pathname, including any necessary parent directories. */
                mkdirs(): boolean;

                /** Returns an array of strings naming the files and directories in the directory. */
                list(): java.lang.String[] | null;

                /** Returns an array of abstract pathnames denoting the files in the directory. */
                listFiles(): File[] | null;
            }

            /**
             * This abstract class is the superclass of all classes representing an input stream of bytes.
             */
            abstract class InputStream extends java.lang.Object {
                /** Reads the next byte of data from the input stream. */
                read(): int;

                /** Reads some number of bytes from the input stream and stores them into the buffer array. */
                read(b: byte[]): int;

                /** Reads up to len bytes of data from the input stream into an array of bytes. */
                read(b: byte[], off: int, len: int): int;

                /** Closes this input stream and releases any system resources associated with the stream. */
                close(): void;

                /** Returns an estimate of the number of bytes that can be read. */
                available(): int;
            }
        }
        namespace lang {
            /**
             * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/CharSequence.html
             */
            interface CharSequence {
                /** Returns the char value at the specified index. */
                charAt(index: java.lang.Integer): java.lang.Character;

                /** Returns a stream of int zero-extending the char values from this sequence. */
                chars?(): java.util.stream.IntStream;

                /** Returns a stream of code point values from this sequence. */
                codePoints?(): java.util.stream.IntStream;

                /** Returns the length of this character sequence. */
                length(): java.lang.Integer;

                /** Returns a CharSequence that is a subsequence of this sequence. */
                subSequence(start: java.lang.Integer, end: java.lang.Integer): CharSequence;

                /** Returns a string containing the characters in this sequence in the same order as this sequence. */
                toString(): string;
            }

            interface Comparable<T> {
                /**
                 * Compares this object with the specified object for order. Returns a negative integer, zero, or a positive integer as this object is less than, equal to, or greater than the specified object.
                 * @param o the object to be compared
                 * @throws NullPointerException if the specified object is null
                 */
                compareTo(o: T): int;
            }

            interface ConstantDesc {
                /** Resolves this descriptor reflectively. */
                resolveConstantDesc?(lookup: any): java.lang.Object;
            }

            interface Constable {
                describeConstable?<T extends ConstantDesc>(): T | undefined;
            }

            /** Implementing this interface allows an object to be the target of the "for-each loop" statement. */
            interface Iterable<T> {
                iterator(): java.util.Iterator<T>;
            }

            /**
             * Instances of the class Class represent classes and interfaces in a running Java application.
             * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html
             */
            interface Class<T = any> {
                /** Returns the name of the entity represented by this Class object. */
                getName(): java.lang.String;

                /** Returns the simple name of the underlying class. */
                getSimpleName(): java.lang.String;

                /** Returns the canonical name of the underlying class. */
                getCanonicalName(): java.lang.String;

                /** Determines if the specified Object is assignment-compatible with the object represented by this Class. */
                isInstance(obj: java.lang.Object): boolean;

                /** Determines if the class or interface represented by this Class object is a superclass or superinterface of the class or interface represented by the specified Class parameter. */
                isAssignableFrom(cls: Class<any>): boolean;

                /** Determines if the specified Class object represents an interface type. */
                isInterface(): boolean;

                /** Determines if this Class object represents an array class. */
                isArray(): boolean;

                /** Determines if the specified Class object represents a primitive type. */
                isPrimitive(): boolean;

                /** Returns true if this class is an enum type. */
                isEnum(): boolean;

                /** Returns the Class representing the superclass of the entity represented by this Class. */
                getSuperclass(): Class<any> | null;

                /** Returns a string describing this Class. */
                toString(): string;
            }

            class Object {
                constructor();

                /** Creates and returns a copy of this object. */
                protected clone(): java.lang.Object;

                /** Indicates whether some other object is "equal to" this one. */
                equals(obj: java.lang.Object): boolean;

                /** Called by the garbage collector on an object when garbage collection determines that there are no more references to the object. */
                finalize(): void;

                /** Returns the runtime class of this Object. */
                getClass(): java.lang.Class;

                /** Returns a hash code value for the object. */
                hashCode(): int;

                /** Wakes up a single thread that is waiting on this object's monitor. */
                notify(): void;

                /** Wakes up all threads that are waiting on this object's monitor. */
                notifyAll(): void;

                /** Returns a string representation of the object. */
                toString(): string;

                /** Causes the current thread to wait until another thread invokes the notify() method or the notifyAll() method for this object. */
                wait(): void;
                /** Causes the current thread to wait until either another thread invokes the notify() method or the notifyAll() method for this object, or a specified amount of time has elapsed. */
                wait(timeout: long): void;
                /** Causes the current thread to wait until another thread invokes the notify() method or the notifyAll() method for this object, or some other thread interrupts the current thread, or a certain amount of real time has elapsed. */
                wait(timeout: long, nanos: int): void;
            }

            class Throwable extends java.lang.Object implements java.io.Serializable {
                constructor();

                // todo
            }

            class Exception extends java.lang.Throwable implements java.io.Serializable {
                constructor();

                // todo
            }

            class String extends java.lang.Object implements java.io.Serializable, java.lang.CharSequence, Comparable<java.lang.String> {
                constructor();
                constructor(byteArray: Byte[]);
                constructor(byteArray: Byte[], charset: java.lang.String);
                constructor(ascii: Byte[], hibyte: java.lang.Integer);
                constructor(bytes: Byte[], offset: java.lang.Integer, length: java.lang.Integer);
                constructor(ascii: Byte[], hibyte: java.lang.Integer, offset: java.lang.Integer, count: java.lang.Integer);
                constructor(bytes: Byte[], offset: java.lang.Integer, length: java.lang.Integer, charsetName: java.lang.String);
                constructor(bytes: Byte[], charsetName: java.lang.String);
                constructor(chars: java.lang.Character[]);
                constructor(chars: java.lang.Character[], offset: java.lang.Integer, count: java.lang.Integer);
                constructor(codePoints: java.lang.Integer[], offset: java.lang.Integer, count: java.lang.Integer);
                constructor(original: java.lang.String);
                constructor(buffer: java.lang.StringBuffer);
                constructor(builder: java.lang.StringBuilder);


                /** Returns the JavaChar value at the specified index. */
                charAt(index: java.lang.Integer): java.lang.Character

                /** Returns the character (Unicode code point) at the specified index. */
                codePointAt(index: java.lang.Integer): java.lang.Integer

                /** Returns the character (Unicode code point) before the specified index.*/
                codePointBefore(index: java.lang.Integer): java.lang.Integer

                /** Returns the number of Unicode code points in the specified text range of this String. */
                codePointCount(beginIndex: java.lang.Integer, endIndex: java.lang.Integer): java.lang.Integer

                /** Compares two strings lexicographically. */
                compareTo(anotherString: String): int

                /** Compares two strings lexicographically, ignoring case differences.*/
                compareToIgnoreCase(str: String): java.lang.Integer

                /** Concatenates the specified string to the end of this string. */
                concat(str: String): String

                /** Returns true if and only if this string contains the specified sequence of JavaChar values. */
                contains(s: CharSequence): java.lang.Boolean

                /** Compares this string to the specified CharSequence. */
                contentEquals(cs: CharSequence): java.lang.Boolean
                /** Compares this string to the specified StringBuffer.*/
                contentEquals(sb: java.lang.StringBuffer): java.lang.Boolean

                /** Equivalent to valueOf(JavaChar[]). */
                static copyValueOf(data: java.lang.Character[]): java.lang.String
                /** Equivalent to valueOf(JavaChar[], JavaInteger, JavaInteger). */
                static copyValueOf(data: java.lang.Character[], offset: java.lang.Integer, count: java.lang.Integer): java.lang.String

                /** Tests if this string ends with the specified suffix.*/
                endsWith(suffix: String): java.lang.Boolean

                /** Compares this string to the specified object.*/
                equals(anObject: Object): boolean

                /** Compares this String to another String, ignoring case considerations. */
                equalsIgnoreCase(anotherString: String): java.lang.Boolean

                /** Returns a formatted string using the specified locale, format string, and arguments. */
                static format(l: java.util.Locale, format: java.lang.String, ...args: any[]): java.lang.String
                /** Returns a formatted string using the specified format string and arguments. */
                static format(format: java.lang.String, ...args: any[]): java.lang.String

                /** Encodes this String into a sequence of bytes using the platform's default charset, storing the result into a new byte array. */
                getBytes(): Byte[]
                /** Encodes this String into a sequence of bytes using the given charset, storing the result into a new byte array. */
                getBytes(charset: java.nio.charset.Charset): Byte[]
                /** Deprecated. This method does not properly convert characters into bytes. As of JDK 1.1, the preferred way to do this is via the getBytes() method, which uses the platform's default charset. */
                getBytes(srcBegin: java.lang.Integer, srcEnd: java.lang.Integer, dst: Byte[], dstBegin: java.lang.Integer): void
                /** Encodes this String into a sequence of bytes using the named charset, storing the result into a new byte array. */
                getBytes(charsetName: java.lang.String): Byte[]

                /** Copies characters from this string into the destination character array. */
                getChars(srcBegin: java.lang.Integer, srcEnd: java.lang.Integer, dst: java.lang.Character[], dstBegin: java.lang.Integer): void

                /** Returns a hash code for this string. */
                hashCode(): int

                /** Returns the index within this string of the first occurrence of the specified character. */
                indexOf(ch: java.lang.Integer): java.lang.Integer
                /** Returns the index within this string of the first occurrence of the specified character, starting the search at the specified index. */
                indexOf(ch: java.lang.Integer, fromIndex: java.lang.Integer): java.lang.Integer
                /** Returns the index within this string of the first occurrence of the specified substring. */
                indexOf(str: String): java.lang.Integer
                /** Returns the index within this string of the first occurrence of the specified substring, starting at the specified index. */
                indexOf(str: String, fromIndex: java.lang.Integer): java.lang.Integer

                /** Returns a canonical representation for the string object. */
                intern(): java.lang.String

                /** Returns true if, and only if, length() is 0. */
                isEmpty(): java.lang.Boolean

                /** Returns a new String composed of copies of the CharSequence elements joined together with a copy of the specified delimiter. */
                static join(delimiter: CharSequence, ...elements: CharSequence[]): java.lang.String
                /** Returns a new String composed of copies of the CharSequence elements joined together with a copy of the specified delimiter. */
                static join(delimiter: CharSequence, elements: java.lang.String[]): java.lang.String

                /** Returns the index within this string of the last occurrence of the specified character. */
                lastIndexOf(ch: java.lang.Integer): java.lang.Integer
                /** Returns the index within this string of the last occurrence of the specified character, searching backward starting at the specified index. */
                lastIndexOf(ch: java.lang.Integer, fromIndex: java.lang.Integer): java.lang.Integer
                /** Returns the index within this string of the last occurrence of the specified substring. */
                lastIndexOf(str: String): java.lang.Integer
                /** Returns the index within this string of the last occurrence of the specified substring, searching backward starting at the specified index. */
                lastIndexOf(str: String, fromIndex: java.lang.Integer): java.lang.Integer

                /** Returns the length of this string. */
                length(): java.lang.Integer

                /** Tells whether or not this string matches the given regular expression. */
                matches(regex: String): java.lang.Boolean

                /** Returns the index within this String that is offset from the given index by codePointOffset code points. */
                offsetByCodePoints(index: java.lang.Integer, codePointOffset: java.lang.Integer): java.lang.Integer

                /** Tests if two string regions are equal. */
                regionMatches(ignoreCase: java.lang.Boolean, toffset: java.lang.Integer, other: String, ooffset: java.lang.Integer, len: java.lang.Integer): java.lang.Boolean
                /** Tests if two string regions are equal. */
                regionMatches(toffset: java.lang.Integer, other: String, ooffset: java.lang.Integer, len: java.lang.Integer): java.lang.Boolean

                /** Returns a string resulting from replacing all occurrences of oldChar in this string with newChar. */
                replace(oldChar: java.lang.Character, newChar: java.lang.Character): String
                /** Replaces each substring of this string that matches the literal target sequence with the specified literal replacement sequence. */
                replace(target: CharSequence, replacement: CharSequence): String

                /** Replaces each substring of this string that matches the given regular expression with the given replacement. */
                replaceAll(regex: String, replacement: String): String

                /** Replaces the first substring of this string that matches the given regular expression with the given replacement. */
                replaceFirst(regex: String, replacement: String): String

                /** Splits this string around matches of the given regular expression. */
                split(regex: java.lang.String): java.lang.String[]
                /** Splits this string around matches of the given regular expression. */
                split(regex: java.lang.String, limit: java.lang.Integer): java.lang.String[]

                /** Tests if this string starts with the specified prefix. */
                startsWith(prefix: String): java.lang.Boolean
                /** Tests if the substring of this string beginning at the specified index starts with the specified prefix. */
                startsWith(prefix: String, toffset: java.lang.Integer): java.lang.Boolean

                /** Returns a character sequence that is a subsequence of this sequence. */
                subSequence(beginIndex: java.lang.Integer, endIndex: java.lang.Integer): CharSequence

                /** Returns a string that is a substring of this string. */
                substring(beginIndex: java.lang.Integer): String
                /** Returns a string that is a substring of this string. */
                substring(beginIndex: java.lang.Integer, endIndex: java.lang.Integer): String

                /** Converts this string to a new character array. */
                toCharArray(): java.lang.Character[]

                /** Converts all of the characters in this String to lower case using the rules of the default locale. */
                toLowerCase(): java.lang.String
                /** Converts all of the characters in this String to lower case using the rules of the given Locale. */
                toLowerCase(locale: java.util.Locale): java.lang.String

                /** This object (which is already a string!) is itself returned. */
                toString(): string

                /** Converts all of the characters in this String to upper case using the rules of the default locale. */
                toUpperCase(): java.lang.String
                /** Converts all of the characters in this String to upper case using the rules of the given Locale. */
                toUpperCase(locale: java.util.Locale): java.lang.String

                /** Returns a string whose value is this string, with any leading and trailing whitespace removed. */
                trim(): java.lang.String

                /** Returns the string representation of the boolean argument. */
                static valueOf(b: boolean): java.lang.String
                /** Returns the string representation of the JavaChar argument. */
                static valueOf(c: java.lang.Character): java.lang.String
                /** Returns the string representation of the JavaChar array argument. */
                static valueOf(data: java.lang.Character[]): java.lang.String
                /** Returns the string representation of a specific subarray of the JavaChar array argument. */
                static valueOf(data: java.lang.Character[], offset: java.lang.Integer, count: java.lang.Integer): java.lang.String
                /** Returns the string representation of the double argument. */
                static valueOf(d: java.lang.Double): java.lang.String
                /** Returns the string representation of the float argument. */
                static valueOf(f: java.lang.Float): java.lang.String
                /** Returns the string representation of the JavaInteger argument. */
                static valueOf(i: java.lang.Integer): java.lang.String
                /** Returns the string representation of the long argument. */
                static valueOf(l: java.lang.Long): java.lang.String
                /** Returns the string representation of the Object argument. */
                static valueOf(obj: Object): java.lang.String
            }

            /** A thread-safe, mutable sequence of characters. */
            class StringBuffer extends java.lang.Object implements java.io.Serializable, CharSequence {
                constructor();
                constructor(seq: CharSequence);
                constructor(capacity: java.lang.Integer);
                constructor(str: java.lang.String);

                append(s: java.lang.String): StringBuffer;
                append(c: java.lang.Character): StringBuffer;
                append(i: java.lang.Integer): StringBuffer;

                charAt(index: java.lang.Integer): java.lang.Character;

                length(): java.lang.Integer;

                subSequence(start: java.lang.Integer, end: java.lang.Integer): CharSequence;

                toString(): string;
            }

            /** A mutable sequence of characters (not thread-safe). */
            class StringBuilder extends java.lang.Object implements java.io.Serializable, CharSequence {
                constructor();
                constructor(seq: CharSequence);
                constructor(capacity: java.lang.Integer);
                constructor(str: java.lang.String);

                append(s: java.lang.String): StringBuilder;
                append(c: java.lang.Character): StringBuilder;
                append(i: java.lang.Integer): StringBuilder;

                charAt(index: java.lang.Integer): java.lang.Character;

                length(): java.lang.Integer;

                subSequence(start: java.lang.Integer, end: java.lang.Integer): CharSequence;

                toString(): string;
            }

            /** Wrapper class for primitive int. */
            class Integer extends java.lang.Object implements java.io.Serializable, Comparable<Integer> {
                static MAX_VALUE: int;
                static MIN_VALUE: int;
                static SIZE: int;
                static BYTES: int;

                constructor(value: int);
                constructor(s: java.lang.String);

                byteValue(): Byte;

                compareTo(anotherInteger: java.lang.Integer): int;

                doubleValue(): Double;

                equals(obj: java.lang.Object): boolean;

                floatValue(): Float;

                hashCode(): int;

                intValue(): int;

                longValue(): Long;

                shortValue(): Short;

                toString(): string;

                static parseInt(s: java.lang.String): int;
                static parseInt(s: java.lang.String, radix: int): int;

                static valueOf(i: int): java.lang.Integer;
                static valueOf(s: java.lang.String): java.lang.Integer;
                static valueOf(s: java.lang.String, radix: int): java.lang.Integer;
            }

            /** Wrapper class for primitive long. */
            class Long extends java.lang.Object implements java.io.Serializable, Comparable<Long> {
                static MAX_VALUE: long;
                static MIN_VALUE: long;
                static SIZE: int;
                static BYTES: int;

                constructor(value: long);
                constructor(s: java.lang.String);

                byteValue(): Byte;

                compareTo(anotherLong: Long): int;

                doubleValue(): Double;

                equals(obj: java.lang.Object): boolean;

                floatValue(): Float;

                hashCode(): int;

                intValue(): int;

                longValue(): long;

                shortValue(): Short;

                toString(): string;

                static parseLong(s: java.lang.String): long;
                static parseLong(s: java.lang.String, radix: int): long;

                static valueOf(l: long): Long;
                static valueOf(s: java.lang.String): Long;
                static valueOf(s: java.lang.String, radix: int): Long;
            }

            /** Wrapper class for primitive double. */
            class Double extends java.lang.Object implements java.io.Serializable, Comparable<Double> {
                static MAX_VALUE: number;
                static MIN_VALUE: number;
                static NaN: number;
                static NEGATIVE_INFINITY: number;
                static POSITIVE_INFINITY: number;
                static SIZE: int;
                static BYTES: int;

                constructor(value: number);
                constructor(s: java.lang.String);

                byteValue(): Byte;

                compareTo(anotherDouble: Double): int;

                doubleValue(): number;

                equals(obj: java.lang.Object): boolean;

                floatValue(): Float;

                hashCode(): int;

                intValue(): int;

                isInfinite(): boolean;

                isNaN(): boolean;

                longValue(): Long;

                shortValue(): Short;

                toString(): string;

                static parseDouble(s: java.lang.String): number;

                static valueOf(d: number): Double;
                static valueOf(s: java.lang.String): Double;
            }

            /** Wrapper class for primitive float. */
            class Float extends java.lang.Object implements java.io.Serializable, Comparable<Float> {
                static MAX_VALUE: number;
                static MIN_VALUE: number;
                static NaN: number;
                static NEGATIVE_INFINITY: number;
                static POSITIVE_INFINITY: number;
                static SIZE: int;
                static BYTES: int;

                constructor(value: number);
                constructor(s: java.lang.String);

                byteValue(): Byte;

                compareTo(anotherFloat: Float): int;

                doubleValue(): Double;

                equals(obj: java.lang.Object): boolean;

                floatValue(): number;

                hashCode(): int;

                intValue(): int;

                isInfinite(): boolean;

                isNaN(): boolean;

                longValue(): Long;

                shortValue(): Short;

                toString(): string;

                static parseFloat(s: java.lang.String): number;

                static valueOf(f: number): Float;
                static valueOf(s: java.lang.String): Float;
            }

            /** Wrapper class for primitive boolean. */
            class Boolean extends java.lang.Object implements java.io.Serializable, Comparable<Boolean> {
                static TRUE: Boolean;
                static FALSE: Boolean;

                constructor(value: boolean);
                constructor(s: java.lang.String);

                booleanValue(): boolean;

                compareTo(b: Boolean): int;

                equals(obj: java.lang.Object): boolean;

                hashCode(): int;

                toString(): string;

                static parseBoolean(s: java.lang.String): boolean;

                static valueOf(b: boolean): Boolean;
                static valueOf(s: java.lang.String): Boolean;
            }

            /** Wrapper class for primitive short. */
            class Short extends java.lang.Object implements java.io.Serializable, Comparable<Short> {
                static MAX_VALUE: int;
                static MIN_VALUE: int;
                static SIZE: int;
                static BYTES: int;

                constructor(value: int);
                constructor(s: java.lang.String);

                byteValue(): Byte;

                compareTo(anotherShort: Short): int;

                doubleValue(): Double;

                equals(obj: java.lang.Object): boolean;

                floatValue(): Float;

                hashCode(): int;

                intValue(): int;

                longValue(): Long;

                shortValue(): int;

                toString(): string;

                static parseShort(s: java.lang.String): int;
                static parseShort(s: java.lang.String, radix: int): int;

                static valueOf(s: int): Short;
                static valueOf(s: java.lang.String): Short;
                static valueOf(s: java.lang.String, radix: int): Short;
            }

            /** Wrapper class for primitive byte. */
            class Byte extends java.lang.Object implements java.io.Serializable, Comparable<Byte> {
                static MAX_VALUE: int;
                static MIN_VALUE: int;
                static SIZE: int;
                static BYTES: int;

                constructor(value: int);
                constructor(s: java.lang.String);

                byteValue(): int;

                compareTo(anotherByte: Byte): int;

                doubleValue(): Double;

                equals(obj: java.lang.Object): boolean;

                floatValue(): Float;

                hashCode(): int;

                intValue(): int;

                longValue(): Long;

                shortValue(): Short;

                toString(): string;

                static parseByte(s: java.lang.String): int;
                static parseByte(s: java.lang.String, radix: int): int;

                static valueOf(b: int): Byte;
                static valueOf(s: java.lang.String): Byte;
                static valueOf(s: java.lang.String, radix: int): Byte;
            }

            /** Wrapper class for primitive char. */
            class Character extends java.lang.Object implements java.io.Serializable, Comparable<Character> {
                static MAX_VALUE: string;
                static MIN_VALUE: string;
                static SIZE: int;
                static BYTES: int;

                constructor(value: string);

                charValue(): string;

                compareTo(anotherCharacter: Character): int;

                equals(obj: java.lang.Object): boolean;

                hashCode(): int;

                toString(): string;

                static valueOf(c: string): Character;
            }

            /**
             * A class loader is an object that is responsible for loading classes.
             */
            abstract class ClassLoader extends java.lang.Object {
                /** Returns the parent class loader for delegation. */
                getParent(): ClassLoader | null;

                /** Loads the class with the specified binary name. */
                loadClass(name: java.lang.String): java.lang.Class;

                /** Returns the system class loader for delegation. */
                static getSystemClassLoader(): ClassLoader;
            }
        }

        namespace util {
            namespace stream {
                /** A sequence of primitive int-valued elements supporting sequential and parallel aggregate operations. */
                interface IntStream {
                    // TODO: Define methods for IntStream as needed
                    // Stream of int values
                }
            }

            /** An ordered collection (sequence). */
            interface List<T> extends java.util.Collection<T> {
                add(element: T): boolean;

                add(index: int, element: T): void;

                addAll(collection: java.util.Collection<T>): boolean;

                addAll(index: int, collection: java.util.Collection<T>): boolean;

                clear(): void;

                contains(element: T): boolean;

                get(index: int): T;

                indexOf(element: T): int;

                isEmpty(): boolean;

                iterator(): Iterator<T>;

                lastIndexOf(element: T): int;

                remove(index: int): T;

                remove(element: T): boolean;

                set(index: int, element: T): T;

                size(): int;

                subList(fromIndex: int, toIndex: int): List<T>;

                toArray(): T[];
            }

            /** A collection that contains no duplicate elements. */
            interface Set<T> extends java.util.Collection<T> {
            }

            /** An object that maps keys to values. */
            interface Map<K, V> {
                clear(): void;

                containsKey(key: K): boolean;

                containsValue(value: V): boolean;

                entrySet(): Set<Map.Entry<K, V>>;

                get(key: K): V | null;

                isEmpty(): boolean;

                keySet(): Set<K>;

                put(key: K, value: V): V | null;

                putAll(map: Map<K, V>): void;

                remove(key: K): V | null;

                size(): int;

                values(): java.util.Collection<V>;
            }

            namespace Map {
                interface Entry<K, V> {
                    getKey(): K;

                    getValue(): V;

                    setValue(value: V): V;
                }
            }

            /** The root interface in the collection hierarchy. */
            interface Collection<T> extends java.lang.Iterable<T> {
                add(element: T): boolean;

                addAll(collection: java.util.Collection<T>): boolean;

                clear(): void;

                contains(element: T): boolean;

                isEmpty(): boolean;

                iterator(): Iterator<T>;

                remove(element: T): boolean;

                size(): int;

                toArray(): T[];
            }

            /** An iterator over a collection. */
            interface Iterator<T> {
                hasNext(): boolean;

                next(): T;

                remove(): void;
            }

            /** Represents a specific geographical, political, or cultural region. */
            class Locale extends java.lang.Object implements java.io.Serializable {
                static ENGLISH: Locale;
                static US: Locale;
                static UK: Locale;

                constructor(language: java.lang.String);
                constructor(language: java.lang.String, country: java.lang.String);
                constructor(language: java.lang.String, country: java.lang.String, variant: java.lang.String);

                getCountry(): java.lang.String;

                getLanguage(): java.lang.String;

                getVariant(): java.lang.String;

                toString(): string;
            }

            /** Represents a date/time with calendar fields. */
            abstract class Calendar extends java.lang.Object implements java.io.Serializable {
                static YEAR: int;
                static MONTH: int;
                static DAY_OF_MONTH: int;
                static HOUR: int;
                static MINUTE: int;
                static SECOND: int;
                static MILLISECOND: int;

                get(field: int): int;

                getTime(): Date;

                getTimeInMillis(): long;

                set(field: int, value: int): void;

                setTime(date: Date): void;

                setTimeInMillis(millis: long): void;

                static getInstance(): Calendar;
                static getInstance(locale: Locale): Calendar;
            }

            /** Represents a specific instant in time. */
            class Date extends java.lang.Object implements java.io.Serializable {
                constructor();
                constructor(date: long);

                getTime(): long;

                setTime(time: long): void;

                after(when: Date): boolean;

                before(when: Date): boolean;

                compareTo(anotherDate: Date): int;

                equals(obj: java.lang.Object): boolean;

                toString(): string;
            }

            /**
             * The Properties class represents a persistent set of properties.
             * Each key and its corresponding value in the property list is a string.
             */
            class Properties extends java.lang.Object {
                constructor();
                constructor(defaults: Properties);

                /** Searches for the property with the specified key. */
                getProperty(key: java.lang.String): java.lang.String | null;

                /** Searches for the property with the specified key and returns the default value if not found. */
                getProperty(key: java.lang.String, defaultValue: java.lang.String): java.lang.String;

                /** Sets the property value for the specified key. */
                setProperty(key: java.lang.String, value: java.lang.String): java.lang.Object;

                /** Returns an enumeration of all the keys in this property list. */
                propertyNames(): java.util.Iterator<java.lang.Object>;

                /** Returns a set of keys in this property list. */
                stringPropertyNames(): java.util.Set<java.lang.String>;
            }
        }

        namespace nio {
            namespace charset {
                /** A named mapping between sequences of sixteen-bit Unicode code units and sequences of bytes. */
                class Charset extends java.lang.Object {
                    static defaultCharset(): Charset;

                    static forName(charsetName: java.lang.String): Charset;

                    name(): java.lang.String;

                    displayName(): java.lang.String;

                    toString(): string;
                }
            }
        }
    }

    namespace java {
        namespace util {
            namespace concurrent {
                /**
                 * A Future represents the result of an asynchronous computation.
                 * Methods are provided to check if the computation is complete, to wait for its completion,
                 * and to retrieve the result of the computation.
                 */
                interface Future<V> {
                    /**
                     * Attempts to cancel execution of this task.
                     * @param mayInterruptIfRunning - true if the thread executing this task should be interrupted; otherwise, in-progress tasks are allowed to complete.
                     * @returns false if the task could not be cancelled, typically because it has already completed normally; true otherwise.
                     */
                    cancel(mayInterruptIfRunning: boolean): boolean;

                    /**
                     * Waits if necessary for the computation to complete, and then retrieves its result.
                     * @returns The computed result.
                     * @throws CancellationException - If the computation was cancelled.
                     * @throws ExecutionException - If the computation threw an exception.
                     * @throws InterruptedException - If the current thread was interrupted while waiting.
                     */
                    get(): V;

                    /**
                     * Waits if necessary for at most the given time for the computation to complete, and then retrieves its result, if available.
                     * @param timeout - The maximum time to wait.
                     * @param unit - The time unit of the timeout argument.
                     * @returns The computed result.
                     * @throws CancellationException - If the computation was cancelled.
                     * @throws ExecutionException - If the computation threw an exception.
                     * @throws InterruptedException - If the current thread was interrupted while waiting.
                     * @throws TimeoutException - If the wait timed out.
                     */
                    get(timeout: long, unit: any): V;

                    /**
                     * Returns true if this task was cancelled before it completed normally.
                     * @returns true if this task was cancelled before it completed.
                     */
                    isCancelled(): boolean;

                    /**
                     * Returns true if this task completed.
                     * @returns true if this task completed.
                     */
                    isDone(): boolean;
                }

                /**
                 * A TimeUnit represents time durations at a given unit of granularity.
                 */
                enum TimeUnit {
                    NANOSECONDS,
                    MICROSECONDS,
                    MILLISECONDS,
                    SECONDS,
                    MINUTES,
                    HOURS,
                    DAYS
                }

                namespace TimeUnit {
                    /** Returns an array containing the constants of this enum type. */
                    function values(): TimeUnit[];

                    /** Returns the enum constant with the specified name. */
                    function valueOf(name: java.lang.String): TimeUnit;
                }
            }
        }

        namespace sql {
            /**
             * A connection (session) with a specific database.
             */
            interface Connection {
                /** Releases this Connection object's database and JDBC resources immediately. */
                close(): void;

                /** Makes all changes made since the previous commit/rollback permanent. */
                commit(): void;

                /** Undoes all changes made in the current transaction. */
                rollback(): void;

                /** Sets this connection's auto-commit mode to the given state. */
                setAutoCommit(autoCommit: boolean): void;

                /** Retrieves the current auto-commit mode for this Connection object. */
                getAutoCommit(): boolean;

                /** Retrieves whether this Connection object has been closed. */
                isClosed(): boolean;

                /** Creates a Statement object for sending SQL statements to the database. */
                createStatement(): Statement;

                /** Creates a PreparedStatement object for sending parameterized SQL statements to the database. */
                prepareStatement(sql: java.lang.String): PreparedStatement;
            }

            /**
             * The interface that every driver class must implement.
             */
            interface Driver {
                /** Attempts to make a database connection to the given URL. */
                connect(url: java.lang.String, info: java.util.Properties): Connection;

                /** Retrieves whether the driver thinks that it can open a connection to the given URL. */
                acceptsURL(url: java.lang.String): boolean;
            }

            /**
             * An object used for executing a static SQL statement and returning the results it produces.
             */
            interface Statement {
                /** Executes the given SQL statement, which returns a single ResultSet object. */
                executeQuery(sql: java.lang.String): ResultSet;

                /** Executes the given SQL statement, which may be an INSERT, UPDATE, or DELETE statement. */
                executeUpdate(sql: java.lang.String): int;

                /** Releases this Statement object's database and JDBC resources immediately. */
                close(): void;
            }

            /**
             * An object that represents a precompiled SQL statement.
             */
            interface PreparedStatement extends Statement {
                /** Sets the designated parameter to the given Java object. */
                setObject(parameterIndex: int, x: java.lang.Object): void;

                /** Executes the SQL query in this PreparedStatement object and returns the ResultSet object generated by the query. */
                executeQuery(): ResultSet;

                /** Executes the SQL statement in this PreparedStatement object. */
                executeUpdate(): int;
            }

            /**
             * A table of data representing a database result set.
             */
            interface ResultSet {
                /** Moves the cursor forward one row from its current position. */
                next(): boolean;

                /** Retrieves the value of the designated column as a String. */
                getString(columnLabel: java.lang.String): java.lang.String;

                getString(columnIndex: int): java.lang.String;

                /** Retrieves the value of the designated column as an int. */
                getInt(columnLabel: java.lang.String): int;

                getInt(columnIndex: int): int;

                /** Retrieves the value of the designated column as an Object. */
                getObject(columnLabel: java.lang.String): java.lang.Object;

                getObject(columnIndex: int): java.lang.Object;

                /** Releases this ResultSet object's database and JDBC resources immediately. */
                close(): void;
            }

            /**
             * An exception that provides information on a database access error or other errors.
             */
            class SQLException extends java.lang.Exception {
                constructor();
                constructor(reason: java.lang.String);
                constructor(reason: java.lang.String, sqlState: java.lang.String);
                constructor(reason: java.lang.String, sqlState: java.lang.String, vendorCode: int);
                constructor(cause: java.lang.Throwable);
            }
        }

        namespace sql {
            namespace rowset {
                /**
                 * The interface that all implementations of CachedRowSet must implement.
                 * A CachedRowSet object is a container for rows of data that caches its rows in memory.
                 */
                interface CachedRowSet extends java.sql.ResultSet {
                    /** Moves the cursor to the given row number in this ResultSet object. */
                    absolute(row: int): boolean;

                    /** Moves the cursor to the first row in this ResultSet object. */
                    first(): boolean;

                    /** Moves the cursor to the last row in this ResultSet object. */
                    last(): boolean;

                    /** Moves the cursor to the front of this ResultSet object, just before the first row. */
                    beforeFirst(): void;

                    /** Moves the cursor to the end of this ResultSet object, just after the last row. */
                    afterLast(): void;

                    /** Retrieves the number of rows in this CachedRowSet object. */
                    size(): int;
                }
            }
        }
    }

    namespace javax {
        namespace sql {
            namespace rowset {
                /**
                 * A CachedRowSet object is a container for rows of data that caches its rows in memory.
                 * Alias for java.sql.rowset.CachedRowSet.
                 */
                interface CachedRowSet extends java.sql.rowset.CachedRowSet {
                }
            }
        }
    }

    namespace org {
        namespace dcm4che2 {
            namespace data {
                /**
                 * Represents a DICOM object from the dcm4che library.
                 * Used for reading and manipulating DICOM data.
                 */
                interface DicomObject {
                    // DICOM object methods - implementation from dcm4che2 library
                    // Used by DICOMUtil for DICOM data manipulation
                }
            }
        }
    }

    namespace com {
        namespace mirth {
            namespace commons {
                namespace encryption {
                    /**
                     * Exception thrown when encryption or decryption fails.
                     */
                    class EncryptionException extends java.lang.Exception {
                        constructor();
                        constructor(message: java.lang.String);
                        constructor(cause: java.lang.Throwable);
                        constructor(message: java.lang.String, cause: java.lang.Throwable);
                    }
                }
            }

            namespace connect {
                namespace server {
                    namespace util {
                        namespace javascript {
                            /**
                             * Internal Mirth context factory for JavaScript execution.
                             * This is an internal class used by ContextFactory and DatabaseConnectionFactory.
                             */
                            interface MirthContextFactory {
                                // Internal implementation - not directly used by channel scripts
                            }
                        }
                    }

                    /**
                     * com.mirth.connect.server.userutil
                     *
                     * This package is included in the JavaScript scope on the server.
                     * Classes in this package are part of the supported User API for use in channels/scripts.
                     * Reference to any class in Mirth Connect outside of the userutil packages is unsupported.
                     */
                    namespace userutil {
                        /**
                         * Allows users to generate HL7 v2.x acknowledgments based on an inbound message,
                         * with a specified ACK code and custom text message.
                         *
                         * This class will not work as expected if the HL7 v2.x data type plugin is disabled or uninstalled.
                         *
                         * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html
                         */
                        class ACKGenerator extends java.lang.Object {
                            /**
                             * Instantiates a new ACKGenerator object.
                             * @deprecated
                             */
                            constructor();

                            /**
                             * Generates an HL7 v2.x acknowledgment.
                             * Assumes that the inbound message is proper ER7, and uses the default format "yyyyMMddHHmmss" for the MSH.7 message date/time.
                             *
                             * @param message - The inbound HL7 v2.x message to generate the ACK for.
                             * @param acknowledgementCode - The MSA.1 ACK code to use (e.g. AA, AR, AE).
                             * @param textMessage - The MSA.3 text message to use.
                             * @returns The generated HL7 v2.x acknowledgment.
                             * @throws Exception - If the acknowledgement could not be generated.
                             */
                            static generateAckResponse(message: java.lang.String, acknowledgementCode: java.lang.String, textMessage: java.lang.String): java.lang.String;

                            /**
                             * Generates an HL7 v2.x acknowledgment.
                             *
                             * @param message - The inbound HL7 v2.x message to generate the ACK for.
                             * @param isXML - If true, assumes the inbound message is formatted in XML, and the acknowledgment returned will also be XML.
                             * @param acknowledgementCode - The MSA.1 ACK code to use (e.g. AA, AR, AE).
                             * @param textMessage - The MSA.3 text message to use.
                             * @param dateFormat - The date/time format used to generate a timestamp for the MSH.7 message date/time (e.g. "yyyyMMddHHmmss").
                             * @param errorMessage - The ERR.1 error message to use. If left blank, an ERR segment will not be generated.
                             * @returns The generated HL7 v2.x acknowledgment.
                             * @throws Exception - If the acknowledgement could not be generated.
                             */
                            static generateAckResponse(message: java.lang.String, isXML: boolean, acknowledgementCode: java.lang.String, textMessage: java.lang.String, dateFormat: java.lang.String, errorMessage: java.lang.String): java.lang.String;

                            /**
                             * Generates an HL7 v2.x acknowledgment.
                             *
                             * @param message - The inbound HL7 v2.x message to generate the ACK for.
                             * @param dataType - If "XML", assumes the inbound message is formatted in XML, and the acknowledgment returned will also be XML.
                             * @param acknowledgementCode - The MSA.1 ACK code to use (e.g. AA, AR, AE).
                             * @param textMessage - The MSA.3 text message to use.
                             * @param dateFormat - The date/time format used to generate a timestamp for the MSH.7 message date/time (e.g. "yyyyMMddHHmmss").
                             * @param errorMessage - The ERR.1 error message to use. If left blank, an ERR segment will not be generated.
                             * @returns The generated HL7 v2.x acknowledgment.
                             * @throws Exception - If the acknowledgement could not be generated.
                             * @deprecated This method is deprecated and will soon be removed. Please use generateAckResponse(message, isXML, acknowledgementCode, textMessage, dateFormat, errorMessage) instead.
                             */
                            static generateAckResponse(message: java.lang.String, dataType: java.lang.String, acknowledgementCode: java.lang.String, textMessage: java.lang.String, dateFormat: java.lang.String, errorMessage: java.lang.String): java.lang.String;
                        }

                        /**
                         * Allows users to dispatch error events which can be alerted on.
                         */
                        class AlertSender extends java.lang.Object {
                            /**
                             * Instantiates a new AlertSender.
                             * @param channelId - The ID of the channel to associate dispatched alert events with.
                             */
                            constructor(channelId: java.lang.String);

                            /**
                             * Instantiates a new AlertSender.
                             * @param connectorMessage - The connector message to associate dispatched alert events with.
                             */
                            constructor(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage);

                            /**
                             * Dispatches an error event that can be alerted on.
                             * @param errorMessage - A custom error message to include with the error event.
                             */
                            sendAlert(errorMessage: java.lang.String): void;

                        }

                        /**
                         * Used to store and retrieve details about message attachments such as the ID, MIME type, and content.
                         */
                        class Attachment extends java.lang.Object {
                            /**
                             * Instantiates a new Attachment with no ID, content, or MIME type.
                             */
                            constructor();

                            /**
                             * Instantiates a new Attachment.
                             * @param id - The unique ID of the attachment.
                             * @param content - The content (byte array) to store for the attachment.
                             * @param type - The MIME type of the attachment.
                             */
                            constructor(id: java.lang.String, content: byte[], type: java.lang.String);

                            /**
                             * Instantiates a new Attachment with String data using UTF-8 charset encoding.
                             * @param id - The unique ID of the attachment.
                             * @param content - The string representation of the attachment content.
                             * @param type - The MIME type of the attachment.
                             * @throws UnsupportedEncodingException - If the named charset is not supported.
                             */
                            constructor(id: java.lang.String, content: java.lang.String, type: java.lang.String);

                            /**
                             * Instantiates a new Attachment with String data and a given charset encoding.
                             * @param id - The unique ID of the attachment.
                             * @param content - The string representation of the attachment content.
                             * @param charset - The charset encoding to convert the string to bytes with.
                             * @param type - The MIME type of the attachment.
                             * @throws UnsupportedEncodingException - If the named charset is not supported.
                             */
                            constructor(id: java.lang.String, content: java.lang.String, charset: java.lang.String, type: java.lang.String);

                            /**
                             * Returns the unique replacement token for the attachment.
                             * This token should replace the attachment content in the message string,
                             * and will be used to re-attach the attachment content in the outbound message
                             * before it is sent to a downstream system.
                             * @returns The unique replacement token for the attachment.
                             */
                            getAttachmentId(): java.lang.String;

                            /**
                             * Returns the content of the attachment as a byte array.
                             * @returns The content of the attachment as a byte array.
                             */
                            getContent(): byte[];

                            /**
                             * Returns the content of the attachment as a string, using UTF-8 encoding.
                             * @returns The content of the attachment as a string, using UTF-8 encoding.
                             * @throws UnsupportedEncodingException - If the named charset is not supported.
                             */
                            getContentString(): java.lang.String;

                            /**
                             * Returns the content of the attachment as a string, using the specified charset encoding.
                             * @param charset - The charset encoding to convert the content bytes to a string with.
                             * @returns The content of the attachment as a string, using the specified charset encoding.
                             * @throws UnsupportedEncodingException - If the named charset is not supported.
                             */
                            getContentString(charset: java.lang.String): java.lang.String;

                            /**
                             * Returns the unique ID for the attachment.
                             * @returns The unique ID for the attachment.
                             */
                            getId(): java.lang.String;

                            /**
                             * Returns the MIME type of the attachment.
                             * @returns The MIME type of the attachment.
                             */
                            getType(): java.lang.String;

                            /**
                             * Sets the content of the attachment.
                             * @param content - The content (byte array) to use for the attachment.
                             */
                            setContent(content: byte[]): void;

                            /**
                             * Sets the content of the attachment, using UTF-8 encoding.
                             * @param content - The string representation of the attachment content.
                             * @throws UnsupportedEncodingException - If the named charset is not supported.
                             */
                            setContentString(content: java.lang.String): void;

                            /**
                             * Sets the content of the attachment, using the specified charset encoding.
                             * @param content - The string representation of the attachment content.
                             * @param charset - The charset encoding to convert the string to bytes with.
                             * @throws UnsupportedEncodingException - If the named charset is not supported.
                             */
                            setContentString(content: java.lang.String, charset: java.lang.String): void;

                            /**
                             * Sets the unique ID for the attachment.
                             * @param id - The unique ID to use for the attachment.
                             */
                            setId(id: java.lang.String): void;

                            /**
                             * Sets the MIME type for the attachment.
                             * @param type - The MIME type to set for the attachment.
                             */
                            setType(type: java.lang.String): void;
                        }

                        /** Used to store and retrieve details about message attachments such as the name, contents, and MIME type. When using a variable to specify attachments, such as in an SMTP Sender or Web Service Sender, the variable must reference a list of AttachmentEntry objects. */
                        class AttachmentEntry extends java.lang.Object implements java.io.Serializable {
                            /** Instantiates a new AttachmentEntry with no name, content, or MIME type. */
                            constructor();
                            /**
                             * Instantiates a new AttachmentEntry that copies the name, content, and MIME type from a given AttachmentEntry object.
                             * @param {AttachmentEntry} attachment
                             */
                            constructor(attachment: AttachmentEntry);
                            /**
                             * Instantiates a new AttachmentEntry with a name, content, and a MIME type.
                             * @param {java.lang.String} name
                             * @param {java.lang.String} content
                             * @param {java.lang.String} mimeType
                             */
                            constructor(name: java.lang.String, content: java.lang.String, mimeType: java.lang.String);

                            /**
                             * Description copied from class: java.lang.Object
                             * Indicates whether some other object is "equal to" this one.
                             * The equals method implements an equivalence relation on non-null object references:
                             *
                             * It is reflexive: for any non-null reference value x, x.equals(x) should return true.
                             * It is symmetric: for any non-null reference values x and y, x.equals(y) should return true if and only if y.equals(x) returns true.
                             * It is transitive: for any non-null reference values x, y, and z, if x.equals(y) returns true and y.equals(z) returns true, then x.equals(z) should return true.
                             * It is consistent: for any non-null reference values x and y, multiple invocations of x.equals(y) consistently return true or consistently return false, provided no information used in equals comparisons on the objects is modified.
                             * For any non-null reference value x, x.equals(null) should return false.
                             * The equals method for class Object implements the most discriminating possible equivalence relation on objects; that is, for any non-null reference values x and y, this method returns true if and only if x and y refer to the same object (x == y has the value true).
                             *
                             * Note that it is generally necessary to override the hashCode method whenever this method is overridden, so as to maintain the general contract for the hashCode method, which states that equal objects must have equal hash codes.
                             * @param {java.lang.Object} obj
                             * @returns {boolean} - true if this object is the same as the obj argument; false otherwise.
                             */
                            equals(obj: java.lang.Object): boolean;

                            /**
                             * Returns the content of the attachment entry.
                             * @returns {java.lang.String} - The content of the attachment entry.
                             */
                            getContent(): java.lang.String;

                            /**
                             * Returns the MIME type of the attachment entry.
                             * @returns {java.lang.String} - The MIME type of the attachment entry.
                             */
                            getMimeType(): java.lang.String;

                            /**
                             * Returns the name of the attachment entry.
                             * @returns {java.lang.String} - The name of the attachment entry.
                             */
                            getName(): java.lang.String;

                            /**
                             * Sets the content of the attachment entry.
                             * @param {java.lang.String} content - The content of the attachment entry.
                             */
                            setContent(content: java.lang.String): void;

                            /**
                             * Sets the MIME type of the attachment entry.
                             * @param {java.lang.String} mimeType - The MIME type of the attachment entry.
                             */
                            setMimeType(mimeType: java.lang.String): void;

                            /**
                             * Sets the name of the attachment entry.
                             * @param {java.lang.String} name - The name of the attachment entry.
                             */
                            setName(name: java.lang.String): void;
                        }

                        /**
                         * Provides utility methods for creating, retrieving, and re-attaching message attachments.
                         */
                        class AttachmentUtil extends java.lang.Object {
                            /**
                             * Creates an Attachment and adds it to the provided list.
                             * @param attachments - The list of attachments to add to.
                             * @param content - The attachment content (must be a string or byte array).
                             * @param type - The MIME type of the attachment.
                             * @returns The attachment added to the list.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static addAttachment(attachments: java.util.List<Attachment>, content: java.lang.Object, type: java.lang.String): Attachment;
                            /**
                             * Creates an Attachment and adds it to the provided list.
                             * @param attachments - The list of attachments to add to.
                             * @param content - The attachment content (must be a string or byte array).
                             * @param type - The MIME type of the attachment.
                             * @param base64Encode - If true, the content of each attachment will first be Base64 encoded for convenience.
                             * @returns The attachment added to the list.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static addAttachment(attachments: java.util.List<Attachment>, content: java.lang.Object, type: java.lang.String, base64Encode: boolean): Attachment;

                            /**
                             * Creates an attachment associated with a given connector message, and inserts it into the database.
                             * @param connectorMessage - The connector message to be associated with the attachment.
                             * @param content - The attachment content (must be a string or byte array).
                             * @param type - The MIME type of the attachment.
                             * @returns The attachment that was created and inserted.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static createAttachment(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, content: java.lang.Object, type: java.lang.String): Attachment;
                            /**
                             * Creates an attachment associated with a given connector message, and inserts it into the database.
                             * @param connectorMessage - The connector message to be associated with the attachment.
                             * @param content - The attachment content (must be a string or byte array).
                             * @param type - The MIME type of the attachment.
                             * @param base64Encode - If true, the content of each attachment will first be Base64 encoded for convenience.
                             * @returns The attachment that was created and inserted.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static createAttachment(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, content: java.lang.Object, type: java.lang.String, base64Encode: boolean): Attachment;

                            /**
                             * Retrieves an attachment from the current channel/message ID.
                             * @param connectorMessage - The ConnectorMessage associated with this message, used to identify the channel/message ID.
                             * @param attachmentId - The ID of the attachment to retrieve.
                             * @returns The attachment associated with the given IDs, or null if none was found.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachment could not be retrieved.
                             */
                            static getMessageAttachment(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, attachmentId: java.lang.String): Attachment;
                            /**
                             * Retrieves an attachment from the current channel/message ID.
                             * @param connectorMessage - The ConnectorMessage associated with this message, used to identify the channel/message ID.
                             * @param attachmentId - The ID of the attachment to retrieve.
                             * @param base64Decode - If true, the content of each attachment will first be Base64 decoded for convenient use.
                             * @returns The attachment associated with the given IDs, or null if none was found.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachment could not be retrieved.
                             */
                            static getMessageAttachment(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, attachmentId: java.lang.String, base64Decode: boolean): Attachment;
                            /**
                             * Retrieves an attachment from a specific channel/message ID.
                             * @param channelId - The ID of the channel to retrieve the attachment from.
                             * @param messageId - The ID of the message to retrieve the attachment from.
                             * @param attachmentId - The ID of the attachment to retrieve.
                             * @returns The attachment associated with the given IDs, or null if none was found.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachment could not be retrieved.
                             */
                            static getMessageAttachment(channelId: java.lang.String, messageId: java.lang.Long, attachmentId: java.lang.String): Attachment;
                            /**
                             * Retrieves an attachment from a specific channel/message ID.
                             * @param channelId - The ID of the channel to retrieve the attachment from.
                             * @param messageId - The ID of the message to retrieve the attachment from.
                             * @param attachmentId - The ID of the attachment to retrieve.
                             * @param base64Decode - If true, the content of each attachment will first be Base64 decoded for convenient use.
                             * @returns The attachment associated with the given IDs, or null if none was found.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachment could not be retrieved.
                             */
                            static getMessageAttachment(channelId: java.lang.String, messageId: java.lang.Long, attachmentId: java.lang.String, base64Decode: boolean): Attachment;

                            /**
                             * Returns a List of attachment IDs associated with the current channel / message.
                             * @param connectorMessage - The ConnectorMessage associated with this message, used to identify the channel/message ID.
                             * @returns A List of attachment IDs associated with the current channel / message.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachment IDs could not be retrieved.
                             */
                            static getMessageAttachmentIds(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): java.util.List<java.lang.String>;
                            /**
                             * Returns a List of attachment IDs associated with the current channel / message.
                             * @param channelId - The ID of the channel the attachments are associated with.
                             * @param messageId - The ID of the message the attachments are associated with.
                             * @returns A List of attachment IDs associated with the current channel / message.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachment IDs could not be retrieved.
                             */
                            static getMessageAttachmentIds(channelId: java.lang.String, messageId: java.lang.Long): java.util.List<java.lang.String>;

                            /**
                             * Retrieves all attachments associated with a connector message.
                             * @param connectorMessage - The ConnectorMessage associated with this message, used to identify the channel/message ID.
                             * @returns A list of attachments associated with the connector message.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachments could not be retrieved.
                             */
                            static getMessageAttachments(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): java.util.List<Attachment>;
                            /**
                             * Retrieves all attachments associated with a connector message.
                             * @param connectorMessage - The ConnectorMessage associated with this message, used to identify the channel/message ID.
                             * @param base64Decode - If true, the content of each attachment will first be Base64 decoded for convenient use.
                             * @returns A list of attachments associated with the connector message.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachments could not be retrieved.
                             */
                            static getMessageAttachments(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, base64Decode: boolean): java.util.List<Attachment>;
                            /**
                             * Retrieves all attachments associated with a specific channel/message ID.
                             * @param channelId - The ID of the channel to retrieve the attachments from.
                             * @param messageId - The ID of the message to retrieve the attachments from.
                             * @returns A list of attachments associated with the channel/message ID.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachments could not be retrieved.
                             */
                            static getMessageAttachments(channelId: java.lang.String, messageId: java.lang.Long): java.util.List<Attachment>;
                            /**
                             * Retrieves all attachments associated with a specific channel/message ID.
                             * @param channelId - The ID of the channel to retrieve the attachments from.
                             * @param messageId - The ID of the message to retrieve the attachments from.
                             * @param base64Decode - If true, the content of each attachment will first be Base64 decoded for convenient use.
                             * @returns A list of attachments associated with the channel/message ID.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachments could not be retrieved.
                             */
                            static getMessageAttachments(channelId: java.lang.String, messageId: java.lang.Long, base64Decode: boolean): java.util.List<Attachment>;

                            /**
                             * Retrieves an attachment from an upstream channel that sent a message to the current channel.
                             * @param connectorMessage - The ConnectorMessage associated with this message. The channel ID and message ID will be retrieved from the source map.
                             * @returns A list of attachments associated with the source channel/message IDs.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachments could not be retrieved.
                             */
                            static getMessageAttachmentsFromSourceChannel(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): java.util.List<Attachment>;
                            /**
                             * Retrieves an attachment from an upstream channel that sent a message to the current channel.
                             * @param connectorMessage - The ConnectorMessage associated with this message. The channel ID and message ID will be retrieved from the source map.
                             * @param base64Decode - If true, the content of each attachment will first be Base64 decoded for convenient use.
                             * @returns A list of attachments associated with the source channel/message IDs.
                             * @throws com.mirth.connect.donkey.model.message.MessageSerializerException If the attachments could not be retrieved.
                             */
                            static getMessageAttachmentsFromSourceChannel(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, base64Decode: boolean): java.util.List<Attachment>;

                            /**
                             * Replaces any unique attachment tokens (e.g. "${ATTACH:id}") with the corresponding attachment content, and returns the full post-replacement message.
                             * @param connectorMessage - The ConnectorMessage associated with this message, used to identify the channel/message ID. The message string will be either the encoded or raw content.
                             * @returns The resulting message with all applicable attachment content re-inserted.
                             */
                            static reAttachMessage(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): java.lang.String;
                            /**
                             * Replaces any unique attachment tokens (e.g. "${ATTACH:id}") with the corresponding attachment content, and returns the full post-replacement message.
                             * @param raw - The raw message string to replace tokens from.
                             * @param connectorMessage - The ConnectorMessage associated with this message, used to identify the channel/message ID.
                             * @returns The resulting message with all applicable attachment content re-inserted.
                             */
                            static reAttachMessage(raw: java.lang.String, connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): java.lang.String;
                            /**
                             * Replaces any unique attachment tokens (e.g. "${ATTACH:id}") with the corresponding attachment content, and returns the full post-replacement message as a byte array.
                             * @param raw - The raw message string to replace tokens from.
                             * @param connectorMessage - The ConnectorMessage associated with this message, used to identify the channel/message ID.
                             * @param charsetEncoding - If binary mode is not used, the resulting byte array will be encoded using this charset.
                             * @param binary - If enabled, the raw data is assumed to be Base64 encoded. The resulting byte array will be the raw Base64 decoded bytes.
                             * @returns The resulting message as a byte array, with all applicable attachment content re-inserted.
                             */
                            static reAttachMessage(raw: java.lang.String, connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, charsetEncoding: java.lang.String, binary: boolean): byte[];
                            /**
                             * Replaces any unique attachment tokens (e.g. "${ATTACH:id}") with the corresponding attachment content, and returns the full post-replacement message as a byte array.
                             * @param raw - The raw message string to replace tokens from.
                             * @param connectorMessage - The ConnectorMessage associated with this message, used to identify the channel/message ID.
                             * @param charsetEncoding - If binary mode is not used, the resulting byte array will be encoded using this charset.
                             * @param binary - If enabled, the raw data is assumed to be Base64 encoded. The resulting byte array will be the raw Base64 decoded bytes.
                             * @param reattach - If true, attachment tokens will be replaced with the actual attachment content. Otherwise, local attachment tokens will be replaced only with the corresponding expanded tokens.
                             * @param localOnly - If true, only local attachment tokens will be replaced, and expanded tokens will be ignored.
                             * @returns The resulting message as a byte array, with all applicable attachment content re-inserted.
                             */
                            static reAttachMessage(raw: java.lang.String, connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, charsetEncoding: java.lang.String, binary: boolean, reattach: boolean, localOnly: boolean): byte[];

                            /**
                             * Updates an attachment associated with a given connector message.
                             * @param connectorMessage - The connector message to be associated with the attachment.
                             * @param attachment - The Attachment object to update.
                             * @returns The attachment that was updated.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static updateAttachment(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, attachment: Attachment): Attachment;
                            /**
                             * Updates an attachment associated with a given connector message.
                             * @param connectorMessage - The connector message to be associated with the attachment.
                             * @param attachment - The Attachment object to update.
                             * @param base64Encode - If true, the content of each attachment will first be Base64 encoded for convenience.
                             * @returns The attachment that was updated.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static updateAttachment(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, attachment: Attachment, base64Encode: boolean): Attachment;
                            /**
                             * Updates an attachment associated with a given connector message.
                             * @param connectorMessage - The connector message to be associated with the attachment.
                             * @param attachmentId - The unique ID of the attachment to update.
                             * @param content - The attachment content (must be a string or byte array).
                             * @param type - The MIME type of the attachment.
                             * @returns The attachment that was updated.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static updateAttachment(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, attachmentId: java.lang.String, content: java.lang.Object, type: java.lang.String): Attachment;
                            /**
                             * Updates an attachment associated with a given connector message.
                             * @param connectorMessage - The connector message to be associated with the attachment.
                             * @param attachmentId - The unique ID of the attachment to update.
                             * @param content - The attachment content (must be a string or byte array).
                             * @param type - The MIME type of the attachment.
                             * @param base64Encode - If true, the content of each attachment will first be Base64 encoded for convenience.
                             * @returns The attachment that was updated.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static updateAttachment(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, attachmentId: java.lang.String, content: java.lang.Object, type: java.lang.String, base64Encode: boolean): Attachment;
                            /**
                             * Updates an attachment associated with a given connector message.
                             * @param channelId - The ID of the channel the attachment is associated with.
                             * @param messageId - The ID of the message the attachment is associated with.
                             * @param attachment - The Attachment object to update.
                             * @returns The attachment that was updated.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static updateAttachment(channelId: java.lang.String, messageId: java.lang.Long, attachment: Attachment): Attachment;
                            /**
                             * Updates an attachment associated with a given connector message.
                             * @param channelId - The ID of the channel the attachment is associated with.
                             * @param messageId - The ID of the message the attachment is associated with.
                             * @param attachment - The Attachment object to update.
                             * @param base64Encode - If true, the content of each attachment will first be Base64 encoded for convenience.
                             * @returns The attachment that was updated.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static updateAttachment(channelId: java.lang.String, messageId: java.lang.Long, attachment: Attachment, base64Encode: boolean): Attachment;
                            /**
                             * Updates an attachment associated with a given connector message.
                             * @param channelId - The ID of the channel the attachment is associated with.
                             * @param messageId - The ID of the message the attachment is associated with.
                             * @param attachmentId - The unique ID of the attachment to update.
                             * @param content - The attachment content (must be a string or byte array).
                             * @param type - The MIME type of the attachment.
                             * @returns The attachment that was updated.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static updateAttachment(channelId: java.lang.String, messageId: java.lang.Long, attachmentId: java.lang.String, content: java.lang.Object, type: java.lang.String): Attachment;
                            /**
                             * Updates an attachment associated with a given connector message.
                             * @param channelId - The ID of the channel the attachment is associated with.
                             * @param messageId - The ID of the message the attachment is associated with.
                             * @param attachmentId - The unique ID of the attachment to update.
                             * @param content - The attachment content (must be a string or byte array).
                             * @param type - The MIME type of the attachment.
                             * @param base64Encode - If true, the content of each attachment will first be Base64 encoded for convenience.
                             * @returns The attachment that was updated.
                             * @throws com.mirth.connect.donkey.server.controllers.UnsupportedDataTypeException If the attachment content is not a String or byte array.
                             */
                            static updateAttachment(channelId: java.lang.String, messageId: java.lang.Long, attachmentId: java.lang.String, content: java.lang.Object, type: java.lang.String, base64Encode: boolean): Attachment;
                        }

                        /**
                         * A wrapper class for the channel map that checks against the source map in the get(key) method for legacy support.
                         */
                        class ChannelMap extends java.lang.Object implements java.util.Map<java.lang.String, java.lang.Object> {
                            /**
                             * Instantiates a new ChannelMap object.
                             * @param delegate - The underlying Map to reference for retrieving/setting data.
                             * @param sourceMap - The source map associated with the current connector message. This is used to check against in the get(key) method for legacy support.
                             */
                            constructor(delegate: java.util.Map<java.lang.String, java.lang.Object>, sourceMap: java.util.Map<java.lang.String, java.lang.Object>);

                            /**
                             * Removes all of the mappings from this map (optional operation).
                             * The map will be empty after this call returns.
                             */
                            clear(): void;

                            /**
                             * Returns true if this map contains a mapping for the specified key.
                             * @param key - Key whose presence in this map is to be tested.
                             * @returns true if this map contains a mapping for the specified key.
                             */
                            containsKey(key: java.lang.Object): boolean;

                            /**
                             * Returns true if this map maps one or more keys to the specified value.
                             * @param value - Value whose presence in this map is to be tested.
                             * @returns true if this map maps one or more keys to the specified value.
                             */
                            containsValue(value: java.lang.Object): boolean;

                            /**
                             * Returns a Set view of the mappings contained in this map.
                             * @returns A set view of the mappings contained in this map.
                             */
                            entrySet(): java.util.Set<java.util.Map.Entry<java.lang.String, java.lang.Object>>;

                            /**
                             * Indicates whether some other object is "equal to" this one.
                             * @param o - The reference object with which to compare.
                             * @returns true if this object is the same as the obj argument; false otherwise.
                             */
                            equals(o: java.lang.Object): boolean;

                            /**
                             * Returns the value to which the specified key is mapped, or null if this map contains no mapping for the key.
                             * If the channel map does not contain the key but the source map does, an error message is logged out notifying the user that the source map should be used instead.
                             * @param key - The key whose associated value is to be returned.
                             * @returns The value to which the specified key is mapped, or null if this map contains no mapping for the key.
                             */
                            get(key: java.lang.Object): java.lang.Object | null;

                            /**
                             * Returns a hash code value for the object.
                             * @returns A hash code value for this object.
                             */
                            hashCode(): int;

                            /**
                             * Returns true if this map contains no key-value mappings.
                             * @returns true if this map contains no key-value mappings.
                             */
                            isEmpty(): boolean;

                            /**
                             * Returns a Set view of the keys contained in this map.
                             * @returns A set view of the keys contained in this map.
                             */
                            keySet(): java.util.Set<java.lang.String>;

                            /**
                             * Associates the specified value with the specified key in this map (optional operation).
                             * @param key - Key with which the specified value is to be associated.
                             * @param value - Value to be associated with the specified key.
                             * @returns The previous value associated with key, or null if there was no mapping for key.
                             */
                            put(key: java.lang.String, value: java.lang.Object): java.lang.Object | null;

                            /**
                             * Copies all of the mappings from the specified map to this map (optional operation).
                             * @param m - Mappings to be stored in this map.
                             */
                            putAll(m: java.util.Map<java.lang.String, java.lang.Object>): void;

                            /**
                             * Removes the mapping for a key from this map if it is present (optional operation).
                             * @param key - Key whose mapping is to be removed from the map.
                             * @returns The previous value associated with key, or null if there was no mapping for key.
                             */
                            remove(key: java.lang.Object): java.lang.Object | null;

                            /**
                             * Returns the number of key-value mappings in this map.
                             * @returns The number of key-value mappings in this map.
                             */
                            size(): int;

                            /**
                             * Returns a Collection view of the values contained in this map.
                             * @returns A collection view of the values contained in this map.
                             */
                            values(): java.util.Collection<java.lang.Object>;
                        }

                        /**
                         * This utility class allows the user to query information from channels or to perform actions on channels.
                         */
                        class ChannelUtil extends java.lang.Object {
                            // Channel Name/ID Methods

                            /**
                             * Get all channel names.
                             * @returns A list of all channel names.
                             */
                            static getChannelNames(): java.util.List<java.lang.String>;

                            /**
                             * Get all channel IDs.
                             * @returns A list of all channel IDs.
                             */
                            static getChannelIds(): java.util.List<java.lang.String>;

                            /**
                             * Get the name for a channel.
                             * @param channelId - The channel id of the channel.
                             * @returns The channel name of the specified channel.
                             */
                            static getChannelName(channelId: java.lang.String): java.lang.String;

                            /**
                             * Get all deployed channel names.
                             * @returns A list of all deployed channel names.
                             */
                            static getDeployedChannelNames(): java.util.List<java.lang.String>;

                            /**
                             * Get all deployed channel IDs.
                             * @returns A list of all deployed channel IDs.
                             */
                            static getDeployedChannelIds(): java.util.List<java.lang.String>;

                            /**
                             * Get the name for a deployed channel.
                             * @param channelId - The channel id of the deployed channel.
                             * @returns The channel name of the specified channel.
                             */
                            static getDeployedChannelName(channelId: java.lang.String): java.lang.String;

                            /**
                             * Get the id for a deployed channel.
                             * @param channelName - The channel name of the deployed channel.
                             * @returns The channel ID of the specified channel.
                             */
                            static getDeployedChannelId(channelName: java.lang.String): java.lang.String;

                            // Channel State Methods

                            /**
                             * Get the current state of a channel.
                             * @param channelIdOrName - The channel id or current name of the channel.
                             * @returns The current DeployedState.
                             */
                            static getChannelState(channelIdOrName: java.lang.String): com.mirth.connect.donkey.model.channel.DeployedState;

                            /**
                             * Get the current state of a connector.
                             * @param channelIdOrName - The channel id or current name of the channel.
                             * @param metaDataId - The metadata id of the connector. Note that the source connector has a metadata id of 0.
                             * @returns The current connector state returned as the DeployedState enumerator.
                             */
                            static getConnectorState(channelIdOrName: java.lang.String, metaDataId: Number): com.mirth.connect.donkey.model.channel.DeployedState;

                            /**
                             * Check if a channel is currently deployed.
                             * @param channelIdOrName - The channel id or current name of the channel.
                             * @returns True if the channel is deployed, false if it is not.
                             */
                            static isChannelDeployed(channelIdOrName: java.lang.String): boolean;

                            // Channel Control Methods

                            /**
                             * Deploy a channel.
                             * @param channelIdOrName - The channel id or current name of the channel.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             */
                            static deployChannel(channelIdOrName: java.lang.String): java.util.concurrent.Future<void>;

                            /**
                             * Undeploy a channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             */
                            static undeployChannel(channelIdOrName: java.lang.String): java.util.concurrent.Future<void>;

                            /**
                             * Start a deployed channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             * @throws Exception - If the task cannot be scheduled for execution.
                             */
                            static startChannel(channelIdOrName: java.lang.String): java.util.concurrent.Future<void>;

                            /**
                             * Stop a deployed channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             * @throws Exception - If the task cannot be scheduled for execution.
                             */
                            static stopChannel(channelIdOrName: java.lang.String): java.util.concurrent.Future<void>;

                            /**
                             * Pause a deployed channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             * @throws Exception - If the task cannot be scheduled for execution.
                             */
                            static pauseChannel(channelIdOrName: java.lang.String): java.util.concurrent.Future<void>;

                            /**
                             * Resume a deployed channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             * @throws Exception - If the task cannot be scheduled for execution.
                             */
                            static resumeChannel(channelIdOrName: java.lang.String): java.util.concurrent.Future<void>;

                            /**
                             * Halt a deployed channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             * @throws Exception - If the task cannot be scheduled for execution.
                             */
                            static haltChannel(channelIdOrName: java.lang.String): java.util.concurrent.Future<void>;

                            // Connector Control Methods

                            /**
                             * Start a connector on a given channel.
                             * @param channelIdOrName - The channel id or current name of the channel.
                             * @param metaDataId - The metadata id of the connector. Note that the source connector has a metadata id of 0.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             * @throws Exception - If the task cannot be scheduled for execution.
                             */
                            static startConnector(channelIdOrName: java.lang.String, metaDataId: java.lang.Integer): java.util.concurrent.Future<void>;

                            /**
                             * Stop a connector on a given channel.
                             * @param channelIdOrName - The channel id or current name of the channel.
                             * @param metaDataId - The metadata id of the connector. Note that the source connector has a metadata id of 0.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             * @throws Exception - If the task cannot be scheduled for execution.
                             */
                            static stopConnector(channelIdOrName: java.lang.String, metaDataId: java.lang.Integer): java.util.concurrent.Future<void>;

                            // Statistics Methods

                            /**
                             * Get the received count statistic for a specific channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns The received count statistic as a Long for the specified channel.
                             */
                            static getReceivedCount(channelIdOrName: java.lang.String): java.lang.Long;

                            /**
                             * Get the received count statistic for a specific connector.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @param metaDataId - The metadata id of the connector. Note that the source connector has a metadata id of 0.
                             * @returns The received count statistic as a Long for the specified connector.
                             */
                            static getReceivedCount(channelIdOrName: java.lang.String, metaDataId: Number): java.lang.Long;

                            /**
                             * Get the filtered count statistic for a specific channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns The filtered count statistic as a Long for the specified channel.
                             */
                            static getFilteredCount(channelIdOrName: java.lang.String): java.lang.Long;

                            /**
                             * Get the filtered count statistic for a specific connector.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @param metaDataId - The metadata id of the connector. Note that the source connector has a metadata id of 0.
                             * @returns The filtered count statistic as a Long for the specified connector.
                             */
                            static getFilteredCount(channelIdOrName: java.lang.String, metaDataId: Number): java.lang.Long;

                            /**
                             * Get the queued count statistic for a specific channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns The queued count statistic as a Long for the specified channel.
                             */
                            static getQueuedCount(channelIdOrName: java.lang.String): java.lang.Long;

                            /**
                             * Get the queued count statistic for a specific connector.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @param metaDataId - The metadata id of the connector. Note that the source connector has a metadata id of 0.
                             * @returns The queued count statistic as a Long for the specified connector.
                             */
                            static getQueuedCount(channelIdOrName: java.lang.String, metaDataId: Number): java.lang.Long;

                            /**
                             * Get the sent count statistic for a specific channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns The sent count statistic as a Long for the specified channel.
                             */
                            static getSentCount(channelIdOrName: java.lang.String): java.lang.Long;

                            /**
                             * Get the sent count statistic for a specific connector.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @param metaDataId - The metadata id of the connector. Note that the source connector has a metadata id of 0.
                             * @returns The sent count statistic as a Long for the specified connector.
                             */
                            static getSentCount(channelIdOrName: java.lang.String, metaDataId: Number): java.lang.Long;

                            /**
                             * Get the error count statistic for a specific channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns The error count statistic as a Long for the specified channel.
                             */
                            static getErrorCount(channelIdOrName: java.lang.String): java.lang.Long;

                            /**
                             * Get the error count statistic for a specific connector.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @param metaDataId - The metadata id of the connector. Note that the source connector has a metadata id of 0.
                             * @returns The error count statistic as a Long for the specified connector.
                             */
                            static getErrorCount(channelIdOrName: java.lang.String, metaDataId: Number): java.lang.Long;

                            /**
                             * Reset all statistics for a specific channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             * @throws Exception - If the task cannot be scheduled for execution.
                             */
                            static resetStatistics(channelIdOrName: java.lang.String): java.util.concurrent.Future<void>;

                            /**
                             * Reset all statistics for the specified connector on the given channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @param metaDataId - The metadata id of the deployed connector. Note that the source connector has a metadata id of 0 and the aggregate of null.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             * @throws Exception - If the task cannot be scheduled for execution.
                             */
                            static resetStatistics(channelIdOrName: java.lang.String, metaDataId: java.lang.Integer): java.util.concurrent.Future<void>;

                            /**
                             * Reset the specified statistics for the specified connector on the given channel.
                             * @param channelIdOrName - The channel id or current name of the deployed channel.
                             * @param metaDataId - The metadata id of the deployed connector. Note that the source connector has a metadata id of 0 and the aggregate of null.
                             * @param statuses - A collection of statuses to reset.
                             * @returns A Future object representing the result of the asynchronous operation. You can call get() or get(timeoutInMillis) to wait for the operation to finish.
                             * @throws Exception - If the task cannot be scheduled for execution.
                             */
                            static resetStatistics(channelIdOrName: java.lang.String, metaDataId: java.lang.Integer, statuses: java.util.Collection<com.mirth.connect.userutil.Status>): java.util.concurrent.Future<void>;
                        }

                        /**
                         * Allows the user to retrieve information about the current JavaScript context.
                         */
                        class ContextFactory extends java.lang.Object {
                            /**
                             * Instantiates a new ContextFactory object.
                             * @param delegate - The underlying ContextFactory this class will delegate to.
                             */
                            constructor(delegate: com.mirth.connect.server.util.javascript.MirthContextFactory);

                            /**
                             * Returns the set of custom resource IDs that the current JavaScript context is using.
                             * If no custom libraries are being used in the current JavaScript context, this will return an empty set.
                             * @returns The set of custom resource IDs that the current JavaScript context is using.
                             */
                            getResourceIds(): java.util.Set<java.lang.String>;

                            /**
                             * Returns the application classloader that the current JavaScript context is using.
                             * @returns The application classloader that the current JavaScript context is using.
                             */
                            getClassLoader(): java.lang.ClassLoader;

                            /**
                             * Returns a classloader containing only the libraries contained in the custom resources, with no parent classloader.
                             * If no custom libraries are being used in the current JavaScript context, this will return null.
                             * @returns A classloader containing only the libraries contained in the custom resources, with no parent classloader.
                             */
                            getIsolatedClassLoader(): java.lang.ClassLoader | null;
                        }

                        /**
                         * Provides the ability to run SQL queries against the database connection object instantiated using DatabaseConnectionFactory.
                         */
                        class DatabaseConnection extends java.lang.Object {
                            /**
                             * Instantiates a new database connection with the given server address.
                             * @param address - The server address to connect to.
                             * @throws SQLException - If a database access error occurs.
                             */
                            constructor(address: java.lang.String);

                            /**
                             * Instantiates a new database connection with the given server address and connection arguments.
                             * @param address - The server address to connect to.
                             * @param info - A Properties object containing all applicable connection arguments.
                             * @throws SQLException - If a database access error occurs.
                             */
                            constructor(address: java.lang.String, info: java.util.Properties);

                            /**
                             * Instantiates a new database connection with the given driver instance and server address.
                             * @param driver - The explicit driver instance to connect with.
                             * @param address - The server address to connect to.
                             * @throws SQLException - If a database access error occurs.
                             */
                            constructor(driver: java.sql.Driver, address: java.lang.String);

                            /**
                             * Instantiates a new database connection with the given driver instance, server address, and connection arguments.
                             * @param driver - The explicit driver instance to connect with.
                             * @param address - The server address to connect to.
                             * @param info - A Properties object containing all applicable connection arguments.
                             * @throws SQLException - If a database access error occurs.
                             */
                            constructor(driver: java.sql.Driver, address: java.lang.String, info: java.util.Properties);

                            /**
                             * Returns the server address.
                             * @returns The server address.
                             */
                            getAddress(): java.lang.String;

                            /**
                             * Returns the database connection (java.sql.Connection) this class is using.
                             * @returns The underlying java.sql.Connection object.
                             */
                            getConnection(): java.sql.Connection;

                            /**
                             * Executes a query on the database and returns a CachedRowSet.
                             * @param expression - The query expression to be executed.
                             * @returns The result of the query, as a CachedRowSet.
                             * @throws SQLException - If a database access error occurs.
                             */
                            executeCachedQuery(expression: java.lang.String): javax.sql.rowset.CachedRowSet;

                            /**
                             * Executes a prepared query on the database and returns a CachedRowSet.
                             * @param expression - The prepared statement to be executed.
                             * @param parameters - The parameters for the prepared statement.
                             * @returns The result of the query, as a CachedRowSet.
                             * @throws SQLException - If a database access error occurs.
                             */
                            executeCachedQuery(expression: java.lang.String, parameters: java.util.List<java.lang.Object>): javax.sql.rowset.CachedRowSet;

                            /**
                             * Executes an INSERT/UPDATE on the database and returns the row count.
                             * @param expression - The statement to be executed.
                             * @returns A count of the number of updated rows.
                             * @throws SQLException - If a database access error occurs.
                             */
                            executeUpdate(expression: java.lang.String): int;

                            /**
                             * Executes a prepared INSERT/UPDATE statement on the database and returns the row count.
                             * @param expression - The prepared statement to be executed.
                             * @param parameters - The parameters for the prepared statement.
                             * @returns A count of the number of updated rows.
                             * @throws SQLException - If a database access error occurs.
                             */
                            executeUpdate(expression: java.lang.String, parameters: java.util.List<java.lang.Object>): int;

                            /**
                             * Executes an INSERT/UPDATE statement on the database and returns a CachedRowSet containing any generated keys.
                             * @param expression - The statement to be executed.
                             * @returns A CachedRowSet containing any generated keys.
                             * @throws SQLException - If a database access error occurs.
                             */
                            executeUpdateAndGetGeneratedKeys(expression: java.lang.String): javax.sql.rowset.CachedRowSet;

                            /**
                             * Executes a prepared INSERT/UPDATE statement on the database and returns a CachedRowSet containing any generated keys.
                             * @param expression - The prepared statement to be executed.
                             * @param parameters - The parameters for the prepared statement.
                             * @returns A CachedRowSet containing any generated keys.
                             * @throws SQLException - If a database access error occurs.
                             */
                            executeUpdateAndGetGeneratedKeys(expression: java.lang.String, parameters: java.util.List<java.lang.Object>): javax.sql.rowset.CachedRowSet;

                            /**
                             * Closes the database connection.
                             */
                            close(): void;

                            /**
                             * Sets this connection's auto-commit mode to the given state.
                             * @param autoCommit - The value (true or false) to set the connection's auto-commit mode to.
                             * @throws SQLException - If a database access error occurs.
                             */
                            setAutoCommit(autoCommit: boolean): void;

                            /**
                             * Undoes all changes made in the current transaction and releases any database locks currently held by this Connection object.
                             * @throws SQLException - If a database access error occurs.
                             */
                            rollback(): void;

                            /**
                             * Makes all changes made since the previous commit/rollback permanent and releases any database locks currently held by this DatabaseConnection object.
                             * @throws SQLException - If a database access error occurs.
                             */
                            commit(): void;
                        }

                        /**
                         * Used to create database connection objects.
                         */
                        class DatabaseConnectionFactory extends java.lang.Object {
                            /**
                             * Instantiates a new DatabaseConnectionFactory object.
                             * @param contextFactory - The context factory to use.
                             */
                            constructor(contextFactory: com.mirth.connect.server.util.javascript.MirthContextFactory);

                            /**
                             * Instantiates and returns a new DatabaseConnection object with the given connection parameters.
                             * @param driver - The JDBC driver class (as a string) to use to create the connection with.
                             * @param address - The server address to connect to.
                             * @param username - The username to connect with.
                             * @param password - The password to connect with.
                             * @returns The created DatabaseConnection object.
                             * @throws SQLException - If a database access error occurs.
                             */
                            createDatabaseConnection(driver: java.lang.String, address: java.lang.String, username: java.lang.String, password: java.lang.String): DatabaseConnection;

                            /**
                             * Instantiates and returns a new DatabaseConnection object with the given connection parameters.
                             * @param driver - The JDBC driver class (as a string) to use to create the connection with.
                             * @param address - The server address to connect to.
                             * @returns The created DatabaseConnection object.
                             * @throws SQLException - If a database access error occurs.
                             */
                            createDatabaseConnection(driver: java.lang.String, address: java.lang.String): DatabaseConnection;

                            /**
                             * Instantiates and returns a new java.sql.Connection object with the given connection parameters.
                             * @param driver - The JDBC driver class (as a string) to use to create the connection with.
                             * @param address - The server address to connect to.
                             * @param username - The username to connect with.
                             * @param password - The password to connect with.
                             * @returns The created DatabaseConnection object.
                             * @throws SQLException - If a database access error occurs.
                             */
                            createConnection(driver: java.lang.String, address: java.lang.String, username: java.lang.String, password: java.lang.String): java.sql.Connection;

                            /**
                             * Initializes the specified JDBC driver.
                             * This can be used in JavaScript contexts where "Class.forName" can't be called directly.
                             * @param driver - The JDBC driver class (as a string) to initialize.
                             * @throws Exception - If the driver could not be initialized.
                             */
                            initializeDriver(driver: java.lang.String): void;
                        }

                        /**
                         * Provides date/time utility methods.
                         */
                        class DateUtil extends java.lang.Object {
                            /**
                             * Parses a date string according to the specified pattern and returns a java.util.Date object.
                             * @param pattern - The SimpleDateFormat pattern to use (e.g. "yyyyMMddHHmmss").
                             * @param date - The date string to parse.
                             * @returns A java.util.Date object representing the parsed date.
                             * @throws Exception - If the pattern could not be parsed.
                             */
                            static getDate(pattern: java.lang.String, date: java.lang.String): java.util.Date;

                            /**
                             * Formats a java.util.Date object into a string according to a specified pattern.
                             * @param pattern - The SimpleDateFormat pattern to use (e.g. "yyyyMMddHHmmss").
                             * @param date - The java.util.Date object to format.
                             * @returns The formatted date string.
                             */
                            static formatDate(pattern: java.lang.String, date: java.util.Date): java.lang.String;

                            /**
                             * Formats the current date into a string according to a specified pattern.
                             * @param pattern - The SimpleDateFormat pattern to use (e.g. "yyyyMMddHHmmss").
                             * @returns The current formatted date string.
                             */
                            static getCurrentDate(pattern: java.lang.String): java.lang.String;

                            /**
                             * Parses a date string according to a specified input pattern, and formats the date back to a string according to a specified output pattern.
                             * @param inPattern - The SimpleDateFormat pattern to use for parsing the inbound date string (e.g. "yyyyMMddHHmmss").
                             * @param outPattern - The SimpleDateFormat pattern to use for formatting the outbound date string (e.g. "yyyyMMddHHmmss").
                             * @param date - The date string to convert.
                             * @returns The converted date string.
                             * @throws Exception - If the pattern could not be parsed.
                             */
                            static convertDate(inPattern: java.lang.String, outPattern: java.lang.String, date: java.lang.String): java.lang.String;
                        }

                        /**
                         * DeployedState enum for server.userutil namespace.
                         * @see com.mirth.connect.donkey.model.channel.DeployedState
                         */
                        type DeployedState = com.mirth.connect.donkey.model.channel.DeployedState;
                        const DeployedState: typeof com.mirth.connect.donkey.model.channel.DeployedState;

                        /**
                         * Utility class used in the preprocessor or source filter/transformer to prevent the message from being sent to specific destinations.
                         */
                        class DestinationSet extends java.lang.Object {
                            /**
                             * DestinationSet instances should NOT be constructed manually.
                             * The instance "destinationSet" provided in the scope should be used.
                             * @param connectorMessage - The delegate ImmutableConnectorMessage object.
                             */
                            constructor(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage);

                            /**
                             * Stop a destination from being processed for this message.
                             * @param metaDataIdOrConnectorName - An integer representing the metaDataId of a destination connector, or the actual destination connector name.
                             * @returns A boolean indicating whether at least one destination connector was actually removed from processing for this message.
                             */
                            remove(metaDataIdOrConnectorName: java.lang.Object): boolean;

                            /**
                             * Stop a destination from being processed for this message.
                             * @param metaDataIdOrConnectorNames - A collection of integers representing the metaDataId of destination connectors, or the actual destination connector names. JavaScript arrays can be used.
                             * @returns A boolean indicating whether at least one destination connector was actually removed from processing for this message.
                             */
                            remove(metaDataIdOrConnectorNames: java.util.Collection<java.lang.Object>): boolean;

                            /**
                             * Stop all except one destination from being processed for this message.
                             * @param metaDataIdOrConnectorName - An integer representing the metaDataId of a destination connector, or the actual destination connector name.
                             * @returns A boolean indicating whether at least one destination connector was actually removed from processing for this message.
                             */
                            removeAllExcept(metaDataIdOrConnectorName: java.lang.Object): boolean;

                            /**
                             * Stop all except one destination from being processed for this message.
                             * @param metaDataIdOrConnectorNames - A collection of integers representing the metaDataId of destination connectors, or the actual destination connector names. JavaScript arrays can be used.
                             * @returns A boolean indicating whether at least one destination connector was actually removed from processing for this message.
                             */
                            removeAllExcept(metaDataIdOrConnectorNames: java.util.Collection<java.lang.Object>): boolean;

                            /**
                             * Stop all destinations from being processed for this message.
                             * This does NOT mark the source message as FILTERED.
                             * @returns A boolean indicating whether at least one destination connector was actually removed from processing for this message.
                             */
                            removeAll(): boolean;
                        }

                        /**
                         * Provides DICOM utility methods.
                         */
                        class DICOMUtil extends java.lang.Object {
                            /**
                             * Re-attaches DICOM attachments with the header data in the connector message and returns the resulting merged data as a Base64-encoded string.
                             * @param connectorMessage - The connector message to retrieve merged DICOM data for.
                             * @returns The merged DICOM data, Base64-encoded.
                             */
                            static getDICOMRawData(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): java.lang.String;

                            /**
                             * Re-attaches DICOM attachments with the header data in the connector message and returns the resulting merged data as a byte array.
                             * @param connectorMessage - The connector message to retrieve merged DICOM data for.
                             * @returns The merged DICOM data as a byte array.
                             */
                            static getDICOMRawBytes(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): byte[];

                            /**
                             * Re-attaches DICOM attachments with the header data in the connector message and returns the resulting merged data as a byte array.
                             * @param connectorMessage - The connector message to retrieve merged DICOM data for.
                             * @returns The merged DICOM data as a byte array.
                             */
                            static getDICOMMessage(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): byte[];

                            /**
                             * Re-attaches DICOM attachments with the header data in the connector message and returns the resulting merged data as a Base-64 encoded String.
                             * @param connectorMessage - The connector message containing header data to merge DICOM attachments with.
                             * @param attachments - The DICOM attachments to merge with the header data.
                             * @returns The merged DICOM data as a Base-64 encoded String.
                             * @throws MessageSerializerException - If a database access error occurs, or the DICOM data could not be parsed.
                             * @throws IOException - If Base64 encoding failed.
                             */
                            static mergeHeaderAttachments(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, attachments: java.util.List<Attachment>): java.lang.String;

                            /**
                             * Re-attaches DICOM attachments with the given header data and returns the resulting merged data as a Base-64 encoded String.
                             * @param header - The header data to merge DICOM attachments with.
                             * @param images - The DICOM attachments as byte arrays to merge with the header data.
                             * @returns The merged DICOM data as a Base-64 encoded String.
                             * @throws IOException - If Base64 encoding failed.
                             */
                            static mergeHeaderPixelData(header: byte[], images: java.util.List<byte[]>): java.lang.String;

                            /**
                             * Returns the number of slices in the fully-merged DICOM data associated with a given connector message.
                             * @param connectorMessage - The connector message to retrieve DICOM data for.
                             * @returns The number of slices in the DICOM data.
                             */
                            static getSliceCount(connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): int;

                            /**
                             * Converts merged DICOM data associated with a connector message into a specified image format.
                             * @param imageType - The image format to convert the DICOM data to (e.g. "jpg").
                             * @param connectorMessage - The connector message to retrieve merged DICOM data for.
                             * @returns The converted image, as a Base64-encoded string.
                             */
                            static convertDICOM(imageType: java.lang.String, connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): java.lang.String;

                            /**
                             * Converts merged DICOM data associated with a connector message into a specified image format.
                             * @param imageType - The image format to convert the DICOM data to (e.g. "jpg").
                             * @param connectorMessage - The connector message to retrieve merged DICOM data for.
                             * @param autoThreshold - If true, automatically sets the lower and upper threshold levels.
                             * @returns The converted image, as a Base64-encoded string.
                             */
                            static convertDICOM(imageType: java.lang.String, connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, autoThreshold: boolean): java.lang.String;

                            /**
                             * Converts merged DICOM data associated with a connector message into a specified image format.
                             * @param imageType - The image format to convert the DICOM data to (e.g. "jpg").
                             * @param connectorMessage - The connector message to retrieve merged DICOM data for.
                             * @param sliceIndex - If there are multiple slices in the DICOM data, this indicates which one to use (the first slice has an index of 1).
                             * @returns The converted image, as a Base64-encoded string.
                             */
                            static convertDICOM(imageType: java.lang.String, connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, sliceIndex: int): java.lang.String;

                            /**
                             * Converts merged DICOM data associated with a connector message into a specified image format.
                             * @param imageType - The image format to convert the DICOM data to (e.g. "jpg").
                             * @param connectorMessage - The connector message to retrieve merged DICOM data for.
                             * @param sliceIndex - If there are multiple slices in the DICOM data, this indicates which one to use (the first slice has an index of 1).
                             * @param autoThreshold - If true, automatically sets the lower and upper threshold levels.
                             * @returns The converted image, as a Base64-encoded string.
                             */
                            static convertDICOM(imageType: java.lang.String, connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, sliceIndex: int, autoThreshold: boolean): java.lang.String;

                            /**
                             * Converts merged DICOM data associated with a connector message into a specified image format.
                             * @param imageType - The image format to convert the DICOM data to (e.g. "jpg").
                             * @param connectorMessage - The connector message to retrieve merged DICOM data for.
                             * @returns The converted image, as a byte array.
                             */
                            static convertDICOMToByteArray(imageType: java.lang.String, connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage): byte[];

                            /**
                             * Converts merged DICOM data associated with a connector message into a specified image format.
                             * @param imageType - The image format to convert the DICOM data to (e.g. "jpg").
                             * @param connectorMessage - The connector message to retrieve merged DICOM data for.
                             * @param sliceIndex - If there are multiple slices in the DICOM data, this indicates which one to use (the first slice has an index of 1).
                             * @returns The converted image, as a byte array.
                             */
                            static convertDICOMToByteArray(imageType: java.lang.String, connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, sliceIndex: int): byte[];

                            /**
                             * Converts merged DICOM data associated with a connector message into a specified image format.
                             * @param imageType - The image format to convert the DICOM data to (e.g. "jpg").
                             * @param connectorMessage - The connector message to retrieve merged DICOM data for.
                             * @param sliceIndex - If there are multiple slices in the DICOM data, this indicates which one to use (the first slice has an index of 1).
                             * @param autoThreshold - If true, automatically sets the lower and upper threshold levels.
                             * @returns The converted image, as a byte array.
                             */
                            static convertDICOMToByteArray(imageType: java.lang.String, connectorMessage: com.mirth.connect.userutil.ImmutableConnectorMessage, sliceIndex: int, autoThreshold: boolean): byte[];

                            /**
                             * Converts a byte array into a dcm4che DicomObject.
                             * @param bytes - The binary data to convert.
                             * @param decodeBase64 - If true, the data is assumed to be Base64-encoded.
                             * @returns The converted DicomObject.
                             * @throws IOException - If Base64 encoding failed.
                             */
                            static byteArrayToDicomObject(bytes: byte[], decodeBase64: boolean): org.dcm4che2.data.DicomObject;

                            /**
                             * Converts a dcm4che DicomObject into a byte array.
                             * @param dicomObject - The DicomObject to convert.
                             * @returns The converted byte array.
                             * @throws IOException - If Base64 encoding failed.
                             */
                            static dicomObjectToByteArray(dicomObject: org.dcm4che2.data.DicomObject): byte[];
                        }

                        /**
                         * This object is returned from EncryptionUtil.encrypt(byte[]).
                         */
                        class EncryptedData extends java.lang.Object {
                            /**
                             * Instantiates a new EncryptedData object.
                             * @param header - The meta-information about the encrypted data.
                             * @param encryptedData - The encrypted data as a byte array.
                             */
                            constructor(header: java.lang.String, encryptedData: byte[]);

                            /**
                             * Returns the meta-information about the encrypted data.
                             * Includes the algorithm and initialization vector used.
                             * @returns The header containing meta-information about the encrypted data.
                             */
                            getHeader(): java.lang.String;

                            /**
                             * Returns the encrypted data as a byte array.
                             * @returns The encrypted data as a byte array.
                             */
                            getEncryptedData(): byte[];
                        }

                        /**
                         * This utility class provides some convenience methods for encrypting or decrypting data.
                         */
                        class EncryptionUtil extends java.lang.Object {
                            constructor();

                            /**
                             * Convenience method for encrypting data. Uses the currently configured encryption settings.
                             * @param data - The data to encrypt, as a String.
                             * @returns The encrypted data.
                             * @throws EncryptionException - If the data cannot be encrypted for any reason.
                             */
                            static encrypt(data: java.lang.String): java.lang.String;

                            /**
                             * Convenience method for encrypting data. Uses the currently configured encryption settings.
                             * @param data - The data to encrypt, as a raw byte array.
                             * @returns An EncryptedData object containing the header information and encrypted data.
                             * @throws EncryptionException - If the data cannot be encrypted for any reason.
                             */
                            static encrypt(data: byte[]): EncryptedData;

                            /**
                             * Convenience method for decrypting data. Uses the currently configured encryption and fallback settings.
                             * @param data - The data to decrypt, as a String.
                             * @returns The decrypted data.
                             * @throws EncryptionException - If the data cannot be decrypted for any reason.
                             */
                            static decrypt(data: java.lang.String): java.lang.String;

                            /**
                             * Convenience method for decrypting data. Uses the currently configured encryption and fallback settings.
                             * @param header - The meta-information about the encrypted data. This is a specially-formatted string returned from the encrypt(byte[]) method.
                             * @param data - The data to decrypt, as a raw byte array.
                             * @returns The decrypted data.
                             * @throws EncryptionException - If the data cannot be decrypted for any reason.
                             */
                            static decrypt(header: java.lang.String, data: byte[]): byte[];
                        }

                        /**
                         * Provides file utility methods.
                         * @see FileUtils
                         */
                        class FileUtil extends java.lang.Object {
                            /**
                             * Writes a string to a specified file, creating the file if it does not exist.
                             * @param fileName - The pathname string of the file to write to.
                             * @param append - If true, the data will be added to the end of the file rather than overwriting the file.
                             * @param data - The content to write to the file.
                             * @throws IOException - If an I/O error occurred.
                             */
                            static write(fileName: java.lang.String, append: boolean, data: java.lang.String): void;

                            /**
                             * Writes a byte array to a file, creating the file if it does not exist.
                             * @param fileName - The pathname string of the file to write to.
                             * @param append - If true, the data will be added to the end of the file rather than overwriting the file.
                             * @param bytes - The binary content to write to the file.
                             * @throws IOException - If an I/O error occurred.
                             */
                            static write(fileName: java.lang.String, append: boolean, bytes: byte[]): void;

                            /**
                             * Returns the contents of the file as a string, using the system default charset encoding.
                             * @param fileName - The pathname string of the file to read from.
                             * @returns The string representation of the file.
                             * @throws IOException - If an I/O error occurred.
                             */
                            static read(fileName: java.lang.String): java.lang.String;

                            /**
                             * Returns the contents of the file as a byte array.
                             * @param fileName - The pathname string of the file to read from.
                             * @returns The byte array representation of the file.
                             * @throws IOException - If an I/O error occurred.
                             */
                            static readBytes(fileName: java.lang.String): byte[];

                            /**
                             * Decodes a Base64 string into octets.
                             * @param data - The Base64 string to decode.
                             * @returns The decoded data, as a byte array.
                             */
                            static decode(data: java.lang.String): byte[];

                            /**
                             * Encodes binary data into a Base64 string.
                             * @param data - The binary data to encode (byte array).
                             * @returns The encoded Base64 string.
                             */
                            static encode(data: byte[]): java.lang.String;

                            /**
                             * Deletes a specified File.
                             * In Rhino and E4X 'delete' is a keyword, so File.delete() can't be called within Mirth directly.
                             * @param file - The File to delete.
                             * @returns true if and only if the file or directory is successfully deleted; false otherwise.
                             * @throws SecurityException - If the security manager denies access to delete the file.
                             */
                            static deleteFile(file: java.io.File): boolean;

                            /**
                             * Converts an RTF into plain text using the Swing RTFEditorKit.
                             * @param message - The RTF message to convert.
                             * @param replaceLinebreaksWith - If not null, any line breaks in the converted message will be replaced with this string.
                             * @returns The converted plain text message.
                             * @throws IOException - If an I/O error occurred.
                             * @throws BadLocationException - If an invalid location within the document is used.
                             */
                            static rtfToPlainText(message: java.lang.String, replaceLinebreaksWith: java.lang.String | null): java.lang.String;
                        }

                        /**
                         * A Future represents the result of an asynchronous computation.
                         * Methods are provided to check if the computation is complete, to wait for its completion,
                         * and to retrieve the result of the computation.
                         */
                        class Future<V> extends java.lang.Object implements java.util.concurrent.Future<V> {
                            /**
                             * Attempts to cancel execution of this task.
                             * This attempt will fail if the task has already completed, has already been cancelled,
                             * or could not be cancelled for some other reason.
                             * @param mayInterruptIfRunning - true if the thread executing this task should be interrupted; otherwise, in-progress tasks are allowed to complete.
                             * @returns false if the task could not be cancelled, typically because it has already completed normally; true otherwise.
                             */
                            cancel(mayInterruptIfRunning: boolean): boolean;

                            /**
                             * Returns true if this task was cancelled before it completed normally.
                             * @returns true if this task was cancelled before it completed.
                             */
                            isCancelled(): boolean;

                            /**
                             * Returns true if this task completed.
                             * Completion may be due to normal termination, an exception, or cancellation.
                             * @returns true if this task completed.
                             */
                            isDone(): boolean;

                            /**
                             * Waits if necessary for the computation to complete, and then retrieves its result.
                             * @returns The computed result.
                             * @throws CancellationException - If the computation was cancelled.
                             * @throws ExecutionException - If the computation threw an exception.
                             * @throws InterruptedException - If the current thread was interrupted while waiting.
                             */
                            get(): V;

                            /**
                             * Waits if necessary for at most the given time for the computation to complete, and then retrieves its result, if available.
                             * @param timeoutInMillis - The maximum time to wait, in milliseconds.
                             * @returns The computed result.
                             * @throws CancellationException - If the computation was cancelled.
                             * @throws ExecutionException - If the computation threw an exception.
                             * @throws InterruptedException - If the current thread was interrupted while waiting.
                             * @throws TimeoutException - If the wait timed out.
                             */
                            get(timeoutInMillis: long): V;

                            /**
                             * Waits if necessary for at most the given time for the computation to complete, and then retrieves its result, if available.
                             * @param timeout - The maximum time to wait.
                             * @param unit - The time unit of the timeout argument.
                             * @returns The computed result.
                             * @throws CancellationException - If the computation was cancelled.
                             * @throws ExecutionException - If the computation threw an exception.
                             * @throws InterruptedException - If the current thread was interrupted while waiting.
                             * @throws TimeoutException - If the wait timed out.
                             */
                            get(timeout: long, unit: java.util.concurrent.TimeUnit): V;
                        }

                        /**
                         * Provides hash utility methods.
                         */
                        class HashUtil extends java.lang.Object {
                            /**
                             * Takes in any object and generates a SHA-256 hex hash.
                             * @param data - The data to hash.
                             * @returns The generated SHA-256 hex hash of the data.
                             * @throws Exception - If generating a SHA-256 hex hash fails.
                             */
                            static generate(data: java.lang.Object): java.lang.String;

                            /**
                             * Takes in a string, an encoding, and a hashing algorithm and generates a hex hash.
                             * @param str - The string to hash.
                             * @param encoding - The character encoding to use.
                             * @param algorithm - The hashing algorithm to use.
                             * @returns The generated hex hash of the string.
                             * @throws Exception - If generating a hex hash of the string fails.
                             */
                            static generate(str: java.lang.String, encoding: java.lang.String, algorithm: java.lang.String): java.lang.String;

                            /**
                             * Takes in a byte[], an encoding, and a hashing algorithm and generates a hex hash.
                             * @param bytes - The byte[] to hash.
                             * @param algorithm - The hashing algorithm to use.
                             * @returns The generated hex hash of the byte[].
                             * @throws Exception - If generating a hex hash of the byte[] fails.
                             */
                            static generate(bytes: byte[], algorithm: java.lang.String): java.lang.String;
                        }

                        /**
                         * Provides HTTP utility methods.
                         */
                        class HTTPUtil extends java.lang.Object {
                            /**
                             * Converts a block of HTTP header fields into a Map containing each header key and value.
                             * @param str - The block of HTTP header fields to convert.
                             * @returns The converted Map containing header key-value pairs.
                             * @throws Exception - If the header string could not be parsed.
                             */
                            static parseHeaders(str: java.lang.String): java.util.Map<java.lang.String, java.lang.String>;

                            /**
                             * Serializes an HTTP request body into XML.
                             * Multipart requests will also automatically be parsed into separate XML nodes.
                             * @param httpBody - The request body/payload input stream to parse.
                             * @param contentType - The MIME content type of the request.
                             * @returns The serialized XML string.
                             * @throws MessagingException - If the body could not be converted into a multipart object.
                             * @throws IOException - If the body could not be read into a string.
                             * @throws DonkeyElementException - If an XML parsing error occurs.
                             * @throws ParserConfigurationException - If an XML or multipart parsing error occurs.
                             */
                            static httpBodyToXml(httpBody: java.io.InputStream, contentType: java.lang.String): java.lang.String;

                            /**
                             * Serializes an HTTP request body into XML.
                             * Multipart requests will also automatically be parsed into separate XML nodes.
                             * @param httpBody - The request body/payload string to parse.
                             * @param contentType - The MIME content type of the request.
                             * @returns The serialized XML string.
                             * @throws MessagingException - If the body could not be converted into a multipart object.
                             * @throws IOException - If the body could not be read into a string.
                             * @throws DonkeyElementException - If an XML parsing error occurs.
                             * @throws ParserConfigurationException - If an XML or multipart parsing error occurs.
                             */
                            static httpBodyToXml(httpBody: java.lang.String, contentType: java.lang.String): java.lang.String;
                        }

                        class RawMessage {
                            constructor(rawBytes: byte[]);
                            constructor(rawBytes: byte[], destinationMetaDataIds: java.util.Collection<Number>);
                            constructor(rawBytes: byte[], destinationMetaDataIds: java.util.Collection<Number>, sourceMap: java.util.Map<java.lang.String, java.lang.Object>);
                            constructor(rawData: java.lang.String);
                            constructor(rawData: java.lang.String, destinationMetaDataIds: java.util.Collection<Number>);
                            constructor(rawData: java.lang.String, destinationMetaDataIds: java.util.Collection<Number>, sourceMap: java.util.Map<java.lang.String, java.lang.Object>);

                            /** Removes references to any data (textual or binary) currently stored by the raw message. */
                            clearMessage(): void;

                            /** Deprecated. This method is deprecated and will soon be removed. Please use getSourceMap() instead. */
                            getChannelMap(): java.util.Map<java.lang.String, java.lang.Object>;

                            /** Returns the collection of integers (metadata IDs) representing which destinations to dispatch the message to. */
                            getDestinationMetaDataIds(): java.util.Collection<java.lang.Integer>;
                            /** Returns the collection of integers (metadata IDs) representing which destinations to dispatch the message to. */
                            getDestinationMetaDataIds(): java.util.Collection<java.lang.Integer>;

                            /** Returns the binary data (byte array) to be dispatched to a channel. */
                            getRawBytes(): byte[];

                            /** Returns the textual data to be dispatched to a channel. */
                            getRawData(): java.lang.String;

                            /** Returns the source map to be used at the beginning of the channel dispatch. */
                            getSourceMap(): java.util.Map<java.lang.String, java.lang.Object>;

                            /** Deprecated. This method is deprecated and will soon be removed. Please use setSourceMap(sourceMap) instead. */
                            setChannelMap(channelMap: java.util.Map<java.lang.String, java.lang.Object>): void;

                            /** Sets which destinations to dispatch the message to. */
                            setDestinationMetaDataIds(destinationMetaDataIds: java.util.Collection<Number>): void;

                            /** Sets the source map to be used at the beginning of the channel dispatch. */
                            setSourceMap(sourceMap: java.util.Map<java.lang.String, java.lang.Object>): void;
                        }

                        class ImmutableResponse {
                            constructor(status: any, errorMessage: any, statusMessage: any);

                            /** Returns the error string associated with this response, if it exists. */
                            getError(): java.lang.String;

                            /** Returns the actual response data, as a string. */
                            getMessage(): java.lang.String;

                            /** Returns the Status (e.g. */
                            getNewMessageStatus(): com.mirth.connect.userutil.Status;

                            /** Returns a brief message explaining the reason for the current status. */
                            getStatusMessage(): java.lang.String;

                            getStatus(): any;
                        }
                    }
                }
                namespace donkey {
                    namespace model {
                        namespace channel {
                            /**
                             * Denotes the deployed state of a channel or connector.
                             * States: UNDEPLOYED, DEPLOYING, UNDEPLOYING, STARTING, STARTED, PAUSING, PAUSED, STOPPING, STOPPED, SYNCING, UNKNOWN
                             */
                            enum DeployedState {
                                /** The channel/connector is not deployed. */
                                UNDEPLOYED,
                                /** The channel/connector is being deployed. */
                                DEPLOYING,
                                /** The channel/connector is being undeployed. */
                                UNDEPLOYING,
                                /** The channel/connector is starting. */
                                STARTING,
                                /** The channel/connector is deployed and started. */
                                STARTED,
                                /** The channel/connector is pausing. */
                                PAUSING,
                                /** The channel/connector is deployed but paused. */
                                PAUSED,
                                /** The channel/connector is stopping. */
                                STOPPING,
                                /** The channel/connector is deployed but stopped. */
                                STOPPED,
                                /** The channel/connector is syncing. */
                                SYNCING,
                                /** The channel/connector state is unknown. */
                                UNKNOWN
                            }

                            namespace DeployedState {
                                /**
                                 * Returns an array containing the constants of this enum type, in the order they are declared.
                                 * @returns An array containing the constants of this enum type, in the order they are declared.
                                 */
                                function values(): DeployedState[];

                                /**
                                 * Returns the enum constant of this type with the specified name.
                                 * The string must match exactly an identifier used to declare an enum constant in this type.
                                 * @param name - The name of the enum constant to be returned.
                                 * @returns The enum constant with the specified name.
                                 * @throws IllegalArgumentException - If this enum type has no constant with the specified name.
                                 * @throws NullPointerException - If the argument is null.
                                 */
                                function valueOf(name: java.lang.String): DeployedState;

                                /**
                                 * Returns the name of this enum constant, as contained in the declaration.
                                 * @returns The name of this enum constant.
                                 */
                                function toString(): string;
                            }
                        }

                        namespace message {
                            /** Exception thrown when message serialization fails. */
                            class MessageSerializerException extends java.lang.Exception {
                                constructor();
                                constructor(message: java.lang.String);
                                constructor(cause: java.lang.Throwable);
                                constructor(message: java.lang.String, cause: java.lang.Throwable);
                            }

                            /** Represents a connector message in the Donkey message model. */
                            class ConnectorMessage extends java.lang.Object {
                                // Internal Donkey message model - typically accessed through ImmutableConnectorMessage
                            }

                            /** Represents a message in the Donkey message model. */
                            class Message extends java.lang.Object {
                                // Internal Donkey message model - typically accessed through ImmutableMessage
                            }
                        }
                    }
                    namespace server {
                        namespace controllers {
                            /** Exception thrown when an unsupported data type is encountered. */
                            class UnsupportedDataTypeException extends java.lang.Exception {
                                constructor();
                                constructor(message: java.lang.String);
                                constructor(cause: java.lang.Throwable);
                                constructor(message: java.lang.String, cause: java.lang.Throwable);
                            }
                        }
                    }
                }

                namespace plugins {
                    namespace httpauth {
                        /**
                         * com.mirth.connect.plugins.httpauth.userutil
                         *
                         * This package is included in the JavaScript scope on the server.
                         * Classes in this package are part of the supported User API for use in channels/scripts.
                         * Reference to any class in Mirth Connect outside of the userutil packages is unsupported.
                         */
                        namespace userutil {
                            /**
                             * Denotes the result of an HTTP authentication attempt.
                             * Available statuses: CHALLENGED, SUCCESS, FAILURE
                             */
                            enum AuthStatus {
                                /** Indicates that the request should be rejected and an authentication challenge has been sent. */
                                CHALLENGED,
                                /** Indicates that the request should be accepted. */
                                SUCCESS,
                                /** Indicates that the request should be rejected without an authentication challenge. */
                                FAILURE
                            }

                            namespace AuthStatus {
                                /**
                                 * Returns an array containing the constants of this enum type, in the order they are declared.
                                 * @returns An array containing the constants of this enum type, in the order they are declared.
                                 */
                                function values(): AuthStatus[];

                                /**
                                 * Returns the enum constant of this type with the specified name.
                                 * The string must match exactly an identifier used to declare an enum constant in this type.
                                 * @param name - The name of the enum constant to be returned.
                                 * @returns The enum constant with the specified name.
                                 * @throws IllegalArgumentException - If this enum type has no constant with the specified name.
                                 * @throws NullPointerException - If the argument is null.
                                 */
                                function valueOf(name: java.lang.String): AuthStatus;
                            }

                            /**
                             * This class represents the result of an HTTP authentication attempt,
                             * used to accept or reject requests coming into HTTP-based source connectors.
                             */
                            class AuthenticationResult extends java.lang.Object {
                                /**
                                 * Instantiates a new AuthenticationResult object.
                                 * @param status - The accept/reject status to use.
                                 */
                                constructor(status: AuthStatus);

                                /**
                                 * Returns the accept/reject status of the authentication attempt.
                                 * @returns The accept/reject status of the authentication attempt.
                                 */
                                getStatus(): AuthStatus;

                                /**
                                 * Sets the accept/reject status of the authentication attempt.
                                 * @param status - The accept/reject status to use.
                                 */
                                setStatus(status: AuthStatus): void;

                                /**
                                 * Returns the username that the request has been authenticated with.
                                 * @returns The username that the request has been authenticated with.
                                 */
                                getUsername(): java.lang.String;

                                /**
                                 * Sets the username that the request has been authenticated with.
                                 * @param username - The username that the request has been authenticated with.
                                 */
                                setUsername(username: java.lang.String): void;

                                /**
                                 * Returns the realm that the request has been authenticated with.
                                 * @returns The realm that the request has been authenticated with.
                                 */
                                getRealm(): java.lang.String;

                                /**
                                 * Sets the realm that the request has been authenticated with.
                                 * @param realm - The realm that the request has been authenticated with.
                                 */
                                setRealm(realm: java.lang.String): void;

                                /**
                                 * Returns the map of HTTP headers to be sent along with the authentication response.
                                 * @returns The map of HTTP headers to be sent along with the authentication response.
                                 */
                                getResponseHeaders(): java.util.Map<java.lang.String, java.util.List<java.lang.String>>;

                                /**
                                 * Sets the map of HTTP headers to be sent along with the authentication response.
                                 * @param responseHeaders - The map of HTTP headers to be sent along with the authentication response.
                                 */
                                setResponseHeaders(responseHeaders: java.util.Map<java.lang.String, java.util.List<java.lang.String>>): void;

                                /**
                                 * Adds a new response header to be sent along with the authentication response.
                                 * @param key - The name of the header.
                                 * @param value - The value of the header.
                                 */
                                addResponseHeader(key: java.lang.String, value: java.lang.String): void;

                                /**
                                 * Convenience method to create a new AuthenticationResult with the CHALLENGED status.
                                 * @param authenticateHeader - The value to include in the WWW-Authenticate response header.
                                 * @returns The created AuthenticationResult object.
                                 */
                                static Challenged(authenticateHeader: java.lang.String): AuthenticationResult;

                                /**
                                 * Convenience method to create a new AuthenticationResult with the SUCCESS status.
                                 * @returns The created AuthenticationResult object.
                                 */
                                static Success(): AuthenticationResult;

                                /**
                                 * Convenience method to create a new AuthenticationResult with the SUCCESS status.
                                 * @param username - The username that the request has been authenticated with.
                                 * @param realm - The realm that the request has been authenticated with.
                                 * @returns The created AuthenticationResult object.
                                 */
                                static Success(username: java.lang.String, realm: java.lang.String): AuthenticationResult;

                                /**
                                 * Convenience method to create a new AuthenticationResult with the FAILURE status.
                                 * @returns The created AuthenticationResult object.
                                 */
                                static Failure(): AuthenticationResult;
                            }
                        }
                    }
                }

                /**
                 * com.mirth.connect.userutil
                 *
                 * This package is included in the JavaScript scope on both the client and the server.
                 * Classes in this package are part of the supported User API for use in channels/scripts.
                 * Reference to any class in Mirth Connect outside of the userutil packages is unsupported.
                 */
                namespace userutil {
                    /**
                     * Denotes various types of message status.
                     */
                    enum Status {
                        ERROR,
                        FILTERED,
                        PENDING,
                        QUEUED,
                        RECEIVED,
                        SENT,
                        TRANSFORMED,
                    }

                    namespace Status {
                        /**
                         * Returns an array containing the constants of this enum type.
                         * @returns An array containing the constants of this enum type.
                         */
                        function values(): Status[];

                        /**
                         * Returns the enum constant with the specified name.
                         * @param name - The name of the enum constant to be returned.
                         * @returns The enum constant with the specified name.
                         */
                        function valueOf(name: java.lang.String): Status;
                    }

                    /**
                     * Denotes various types of content created by a channel.
                     * Available types are: RAW, PROCESSED_RAW, TRANSFORMED, ENCODED, SENT, RESPONSE,
                     * RESPONSE_TRANSFORMED, PROCESSED_RESPONSE, CONNECTOR_MAP, CHANNEL_MAP, RESPONSE_MAP,
                     * PROCESSING_ERROR, POSTPROCESSOR_ERROR, RESPONSE_ERROR, SOURCE_MAP
                     */
                    enum ContentType {
                        RAW,
                        PROCESSED_RAW,
                        TRANSFORMED,
                        ENCODED,
                        SENT,
                        RESPONSE,
                        RESPONSE_TRANSFORMED,
                        PROCESSED_RESPONSE,
                        CONNECTOR_MAP,
                        CHANNEL_MAP,
                        RESPONSE_MAP,
                        PROCESSING_ERROR,
                        POSTPROCESSOR_ERROR,
                        RESPONSE_ERROR,
                        SOURCE_MAP,
                    }

                    namespace ContentType {
                        /**
                         * Returns an array containing the constants of this enum type, in the order they are declared.
                         * @returns An array containing the constants of this enum type, in the order they are declared.
                         */
                        function values(): ContentType[];

                        /**
                         * Returns the enum constant of this type with the specified name.
                         * The string must match exactly an identifier used to declare an enum constant in this type.
                         * @param name - The name of the enum constant to be returned.
                         * @returns The enum constant with the specified name.
                         * @throws IllegalArgumentException - If this enum type has no constant with the specified name.
                         * @throws NullPointerException - If the argument is null.
                         */
                        function valueOf(name: java.lang.String): ContentType;

                        /**
                         * Returns the name of this enum constant, as contained in the declaration.
                         * @returns The name of this enum constant.
                         */
                        function toString(): string;
                    }

                    /**
                     * This class represents a message attachment and is used to retrieve details such as the replacement token or content type.
                     */
                    class ImmutableAttachment extends java.lang.Object {
                        /**
                         * Instantiates a new ImmutableAttachment object.
                         * @param attachment - The Attachment object that this object will reference for retrieving data.
                         */
                        constructor(attachment: com.mirth.connect.donkey.model.message.attachment.Attachment);

                        /**
                         * Returns the unique replacement token for the attachment.
                         * This token should replace the attachment content in the message string,
                         * and will be used to re-attach the attachment content in the outbound message before it is sent to a downstream system.
                         * @returns The unique replacement token for the attachment.
                         */
                        getAttachmentId(): java.lang.String;

                        /**
                         * Returns the content of the attachment as a byte array.
                         * @returns The content of the attachment as a byte array.
                         */
                        getContent(): byte[];

                        /**
                         * Returns the unique ID for the attachment.
                         * @returns The unique ID for the attachment.
                         */
                        getId(): java.lang.String;

                        /**
                         * Returns the MIME type of the attachment.
                         * @returns The MIME type of the attachment.
                         */
                        getType(): java.lang.String;

                        /**
                         * Returns a boolean indicating whether the attachment content is encrypted.
                         * @returns A boolean indicating whether the attachment content is encrypted.
                         */
                        isEncrypted(): boolean;
                    }

                    /**
                     * This class represents an overall message and is used to retrieve details such as the message ID, specific connector messages, or the merged connector message.
                     */
                    class ImmutableMessage extends java.lang.Object {
                        /**
                         * Instantiates a new ImmutableMessage object.
                         * @param message - The Message object that this object will reference for retrieving data.
                         */
                        constructor(message: com.mirth.connect.donkey.model.message.Message);

                        /**
                         * Returns a list of attachments associated with this message.
                         * This will only be populated in certain cases, such as when a message is being exported or archived.
                         * @returns A list of attachments associated with this message.
                         */
                        getAttachments(): java.util.List<ImmutableAttachment>;

                        /**
                         * Returns the ID of the channel associated with this message.
                         * @returns The ID of the channel associated with this message.
                         */
                        getChannelId(): java.lang.String;

                        /**
                         * Returns a map of connector messages associated with this message.
                         * The keys are the metadata IDs (as Integer objects), and the values are the connector messages themselves.
                         * @returns A map of connector messages associated with this message.
                         */
                        getConnectorMessages(): java.util.Map<java.lang.Integer, ImmutableConnectorMessage>;

                        /**
                         * Returns a Map of destination connector names linked to their corresponding connector metadata ID.
                         * @returns A Map of destination connector names linked to their corresponding connector metadata ID.
                         */
                        getDestinationIdMap(): java.util.Map<java.lang.String, java.lang.Integer>;

                        /**
                         * Returns a Map of destination connector names linked to their corresponding "d#" response map keys.
                         * @returns A Map of destination connector names linked to their corresponding "d#" response map keys.
                         * @deprecated This method is deprecated and will soon be removed. Please use getDestinationIdMap() instead.
                         */
                        getDestinationNameMap(): java.util.Map<java.lang.String, java.lang.String>;

                        /**
                         * Returns the ID of the original channel this message was reprocessed from.
                         * @returns The ID of the original channel this message was reprocessed from.
                         */
                        getImportChannelId(): java.lang.String;

                        /**
                         * Returns the ID of the original message this one was imported from.
                         * @returns The ID of the original message this one was imported from.
                         */
                        getImportId(): java.lang.Long;

                        /**
                         * Returns a "merged" connector message containing data from all connector messages combined.
                         * The raw and processed raw content is copied from the source connector,
                         * while values in the channel and response maps are copied from all connectors.
                         * @returns A "merged" connector message containing data from all connector messages combined.
                         */
                        getMergedConnectorMessage(): ImmutableConnectorMessage;

                        /**
                         * Returns the sequential ID of this message, as a Long.
                         * @returns The sequential ID of this message, as a Long.
                         */
                        getMessageId(): java.lang.Long;

                        /**
                         * Returns the ID of the original message this one was reprocessed from.
                         * @returns The ID of the original message this one was reprocessed from.
                         */
                        getOriginalId(): java.lang.Long;

                        /**
                         * Returns the original date/time that this message was created by the channel.
                         * @returns The original date/time that this message was created by the channel.
                         * @deprecated This method is deprecated and will soon be removed. This method currently returns the received date of the source connector message.
                         */
                        getReceivedDate(): java.util.Calendar;

                        /**
                         * Returns the ID of the server associated with this message.
                         * @returns The ID of the server associated with this message.
                         */
                        getServerId(): java.lang.String;

                        /**
                         * Returns whether this message has finished processing through a channel.
                         * A message is considered "processed" if it correctly flows through each applicable connector
                         * and the postprocessor script finishes.
                         * @returns A boolean indicating whether this message has finished processing through a channel.
                         */
                        isProcessed(): boolean;

                        /**
                         * Returns a string representation of the object.
                         * @returns A string representation of the object.
                         */
                        toString(): string;
                    }

                    /**
                     * This class represents content associated with a connector message.
                     */
                    class ImmutableMessageContent extends java.lang.Object {
                        /**
                         * Instantiates a new ImmutableMessageContent object.
                         * @param messageContent - The MessageContent object that this object will reference for retrieving data.
                         */
                        constructor(messageContent: com.mirth.connect.donkey.model.message.MessageContent);

                        /**
                         * Returns the ContentType of this message content (e.g. RAW, ENCODED).
                         * @returns The ContentType of this message content.
                         */
                        getContentType(): ContentType;

                        /**
                         * Returns the actual content, as a string.
                         * @returns The actual content, as a string.
                         */
                        getContent(): java.lang.String;

                        /**
                         * Returns the sequential ID of the overall Message associated with this message content.
                         * @returns The sequential ID of the overall Message associated with this message content.
                         */
                        getMessageId(): long;

                        /**
                         * Returns the metadata ID of the connector associated with this message content.
                         * Note that the source connector has a metadata ID of 0.
                         * @returns The metadata ID of the connector associated with this message content.
                         */
                        getMetaDataId(): int;

                        /**
                         * Returns the data type (e.g. "HL7V2") of this message content.
                         * @returns The data type (e.g. "HL7V2") of this message content.
                         */
                        getDataType(): java.lang.String;
                    }

                    /** Represents a response from a connector. */
                    class Response extends java.lang.Object {
                        constructor();
                        constructor(status: Status, message: java.lang.String);
                        constructor(status: Status, message: java.lang.String, statusMessage: java.lang.String);
                        constructor(status: Status, message: java.lang.String, statusMessage: java.lang.String, error: java.lang.String);
                        constructor(response: Response);

                        /** Returns the error string associated with this response, if it exists. */
                        getError(): java.lang.String;

                        /** Returns the actual response data, as a string. */
                        getMessage(): java.lang.String;

                        /** Returns the Status (e.g. SENT, QUEUED, ERROR) of this response. */
                        getStatus(): Status;

                        /** Returns a brief message explaining the reason for the current status. */
                        getStatusMessage(): java.lang.String;

                        /** Sets the error string for this response. */
                        setError(error: java.lang.String): void;

                        /** Sets the response message. */
                        setMessage(message: java.lang.String): void;

                        /** Sets the status of this response. */
                        setStatus(status: Status): void;

                        /** Sets the status message for this response. */
                        setStatusMessage(statusMessage: java.lang.String): void;

                        /** Returns a string representation of the response. */
                        toString(): string;
                    }

                    /**
                     * This class represents a connector message and is used to retrieve details such as the message ID, metadata ID, status, and various content types.
                     */
                    class ImmutableConnectorMessage extends java.lang.Object {
                        /**
                         * Instantiates a new ImmutableConnectorMessage object.
                         * @param connectorMessage - The connector message that this object will reference for retrieving data.
                         */
                        constructor(connectorMessage: com.mirth.connect.donkey.model.message.ConnectorMessage);

                        /**
                         * Instantiates a new ImmutableConnectorMessage object.
                         * @param connectorMessage - The connector message that this object will reference for retrieving data.
                         * @param modifiableMaps - If true, variable maps (e.g. connector/channel/response) will be modifiable. Otherwise, data will only be able to be retrieved.
                         */
                        constructor(connectorMessage: com.mirth.connect.donkey.model.message.ConnectorMessage, modifiableMaps: boolean);

                        /**
                         * Instantiates a new ImmutableConnectorMessage object.
                         * @param connectorMessage - The connector message that this object will reference for retrieving data.
                         * @param modifiableMaps - If true, variable maps (e.g. connector/channel/response) will be modifiable. Otherwise, data will only be able to be retrieved.
                         * @param destinationIdMap - A map containing all applicable destination names in the channel and their corresponding connector metadata ids.
                         */
                        constructor(connectorMessage: com.mirth.connect.donkey.model.message.ConnectorMessage, modifiableMaps: boolean, destinationIdMap: java.util.Map<java.lang.String, java.lang.Integer>);

                        /**
                         * Returns the metadata ID of this connector message. Note that the source connector has a metadata ID of 0.
                         * @returns The metadata ID of this connector message.
                         */
                        getMetaDataId(): int;

                        /**
                         * Returns the ID of the channel associated with this connector message.
                         * @returns The ID of the channel associated with this connector message.
                         */
                        getChannelId(): java.lang.String;

                        /**
                         * Returns the Name of the channel associated with this connector message.
                         * @returns The Name of the channel associated with this connector message.
                         */
                        getChannelName(): java.lang.String;

                        /**
                         * Returns the name of the connector associated with this connector message.
                         * @returns The name of the connector associated with this connector message.
                         */
                        getConnectorName(): java.lang.String;

                        /**
                         * Returns the ID of the server associated with this connector message.
                         * @returns The ID of the server associated with this connector message.
                         */
                        getServerId(): java.lang.String;

                        /**
                         * Returns the date/time that this connector message was created by the channel.
                         * @returns The date/time that this connector message was created by the channel.
                         */
                        getReceivedDate(): java.util.Calendar;

                        /**
                         * Returns the number of times this message has been attempted to be dispatched by the connector.
                         * @returns The number of times this message has been attempted to be dispatched by the connector.
                         */
                        getSendAttempts(): int;

                        /**
                         * Returns the date/time immediately before this connector message's most recent send attempt.
                         * Only valid for destination connectors in the response transformer or postprocessor. Returns null otherwise.
                         * @returns The date/time immediately before this connector message's most recent send attempt.
                         */
                        getSendDate(): java.util.Calendar;

                        /**
                         * Returns the date/time immediately after this connector message's response is received.
                         * Only valid for destination connectors in the response transformer or postprocessor. Returns null otherwise.
                         * @returns The date/time immediately after this connector message's response is received.
                         */
                        getResponseDate(): java.util.Calendar;

                        /**
                         * Returns the status (e.g. SENT) of this connector message.
                         * @returns The status (e.g. SENT) of this connector message.
                         */
                        getStatus(): Status;

                        /**
                         * Retrieves content associated with this connector message.
                         * @param contentType - The ContentType (e.g. RAW, ENCODED) of the content to retrieve.
                         * @returns The content, as an ImmutableMessageContent object.
                         */
                        getMessageContent(contentType: ContentType): ImmutableMessageContent;

                        /**
                         * Retrieves content associated with this connector message.
                         * @param contentType - The ContentType (e.g. RAW, ENCODED) of the content to retrieve.
                         * @returns The content, as an ImmutableMessageContent object.
                         * @deprecated The getContent(contentType) method has been deprecated and will soon be removed. Please use getMessageContent(contentType) instead.
                         */
                        getContent(contentType: ContentType): ImmutableMessageContent;

                        /**
                         * Retrieves raw content associated with this connector message.
                         * @returns The raw content, as an ImmutableMessageContent object.
                         */
                        getRaw(): ImmutableMessageContent;

                        /**
                         * Retrieves raw content associated with this connector message.
                         * @returns The raw content, as a string.
                         */
                        getRawData(): java.lang.String;

                        /**
                         * Retrieves processed raw content associated with this connector message.
                         * @returns The processed raw content, as an ImmutableMessageContent object.
                         */
                        getProcessedRaw(): ImmutableMessageContent;

                        /**
                         * Retrieves processed raw content associated with this connector message.
                         * @returns The processed raw content, as a string.
                         */
                        getProcessedRawData(): java.lang.String;

                        /**
                         * Retrieves transformed content associated with this connector message.
                         * @returns The transformed content, as an ImmutableMessageContent object.
                         */
                        getTransformed(): ImmutableMessageContent;

                        /**
                         * Retrieves transformed content associated with this connector message.
                         * @returns The transformed content, as a string.
                         */
                        getTransformedData(): java.lang.String;

                        /**
                         * Retrieves encoded content associated with this connector message.
                         * @returns The encoded content, as an ImmutableMessageContent object.
                         */
                        getEncoded(): ImmutableMessageContent;

                        /**
                         * Retrieves encoded content associated with this connector message.
                         * @returns The encoded content, as a string.
                         */
                        getEncodedData(): java.lang.String;

                        /**
                         * Retrieves response content associated with this connector message.
                         * @returns The response content, as an ImmutableMessageContent object.
                         */
                        getResponse(): ImmutableMessageContent;

                        /**
                         * Retrieves response content associated with this connector message.
                         * @returns The response content, as a Response object.
                         */
                        getResponseData(): Response;

                        /**
                         * Retrieves transformed response content associated with this connector message.
                         * @returns The transformed response content, as an ImmutableMessageContent object.
                         */
                        getResponseTransformed(): ImmutableMessageContent;

                        /**
                         * Retrieves transformed response content associated with this connector message.
                         * @returns The transformed response content, as a string.
                         */
                        getResponseTransformedData(): java.lang.String;

                        /**
                         * Retrieves processed response content associated with this connector message.
                         * @returns The processed response content, as an ImmutableMessageContent object.
                         */
                        getProcessedResponse(): ImmutableMessageContent;

                        /**
                         * Retrieves processed response content associated with this connector message.
                         * @returns The processed response content, as a Response object.
                         */
                        getProcessedResponseData(): Response;

                        /**
                         * Returns the sequential ID of the overall Message associated with this connector message.
                         * @returns The sequential ID of the overall Message associated with this connector message.
                         */
                        getMessageId(): long;

                        /**
                         * Returns the source map. This map is unmodifiable and only data retrieval will be allowed.
                         * @returns The source map.
                         */
                        getSourceMap(): java.util.Map<java.lang.String, java.lang.Object>;

                        /**
                         * Returns the connector map.
                         * If this connector message was instantiated with a 'true' value for modifiableMaps, then this map will allow both data retrieval and updates.
                         * @returns The connector map.
                         */
                        getConnectorMap(): java.util.Map<java.lang.String, java.lang.Object>;

                        /**
                         * Returns the channel map.
                         * If this connector message was instantiated with a 'true' value for modifiableMaps, then this map will allow both data retrieval and updates.
                         * @returns The channel map.
                         */
                        getChannelMap(): java.util.Map<java.lang.String, java.lang.Object>;

                        /**
                         * Returns the response map.
                         * If this connector message was instantiated with a 'true' value for modifiableMaps, then this map will allow both data retrieval and updates.
                         * @returns The response map.
                         */
                        getResponseMap(): java.util.Map<java.lang.String, java.lang.Object>;

                        /**
                         * Returns the postprocessing error string associated with this connector message, if it exists.
                         * @returns The postprocessing error string associated with this connector message, if it exists.
                         */
                        getPostProcessorError(): java.lang.String;

                        /**
                         * Returns the processing error string associated with this connector message, if it exists.
                         * @returns The processing error string associated with this connector message, if it exists.
                         */
                        getProcessingError(): java.lang.String;

                        /**
                         * Returns the response error string associated with this connector message, if it exists.
                         * @returns The response error string associated with this connector message, if it exists.
                         */
                        getResponseError(): java.lang.String;

                        /**
                         * Returns a Map of destination connector names linked to their corresponding "d#" response map keys.
                         * @returns A Map of destination connector names linked to their corresponding "d#" response map keys.
                         * @deprecated This method is deprecated and will soon be removed. Please use getDestinationIdMap() instead.
                         */
                        getDestinationNameMap(): java.util.Map<java.lang.String, java.lang.String>;

                        /**
                         * Returns a Map of destination connector names linked to their corresponding connector metadata ID.
                         * @returns A Map of destination connector names linked to their corresponding connector metadata ID.
                         */
                        getDestinationIdMap(): java.util.Map<java.lang.String, java.lang.Integer>;

                        /**
                         * Returns a string representation of the object.
                         * @returns A string representation of the object.
                         */
                        toString(): string;
                    }

                }
            }
        }
    }
}

export {};
