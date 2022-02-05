/**
 * @see https://svn.wso2.org/repos/wso2/tags/carbon/0.1alpha/mashup/java/xdocs/e4xquickstart.html
 * @typedef {object} XML
 * @property {function(namespace: string)} addNamespace Adds the namespace to the in-scope namespaces of the element.
 * @property {function(child: XML)} appendChild Adds child as a new child of the element, after all other children.
 * @property {function(attributeName: string): string} attribute Returns the attribute of with the requested name.
 * @property {function(): [string]} attributes Returns the attributes of this element.
 * @property {function(propertyName: string): XML} child Returns the child element with the given propertyName, or if propertyName is an integer, returns the
 * child in that position.
 * @property {function(): number} childIndex Returns the index of this children among its siblings.
 * @property {function(): [XML]} children Returns all the children of this object.
 * @property {function(): [string]} comments Returns all the comments that are children of this XML object.
 * @property {function(value: *): boolean} contains Compares this element with the value, primarily provided to enable an XML element and an XML list to be used
 * interchangeably.
 * @property {function(): XML} copy Returns a deep copy of the element. The parent property of the copy will be set to null.
 * @property {function([name: string]): XML} descendants Returns the descendant elements (children, grandchildren, etc.). If a name is provided, only elements
 * with that name are returned.
 * @property {function([name: string]): XML} elements Returns the child elements. If a name is provided, only elements with that name are returned.
 * @property {function(): boolean} hasComplexContent Returns true for elements with child elements, otherwise false.
 * @property {function(): boolean} hasSimpleContent Returns true for attributes, text nodes, or elements without child elements, otherwise false.
 * @property {function(): [Object]} inScopeNamespaces Returns an array of Namespace objects representing the namespaces in scope for this object.
 * @property {function(child1: XML, child2: XML)} insertChildAfter Inserts child2 immediately after child1 in the XML object's children list.
 * @property {function(child1: XML, child2: XML)} insertChildBefore Inserts child2 immediately prior to child1 in the XML object's children list.
 * @property {function(): number} length Returns 1 for XML objects (allowing an XML object to be treated like an XML List with a single item.)
 * @property {function(): string} localName Returns the local name of this object.
 * @property {function(): string} name Returns the qualified name of this object.
 * @property {function([prefix: string]): string} namespace Returns the namespace associated with this object, or if a prefix is specified, an in-scope
 * namespace with that prefix.
 * @property {function(): [string]} namespaceDeclarations An array of Namespace objects representing the namespace declarations associated with this object.
 * @property {function(): string} nodeKind A string representing the kind of object this is (e.g. "element").
 * @property {function()} normalize Merge adjacent text nodes and eliminate empty ones.
 * @property {function(): XML} parent The parent of this object. For an XML List object, this returns undefined unless all the items of the list have the same
 * parent.
 * @property {function([name: string]): *} processingInstructions A list of all processing instructions that are children of this element. If a name is
 * provided, only processing instructions matching this name will be returned.
 * @property {function(value: string)} prependChild Add a new child to an element, prior to all other children.
 * @property {function(namespace: string)} removeNamespace Removes a namespace from the in-scope namespaces of the element.
 * @property {function(propertyName: string, value: XML)} replace Replace a child with a new one.
 * @property {function(value: XML)} setChildren Replace the children of the object with the value (typically an XML List).
 * @property {function(name: string)} setLocalName Sets the local name of the XML object to the requested value.
 * @property {function(name: string)} setName Sets the name of the XML object to the requested value (possibly qualified).
 * @property {function(ns: string)} setNamespace Sets the namespace of the XML object to the requested value.
 * @property {function(): string} text Concatenation of all text node children
 * @property {function(): string} toString For elements without element children, returns the values of the text node children. For elements with element
 * children, returns same as toXMLString. For other kinds of objects, the value of the object.
 * @property {function(): string} valueOf Returns this XML object.
 */
