(function () {
    "use strict";

    var NJU_RESOURCE = "p.nju.edu.cn";

    function resolve() {
        var request = new XMLHttpRequest();
        request.open("head", "http://p.nju.edu.cn/", false);
        try {
            request.send();
        } catch (ex) {
            Windows.Storage.ApplicationData.current.localSettings.values["status"] = "Not in NJU network. 对不起，您不在南京大学校园无线网络中。";
            return false;
        }
        Windows.Storage.ApplicationData.current.localSettings.values["status"] = null;
        return true;
    }

    function findUsernamePassword() {
        var vault = new Windows.Security.Credentials.PasswordVault(),
            credentialList = [],
            pc = { userName: '', password: '' };
        try {
            credentialList = vault.findAllByResource(NJU_RESOURCE);
        } catch (e) {
            // Exception is thrown when resource does not exist
            return pc;
        }
        if (credentialList.length > 0) {
            pc = credentialList[0];
            pc.retrievePassword();
            return pc;
        } else {
            return pc;
        }
    }

    function showToast(notificationText) {
        var notifications = Windows.UI.Notifications;
        var template = notifications.ToastTemplateType.toastText01;
        var toastXml = notifications.ToastNotificationManager.getTemplateContent(template);
        var toastTextElements = toastXml.getElementsByTagName("text");
        toastTextElements[0].appendChild(toastXml.createTextNode(notificationText));
        var toastNode = toastXml.selectSingleNode("/toast");
        var audio = toastXml.createElement("audio");
        audio.setAttribute("silent", "true");
        toastNode.appendChild(audio);
        var toast = new notifications.ToastNotification(toastXml);
        var toastNotifier = notifications.ToastNotificationManager.createToastNotifier();
        toastNotifier.show(toast);
        //Windows.Storage.ApplicationData.current.localSettings.values["status"] = request.responseText;
    }

    function possibleSuccess(statusText) {
        var notificationText = "Login to NJU failed - 登录失败。",
            json;
        try {
            json = JSON.parse(statusText);
        } catch (e) {
            // no worries
        }
        if (json && json.reply_code === 101) {
            notificationText = "Logged into NJU - 登录成功。";
        }
        showToast(notificationText);
    }

    if (resolve()) {
        var request = new XMLHttpRequest(),
            pc = findUsernamePassword();
        request.open("post", "http://p.nju.edu.cn/portal/portal_io.do", false);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        var statusText = "Unknown problem";
        try {
            request.send("action=login&username=" + pc.userName + "&password=" + pc.password);
        } catch (ex) {
            statusText = ex + "";
        }
        if (request.responseText && request.responseText !== "") {
            statusText = request.responseText;
        }
        if (request.readyState == 4 && request.status == 200) {
            possibleSuccess(statusText);
        } else if (request.readyState == 4) {
            //Windows.Storage.ApplicationData.current.localSettings.values["status"] = "There was an error logging you in: " + statusText;
        }
    }
    close();
})();
