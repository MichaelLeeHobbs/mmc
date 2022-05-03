/**
 * Retrieves the full Mirth config as XML with the backup date set to now
 * @return {[config: string, backupDate: string]}
 * @author Michael L. Hobbs {@link https://github.com/MichaelLeeHobbs}
 * @licence Apache License 2.0
 */
function getMirthConfig() {
    const SimpleDateFormat = java.text.SimpleDateFormat
    const JavaDate = java.util.Date
    const ObjectXMLSerializer = com.mirth.connect.model.converters.ObjectXMLSerializer
    const ControllerFactory = com.mirth.connect.server.controllers.ControllerFactory
    const configurationController = ControllerFactory.getFactory().createConfigurationController()
    const config = configurationController.getServerConfiguration()
    const backupDate = new SimpleDateFormat('yyyy-MM-dd HH:mm:ss').format(new JavaDate())
    config.setDate(backupDate)
    const serializer = ObjectXMLSerializer.getInstance()
    return [serializer.serialize(config), backupDate]
}

if (typeof module === 'object') {
    module.exports = getMirthConfig
}

// this is at the bottom, so we don't break the mirth description field
/* global Packages, FileUtil, java, com, ControllerFactory, */
