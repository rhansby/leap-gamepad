var Leap = require('leapjs');
var robot = require("robotjs");
var ObjC = require('NodObjC');

var grenadeKey = 5;
var pistolKey = 19;

var bangEventEmitted = false;

var weapon = {
    INVALID: 0,
    GRENADE: 1,
    KNIFE: 2,
    GUN: 3
}

var curWeapon = weapon.INVALID;


var tapKey = (function() {
    ObjC.framework('Cocoa');
    ObjC.framework('Foundation');

    var keyMap = {};

    // Calling ObjC.CFRelease keeps crashing, so
    // we'll just cache all key events we create and reuse them
    // without ever freeing the memory
    return function(key) {
        var events = keyMap[key];

        if(!events) {
            events = {
                down: ObjC.CGEventCreateKeyboardEvent(null, key, true),
                up  : ObjC.CGEventCreateKeyboardEvent(null, key, false),
            };

            keyMap[key] = events;
        }

        ObjC.CGEventPost(ObjC.kCGHIDEventTap, events.down);
        ObjC.CGEventPost(ObjC.kCGHIDEventTap, events.up);
    }
})();

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

var sensitivity = 0.08;
var xTolerance = 40;

var controller = new Leap.Controller({ loopWhileDisconnected: true });
controller.setBackground(true);
controller.loop(function(frame) {
    if (frame.hands.length === 0) {
        bangEventEmitted = false;
        return;
    }

    var mouse = robot.getMousePos();
    var hand = frame.hands[0];

    var posX = hand.indexFinger.stabilizedTipPosition[0];
    var handDirectionY = hand.direction[1];
    var yComponentThreshold = 0.5;

    if (handDirectionY > yComponentThreshold) {
        robot.moveMouse(mouse.x + (posX * sensitivity), mouse.y - 5);
    } else {
        robot.moveMouse(mouse.x + (posX * sensitivity), (-handDirectionY * mouse.y * 2) + 400);
    }

    var palmSideways = Math.abs(hand.palmNormal[0]) > 0.75;
    var palmDown = hand.palmNormal[1] < -0.8;
    var clenched = [hand.indexFinger, hand.middleFinger, hand.ringFinger, hand.pinky].every(function(f) {
        return !f.extended;
    });

    if(curWeapon === weapon.GRENADE) {
        var openHand = [hand.indexFinger, hand.middleFinger, hand.ringFinger, hand.pinky].every(function(f) {
            return f.extended;
        });

        if(openHand) {
            console.log('fire int the hole!!!!111!!');
            robot.mouseClick();
            curWeapon = weapon.INVALID;

            controller.disconnect();
            setTimeout(function() { controller.connect(); }, 150);
        }

        return;
    }

    // Are we about to go into grenade mode?
    if (palmSideways && clenched) {
        console.log('grenade mode!');
        tapKey(grenadeKey);
        curWeapon = weapon.GRENADE;
        return; // Already changed modes this frame
    }

    // If no other weapon was selected, equip the gun
    if(curWeapon !== weapon.GUN) {
        console.log('gun select');
        tapKey(pistolKey);
        robot.mouseClick();
        curWeapon = weapon.GUN;
    }

    // Did we fire the gun?
    if (palmDown && (!hand.indexFinger.extended || !hand.middleFinger.extended)) {
        if (!bangEventEmitted) {
            console.log('BANG!!!');
            robot.mouseClick();
            bangEventEmitted = true;
        }
    } else {
        bangEventEmitted = false;
    }
});
