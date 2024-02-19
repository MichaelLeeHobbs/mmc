/**
 * Combines two errors into a single error object. This function takes two errors,
 * extracts their messages, and creates a new Error object with a combined message.
 * Optionally, it also combines the stack traces of both errors for more detailed debugging information.
 *
 * @param {Error|*} error1 - The first error to combine. Can be an instance of Error or any type.
 * @param {Error|*} error2 - The second error to combine. Can be an instance of Error or any type.
 * @returns {Error} A new Error object with combined messages and stack traces of the input errors.
 */
function combineErrors(error1, error2) {
    // Extract messages from both errors
    let message1 = error1 instanceof Error ? error1.message : String(error1);
    let message2 = error2 instanceof Error ? error2.message : String(error2);

    // Combine the messages
    let combinedMessage = 'Error 1: ' + message1 + '\nError 2: ' + message2;

    // Create a new error with the combined message
    let combinedError = new Error(combinedMessage);

    // Optionally, you can add the stack traces or other properties
    combinedError.stack = 'Stack Trace 1:\n' + error1.stack + '\nStack Trace 2:\n' + error2.stack;

    return combinedError;
}
