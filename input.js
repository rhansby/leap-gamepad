var mac_tapKey_init = (function() {
    var robot = require('robotjs');
    var ObjC = require('NodObjC');

    ObjC.framework('Cocoa');
    ObjC.framework('Foundation');

    //A mapping of character to Mac key codes
    var charMap = {
    	'2': 19,
    	'3': 20,
    	'4': 21,
    	'g': 5,
    	'p': 35
    };

    var keyMap = {};

    // Calling ObjC.CFRelease keeps crashing, so
    // we'll just cache all key events we create and reuse them
    // without ever freeing the memory
    return function(key) {
    	var code = charMap[key];

    	if (!code) {
    		throw new Error("Key code not defined for: " + key);
    	}

        var events = keyMap[code];

        if(!events) {
            events = {
                down: ObjC.CGEventCreateKeyboardEvent(null, code, true),
                up  : ObjC.CGEventCreateKeyboardEvent(null, code, false),
            };

            keyMap[code] = events;
        }

        ObjC.CGEventPost(ObjC.kCGHIDEventTap, events.down);
        ObjC.CGEventPost(ObjC.kCGHIDEventTap, events.up);
    }
});

function mac_moveMouse(dx, dy) {
	var mouse_pos = robot.getMousePos();
	robot.moveMouse(mouse_pos.x + dx, mouse_pos.y + dy);
}

(function() {
	var os = require('os');
	var platform = os.platform();

	//OSX
	if (platform === "darwin") {
	    module.exports.tapKey = mac_tapKey_init();
	    module.exports.leftClick = robot.mouseClick;
	    module.exports.moveMouse = mac_moveMouse;
	}
	//Windows
	else if (platform === "win32") {
		var win_input = require("./win_input/build/Release/win_input");
		module.exports.tapKey = win_input.tapKey;
		module.exports.leftClick = win_input.leftClick;
		module.exports.moveMouse = win_input.moveMouse;
	}
	//Other
	else {
		throw new Error("Platform not supported");
	}

}());
