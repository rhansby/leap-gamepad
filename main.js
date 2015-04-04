var Leap = require('leapjs');
var robot = require("robotjs");

var bangEventEmitted = false;

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

var sensitivity = 0.08;
var xTolerance = 40;

var controller = new Leap.Controller()
controller.setBackground(true);
controller.loop(function(frame) {
    if (frame.hands.length === 0) {
        bangEventEmitted = false;
    }

    var mouse = robot.getMousePos();
    frame.hands.forEach(function(hand) {

        var posX = hand.indexFinger.stabilizedTipPosition[0];
        var handDirectionY = hand.direction[1];

        // This is kasey stuff:
        /*
        var yVec = Leap.vec3.fromValues(0, handDirectionY, 0);
        var yBasis = Leap.vec3.fromValues(0,1,0);
        var yAngle = Math.asin(Leap.vec3.dot(yVec, yBasis) / handDirectionY);
        console.log(Leap.vec3.dot(yVec, yBasis) / handDirectionY);
        var angleLimit = (7*Math.PI)/18;
        var yAngle = clamp(yAngle, -angleLimit, angleLimit);
        var newY = 799 + ((yAngle + angleLimit) / (2*angleLimit));
        robot.moveMouse(mouse.x + (posX * sensitivity), newY);
        */



        var yComponentThreshold = 0.5;
        if (handDirectionY > yComponentThreshold) {
            robot.moveMouse(mouse.x + (posX * sensitivity), mouse.y - 5);
        } else {
            robot.moveMouse(mouse.x + (posX * sensitivity), (-handDirectionY * mouse.y * 2) + 400);
        }

        if (!hand.indexFinger.extended || !hand.middleFinger.extended) {
            if (!bangEventEmitted) {
                console.log('BANG!!!');
                robot.mouseClick();
                bangEventEmitted = true;
            }
        } else {
            bangEventEmitted = false;
        }
    });
});



