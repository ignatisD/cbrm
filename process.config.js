module.exports = {
    "apps" : [
        {
            "name"        : "NodeJSApp",
            "script"      : "app.js",
            "interpreter_args": "-r tsconfig-paths/register --max-old-space-size=8192",
            "exec_mode": "cluster",
            "kill_timeout": 5000,
            "listen_timeout": 6000,
            "wait_ready": true
        }
    ]
};