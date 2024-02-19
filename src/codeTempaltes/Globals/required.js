/**
 * Check for required functions and libraries. This is very useful when you have a lot of code templates and you want to
 * make sure that all the required functions and libraries are available. No more cloning a channel and running it to see if
 * it works. This function will throw an error if a required function or library is missing.
 * Note: Uses the __hasBeenChecked__ global channel map variable to avoid checking multiple times.
 * @example
 * required(['$t', 'assert', 'fetch'])
 * @param {string[]} libs - The required functions and libraries.
 * @throws {Error} - If a required function or library is missing.
 */
function required(libs) {
    const ObjectXMLSerializer = com.mirth.connect.model.converters.ObjectXMLSerializer
    const ControllerFactory = com.mirth.connect.server.controllers.ControllerFactory
    const configurationController = ControllerFactory.getFactory().createConfigurationController()
    const config = configurationController.getServerConfiguration()
    const serializer = ObjectXMLSerializer.getInstance()

    const hasBeenChecked = $gc('hasBeenChecked')
    if (hasBeenChecked) {
        return
    }

    const found = []
    const missingLibs = []
    const foundMissing = []

    libs.forEach((lib) => {
        const isMissing = typeof this[lib] === 'undefined'
        if (isMissing) {
            missingLibs.push(lib)
        }
    })

    const xmlString = serializer.serialize(config).replace('&#x1a;', '')
    const xmlConfig = new XML(xmlString)
    const json = JSON.parse(XmlUtil.toJson(xmlConfig))

    let _codeTemplateLibrary = json.serverConfiguration.codeTemplateLibraries.codeTemplateLibrary
    _codeTemplateLibrary = Array.isArray(_codeTemplateLibrary) ? _codeTemplateLibrary : [_codeTemplateLibrary]
    _codeTemplateLibrary.forEach((codeTemplateLibrary) => {
        let _codeTemplate = codeTemplateLibrary.codeTemplates.codeTemplate
        _codeTemplate = Array.isArray(_codeTemplate) ? _codeTemplate : [_codeTemplate]
        _codeTemplate.forEach((codeTemplate) => {
            missingLibs.forEach((lib) => {
                if (codeTemplate.name.indexOf(lib) > -1) {
                    const hint = 'Are you missing code template library: "' + codeTemplateLibrary.name + '" for code template: "' + codeTemplate.name + '" for requirement: "' + lib + '"?'
                    found.push(hint)
                    foundMissing.push(lib)
                }
            })
        })
    })
    if (found.length > 0) {
        const notFound = missingLibs.filter((lib) => !(foundMissing.indexOf(lib) > -1))
        found.unshift('Missing libraries:')
        if (notFound.length > 0) {
            found.push('Requirements not found: ' + notFound.join(', '))
        }
        throw new Error(found.join('\t\n'))
    }
    $gc('__hasBeenChecked__', true)
}

/* global XmlUtil */
