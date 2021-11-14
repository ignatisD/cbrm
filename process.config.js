module.exports = {
    "apps" : [
        {
            "name"        : "CBRM",
            "script"      : "lib/index.js",
            "interpreter_args": "--max-old-space-size=8192",
            "exec_mode": "cluster",
            "kill_timeout": 5000,
            "listen_timeout": 6000,
            "wait_ready": true
        }
    ]
};
