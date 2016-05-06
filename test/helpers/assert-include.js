var assert = require('assert');

assert.include = function(container, item, message) {
	assert.notEqual(container.indexOf(item), -1, message);
}
