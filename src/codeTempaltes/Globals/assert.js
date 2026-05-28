/**
 * Asserts that the given condition is true. If it is not, an error is thrown.
 * @param {*} condition - The condition to evaluate. This can be a boolean, a truthy value, or a function that returns a boolean.
 * @param {string} [message='Assertion failed'] - The message to display if the condition is false.
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed')
    }
}

/**
 * Asserts that the given condition is true. If it is not, an error is thrown.
 * @param {*} condition - The condition to evaluate. This can be a boolean, a truthy value, or a function that returns a boolean.
 * @param {string} [message='Assertion failed'] - The message to display if the condition is false.
 */
assert.ok = assert

/**
 * @typedef {Array} ConditionTuple
 * @property {any|function(): boolean} 0 - The condition to evaluate. This can be a boolean, a truthy value, or a function that returns a boolean.
 * @property {string} 1 - The message to display if the condition is false.
 */

/**
 * Asserts that each condition in the given array is true. If any are not, an error is thrown with a combined message of all failures.
 *
 * @param {Array.<ConditionTuple>} conditionsArray - An array of [condition, message] pairs.
 * The condition can be a boolean, a truthy value, or a function that returns a boolean or throws an error. A truthy value is any value that's not false, 0,
 * "", null, undefined, or NaN.
 *
 * Each condition in the array is a tuple where:
 * - The first element is either a boolean value, a truthy value, or a function that when called returns a boolean or throws an error.
 * - The second element is a string that represents the message associated with the condition.
 *
 * If any condition evaluates to false or the condition function throws an error, the associated message is included in the error thrown by this function.
 */
assert.array = function assertArray(conditionsArray) {
  const failedMessages = conditionsArray.reduce((messages, [condition, message]) => {
    let conditionResult;

    try {
      // Evaluate the condition if it's a function, or use the value directly if it's not
      conditionResult = typeof condition === 'function' ? condition() : condition;
    } catch (error) {
      // If the condition function throws, consider the condition as failed
      messages.push(message + ': ' + error.message);
      return messages;
    }

    // If the condition is false, add the message to the list of failed messages
    if (!conditionResult) {
      messages.push(message);
    }

    return messages;
  }, []);

  // If there are any failed messages, throw an error with a combined message
  if (failedMessages.length > 0) {
    throw new Error('Assertions failed:\n- ' + failedMessages.join('\n- '));
  }
}

/* exported assert */
