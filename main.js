var Leap = require('leapjs');
var robot = require('robotjs');
var ObjC = require('NodObjC');

var isCSS = true; // Lol such hack

var grenadeKey = isCSS ? 21 : 5; // 21 = the key 4, 5 = the key g
var knifeKey  = isCSS ? 20: 35; // 21 = the key 3, 35 = the p key
var pistolKey = 19; // the key 2

var bangEventEmitted = false;
var previousPosZ = 30;

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

// Move value towards the target by the specfied amount
function moveTowards(val, target, amount) {
    var dir = (val > target) ? -1 : 1;
    return val + (amount * dir);
}

function isCurled(hand, finger) {
    var finger_dir = finger.direction;
    var palm_dir = hand.direction;
    var palm_normal = hand.palmNormal;
    var threshhold = 7*Math.PI/36;  //35 degrees
    var right_angle = Math.PI/2; //90 degrees
    //Angle between the finger and the palm normal
    var fn_angle = Math.acos(Leap.vec3.dot(finger_dir, palm_normal));
    //Angle between the finger and the palm direction
    var fd_angle = Math.acos(Leap.vec3.dot(finger_dir, palm_dir));
    //We check fd_angle > 90 to detect the condition where the user has curled their finger past the palm normal
    return fn_angle < threshhold || fd_angle > right_angle;
}

// Camera benhavior variables
var sensitivityX = 0.09;
var sensitivityY = 0.0725;

var centerX = 0;
var x_box_width = 12.5;

var centerY = 205;
var y_box_width = 15;

var x_safe = [centerX - x_box_width, centerX + x_box_width]
var y_safe = [centerY - y_box_width, centerY + y_box_width];

//Main event loop
var controller = new Leap.Controller({ loopWhileDisconnected: true });
controller.setBackground(true);
controller.loop(function(frame) {
    if (frame.hands.length === 0) {
        bangEventEmitted = false;
        return;
    }

    var mouse = robot.getMousePos();
    var hand = frame.hands[0];

    //Update camera position
    var posX = hand.indexFinger.stabilizedTipPosition[0];
    var posY = hand.indexFinger.stabilizedTipPosition[1];

    if (posX > x_safe[0] && posX < x_safe[1]) {
        posX = 0;
    }
    else {
        posX = moveTowards(posX, centerX, x_box_width);
    }

    //Disable y mostion if we're in the safe box.
    if (posY > y_safe[0] && posY < y_safe[1]) {
        posY = centerY;
    }
    else {
        posY = moveTowards(posY, centerY, y_box_width);

        //Add a scaling factor on downwards motion to compensate for reduced range of motion
        if (posY < centerY) {
            var min_scale = 1.6;
            var max_scale = 4.2;
            var y_max = centerY - y_box_width;
            var scale = min_scale + (max_scale - min_scale) * (posY - y_max)/(-y_max);
            posY *= 1/scale;
        }
    }

    robot.moveMouse(mouse.x + (posX * sensitivityX), mouse.y + ((centerY - posY) * sensitivityY));

    // Start of gesture checking
    var palmSideways = Math.abs(hand.palmNormal[0]) > 0.75;
    var palmDown = hand.palmNormal[1] < -0.8;
    var clenched = [hand.indexFinger, hand.middleFinger, hand.ringFinger, hand.pinky].every(function(f) {
        return !f.extended;
    });
    var openHand = [hand.indexFinger, hand.middleFinger, hand.ringFinger, hand.pinky].every(function(f) {
        return f.extended;
    });

    if(curWeapon === weapon.GRENADE) {
        if(openHand) {
            console.log('fire in the hole!!!!!!');
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

    if(palmDown && openHand && curWeapon === weapon.KNIFE) {
        var delta = hand.palmPosition[2] - previousPosZ;
        previousPosZ = hand.palmPosition[2];

        if(delta < -5) {
            console.log("STABBITY STABBITY STAB");
            robot.mouseClick();
        }

        return;
    }

    // Are we entering knife mode?
    if(palmDown && openHand && curWeapon !== weapon.KNIFE) {
        console.log('KNIFE KNIFE KNIFE');
        tapKey(knifeKey);
        curWeapon = weapon.KNIFE;
        return; // Already changed modes this frame
    }

    // If no other weapon was selected, equip the gun
    if(curWeapon !== weapon.GUN) {
        console.log('gun select');
        tapKey(pistolKey);
        robot.mouseClick();
        curWeapon = weapon.GUN;
    }

    //Check for a trigger pull gesture
    if (palmDown && isCurled(hand, hand.indexFinger)) {
        if (!bangEventEmitted) {
            console.log('BANG!!!');
            robot.mouseClick();
            bangEventEmitted = true;
        }
    } else {
        bangEventEmitted = false;
    }
});
