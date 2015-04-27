# Leap Gamepad

### Check it out on YouTube:
[![Leap Gamepad in action](http://img.youtube.com/vi/DYLsE7Klp_I/0.jpg)](http://www.youtube.com/watch?v=DYLsE7Klp_I)

### Created by Kasey Carrothers, Ryan Hansberry, and Ivan Petkov @ LA Hacks 2015

We wanted to create a fun and immersive way of playing first person shooter games. We chose to use the Leap Motion to interpret natural gestures and movements as game commands to add a bit of extra fun to an existing game!

We implemented several gameplay gestures:

* Moving the camera by waving a hand in the direction the camera should turn
* Holding a hand in a "gun" position equips the pistol and "pulling" the trigger will fire (holding your hand with palm facing down works best as the Leap Motion can detect the fingers better)
* An open hand with the palm facing downwards equips the knife. Making a rapid stabbing motion towards the screen attacks with the knife
* Holding a clenched fist (with the palm "facing" sideways) equips the grenade. Opening up the hand throws the grenade.

How it works:
We used a local node.js server and the Leap.js framework to interface with the Leap Motion and track movements and recognize gestures. The server would then dispatch the appropriate keyboard and mouse click events to the operating system which would be then received by any game the user is running.

Works on OS X and Windows.

####To Build:
* Clone the repo
* Run npm install in the cloned directory. There may be some errors on Windows, ignore them.
* For Windows users: Cd into the win_input directory and run node-gyp build (can this be done automatically?).
