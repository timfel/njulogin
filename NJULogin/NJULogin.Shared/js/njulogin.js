(function () {
    "use strict";

    function resolve() {
        var request = new XMLHttpRequest();
        request.open("get", "http://p.nju.edu.cn/", false);
        try {
            request.send();
        } catch (ex) {
            Windows.Storage.ApplicationData.current.localSettings.values["status"] = "Not in NJU network";
            return false;
        }
        return true;
    }

    if (resolve()) {
        Windows.Storage.ApplicationData.current.localSettings.values["status"] = "Starting login...";
        var request = new XMLHttpRequest();
        request.open("post", "http://p.nju.edu.cn/portal/portal_io.do", false);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        var statusText = "Unknown problem";
        try {
            request.send("action=login&username=" +
                Windows.Storage.ApplicationData.current.localSettings.values["username"] + "&password=" +
                Windows.Storage.ApplicationData.current.localSettings.values["password"]);
        } catch (ex) {
            statusText = ex + "";
        }
        if (request.responseText && request.responseText !== "") {
            statusText = request.responseText;
        }
        if (request.readyState == 4 && request.status == 200) {
            Windows.Storage.ApplicationData.current.localSettings.values["status"] = request.responseText;
        } else if (request.readyState == 4) {
            Windows.Storage.ApplicationData.current.localSettings.values["status"] = "There was an error logging you in: " + statusText;
        }
    }
    close();
})();
