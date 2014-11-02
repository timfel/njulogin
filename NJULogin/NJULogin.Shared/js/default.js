// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=392286
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            document.getElementById("btnRefresh").onclick = function () {
                doLogin();
            }
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // ...
            } else {
                // ...
            }
            args.setPromise(WinJS.UI.processAll());
        }
        loadSettings();
        registerLoginBackgroundTask();
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.start();

    function alertMsg(str) {
        var el = document.getElementById("msgBox");
        if (el) el.textContent = str;
    }

    function updateUI() {
        alertMsg(Windows.Storage.ApplicationData.current.localSettings.values["status"]);
        document.getElementById('iframe').src = document.getElementById('iframe').src;
    }

    function doLogin() {
        alertMsg("Sending login request...");
        var request = new XMLHttpRequest();
        request.open("post", "http://p.nju.edu.cn/portal/portal_io.do", true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send("action=login&username=" +
            Windows.Storage.ApplicationData.current.localSettings.values["username"] + "&password=" +
            Windows.Storage.ApplicationData.current.localSettings.values["password"]);
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                alertMsg(request.responseText);
                document.getElementById('iframe').src = document.getElementById('iframe').src;
            } else if (request.readyState == 4) {
                alertMsg("There was an error logging you in: " + request.responseText);
            }
        };
    }

    function registerLoginBackgroundTask() {
        var task;
        var taskRegistered = false;
        var exampleTaskName = "NJU Login background task";
        var background = Windows.ApplicationModel.Background;
        var iter = background.BackgroundTaskRegistration.allTasks.first();
        while (iter.hasCurrent) {
            task = iter.current.value;
            if (task.name === exampleTaskName) {
                taskRegistered = true;
                //task.unregister(true);
                break;
            }
            iter.moveNext();
        }

        if (taskRegistered != true) {
            if (document.getElementById("WindowsPhone")) {
                Windows.ApplicationModel.Background.BackgroundExecutionManager.removeAccess();
                Windows.ApplicationModel.Background.BackgroundExecutionManager.requestAccessAsync().done();
            }
            var builder = new Windows.ApplicationModel.Background.BackgroundTaskBuilder();
            builder.name = exampleTaskName;
            builder.taskEntryPoint = "js\\njulogin.js";
            var trigger = new Windows.ApplicationModel.Background.SystemTrigger(
                Windows.ApplicationModel.Background.SystemTriggerType.internetAvailable, false);
            builder.setTrigger(trigger);
            task = builder.register();
        }
        task.addEventListener("completed", updateUI);
        task.addEventListener("progress", updateUI);
    }

    function loadSettings() {
        var username = document.getElementById("inputUsername"),
            password = document.getElementById("inputPassword");
        username.onchange = function () {
            Windows.Storage.ApplicationData.current.localSettings.values["username"] = username.value;
        }
        password.onchange = function () {
            Windows.Storage.ApplicationData.current.localSettings.values["password"] = password.value;
        }
        username.value = Windows.Storage.ApplicationData.current.localSettings.values["username"];
        password.value = Windows.Storage.ApplicationData.current.localSettings.values["password"];
    }
})();