// Node addon for issue Windows moue and keyboard events

#define WINVER 0x0500
#include <windows.h>

#include <node.h>
#include <string>

using namespace v8;

void tapKey(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    if (args.Length() != 1) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Wrong number of arguments")));
        return;
    }

    if (!args[0]->IsString()) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Argument must be a string")));
        return;
    }

    // We need to get a char out of a V8 String. Ugh
    // Thanks: http://stackoverflow.com/a/10255816/1960210
    //Get the arg string
    v8::String::Utf8Value v8str(args[0]->ToString());

    // convert it to a C++ string
    std::string str = std::string(*v8str);
    //Now we get the char
    char key = str[0];

    //Get the windows virtual key
    HKL layout = GetKeyboardLayout(0);
    UINT vkey = LOBYTE(VkKeyScanEx(key, layout));

    //Translate it to a scan code
    UINT scan_code =MapVirtualKeyEx(vkey, MAPVK_VK_TO_VSC, layout);

    if (scan_code == 0) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Invalid character")));
        return;
    }

    //Build and issue the keypress
    //Thanks: https://batchloaf.wordpress.com/2012/04/17/simulating-a-keystroke-in-win32-c-or-c-using-sendinput/
    INPUT ip;

    // Set up a generic keyboard event.
    ip.type = INPUT_KEYBOARD;
    ip.ki.time = 0;
    ip.ki.dwExtraInfo = 0;

    // Press the key
    ip.ki.wScan = scan_code;
    ip.ki.wVk = 0; // this is 0 because we use the scan code instead
    ip.ki.dwFlags = KEYEVENTF_SCANCODE;
    SendInput(1, &ip, sizeof(INPUT));

    // Release the key
    ip.ki.dwFlags = KEYEVENTF_KEYUP | KEYEVENTF_SCANCODE; // KEYEVENTF_KEYUP for key release
    SendInput(1, &ip, sizeof(INPUT));
}

void leftClick(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = Isolate::GetCurrent();
    HandleScope scope(isolate);

    INPUT ip;

    // Set up a generic mouse event.
    ip.type = INPUT_MOUSE;
    // We don't move the mouse on click
    ip.mi.dx = 0;
    ip.mi.dy = 0;

    ip.mi.mouseData = 0;
    ip.mi.time = 0;
    ip.mi.dwExtraInfo = 0;

    ip.mi.dwFlags = MOUSEEVENTF_LEFTDOWN; //Left button was pressed.

    SendInput(1, &ip, sizeof(INPUT));

    //Release the mouse
    ip.mi.dwFlags = MOUSEEVENTF_LEFTUP;
    SendInput(1, &ip, sizeof(INPUT));
}

void Init(Handle<Object> exports) {
    NODE_SET_METHOD(exports, "tapKey", tapKey);
    NODE_SET_METHOD(exports, "leftClick", leftClick);
}

NODE_MODULE(win_input, Init)