// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=392286
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var NJU_RESOURCE = "p.nju.edu.cn";

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
        setTimeout(resolve, 1000);
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
        var status = Windows.Storage.ApplicationData.current.localSettings.values["status"];
        if (status) {
            alertMsg(status);
            showMsg(true);
        } else {
            document.getElementById('iframe').src = document.getElementById('iframe').src || 'http://p.nju.edu.cn';
            showMsg(false);
        }
    }

    function showMsg(flag) {
        document.getElementById('iframe').style.display = (flag ? 'none' : '');
        document.getElementById('msgBox').style.display = (flag ? '' : 'none');
    }

    function resolve() {
        var request = new XMLHttpRequest();
        request.open("head", "http://p.nju.edu.cn/", true);
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status != 200) {
                Windows.Storage.ApplicationData.current.localSettings.values["status"] = "Not in NJU network. 不在南京大学网络中。";
                updateUI();
            }
        };
    }

    function doLogin() {
        resolve();
        //alertMsg("Sending login request...");
        var request = new XMLHttpRequest();
        request.open("post", "http://p.nju.edu.cn/portal/portal_io.do", true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.send("action=login&username=" +
            document.getElementById("inputUsername").value + "&password=" +
            document.getElementById("inputPassword").value);
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                // alertMsg(request.responseText);
                document.getElementById('iframe').src = document.getElementById('iframe').src;
            } else if (request.readyState == 4) {
                // alertMsg("There was an error logging you in: " + request.responseText);
            }
        };
    }

    function currentVersion() {
        var version = Windows.ApplicationModel.Package.current.id.version;
        return version.build + "." + version.major + "." + version.minor + "." + version.revision;
    }

    function wasUpdated() {
        var settings = Windows.Storage.ApplicationData.current.localSettings,
            version = currentVersion();
        if (settings.values["AppVersion"] !== version) {
            settings.values["AppVersion"] = version;
            return true;
        } else {
            return false;
        }
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
                if (wasUpdated()) {
                    task.unregister(true);
                    taskRegistered = false;
                }
                break;
            }
            iter.moveNext();
        }

        if (taskRegistered != true) {
            var buildTask = function () {
                var builder = new Windows.ApplicationModel.Background.BackgroundTaskBuilder();
                builder.name = exampleTaskName;
                builder.taskEntryPoint = "js\\njulogin.js";
                var trigger = new Windows.ApplicationModel.Background.SystemTrigger(
                    Windows.ApplicationModel.Background.SystemTriggerType.internetAvailable, false);
                builder.setTrigger(trigger);
                task = builder.register();
                task.addEventListener("completed", updateUI);
                task.addEventListener("progress", updateUI);
            }
            if (document.getElementById("WindowsPhone")) {
                Windows.ApplicationModel.Background.BackgroundExecutionManager.removeAccess();
                Windows.ApplicationModel.Background.BackgroundExecutionManager.requestAccessAsync().done(buildTask);
            } else {
                buildTask();
            }
        } else {
            task.addEventListener("completed", updateUI);
            task.addEventListener("progress", updateUI);
        }
    }

    function loadSettings() {
        var username = document.getElementById("inputUsername"),
            password = document.getElementById("inputPassword"),
            vault = new Windows.Security.Credentials.PasswordVault(),
            credentialList = [],
            pc;
        try {
            credentialList = vault.findAllByResource(NJU_RESOURCE);
        } catch (e) {
            // Exception is thrown when resource does not exist, yet
        }
        if (credentialList.length > 0) {
            pc = credentialList[0];
        }
        username.onchange = storeLogin;
        password.onchange = storeLogin;
        if (pc) {
            pc.retrievePassword();
            username.value = pc.userName;
            password.value = pc.password;
        }
    }

    function storeLogin() {
        var pc = new Windows.Security.Credentials.PasswordCredential(NJU_RESOURCE, username.value || "missing", password.value || "missing");
        var vault = new Windows.Security.Credentials.PasswordVault(),
            creds = [];
        try {
            creds = vault.findAllByResource(NJU_RESOURCE);
        } catch (e) {
            // Exception is thrown if resource has no credentials
        }
        // make sure we only store the last login
        for (var i = 0; i < creds.length; i++) {
            vault.remove(creds[i]);
        }
        vault.add(pc);
    }
})();