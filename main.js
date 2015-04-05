var Leap = require('leapjs');
var robot = require("robotjs");

var bangEventEmitted = false;

//Move value towards the target by the specfied amount
function moveTowards(val, target, amount) {
    var dir = (val > target) ? -1 : 1;

    return val + (amount * dir);
}

//Camera benhavior variables
var sensitivityX = 0.09;
var sensitivityY = 0.0725;

var centerX = 0;
var x_box_width = 12.5;

var centerY = 220;
var y_box_width = 15;

var x_safe = [centerX - x_box_width, centerX + x_box_width]
var y_safe = [centerY - y_box_width, centerY + y_box_width];

//Main event loop
var controller = new Leap.Controller()
controller.setBackground(true);
controller.loop(function(frame) {
    if (frame.hands.length === 0) {
        bangEventEmitted = false;
    }

    var mouse = robot.getMousePos();
    frame.hands.forEach(function(hand) {

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
                var min_scale = 2;
                var max_scale = 4.5;
                var y_max = centerY - y_box_width;
                var scale = min_scale + (max_scale - min_scale) * (posY - y_max)/(-y_max);
                posY *= 1/scale;
            }
        }

        robot.moveMouse(mouse.x + (posX * sensitivityX), mouse.y + ((centerY - posY) * sensitivityY));


        //Check for a trigger pull gesture
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



