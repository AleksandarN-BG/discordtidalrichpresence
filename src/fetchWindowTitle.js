import edge from "edge-js";
import * as main from "../main.js";

let current = "";

let secondtry;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getWindowTitle = edge.func({
    source: function () {/*
        using System;
        using System.Diagnostics;
        using System.Threading.Tasks;

public class Startup
{
    public async Task<object> Invoke(object input)
    {
        Process[] processes = Process.GetProcessesByName("tidal");

        if (processes.Length > 0)
        {
            for (int i = 0; i < processes.Length; i++)
            {
                if (!string.IsNullOrEmpty(processes[i].MainWindowTitle))
                {
                    string mainWindowTitle = processes[i].MainWindowTitle;
                    return mainWindowTitle;
                }
            }
        }

        return "";
    }
}
    */
    }
});

export function fetchWindowTitle(callback) {
    getWindowTitle(null, function (error, result) {
        current = result;

        if (error) throw error;

        if (result === "TIDAL" || result === "") {
            if (secondtry) {
                if (!main.activityCleared){console.log("Second try failed.");}
                callback(null);
            }
            else {
                if (!main.activityCleared){
                    console.log("TIDAL not found or nothing is playing, retrying before clearing RPC...");
                    sleep(4000).then(() => {
                        secondtry = true;
                        fetchWindowTitle(callback);
                    });
                }
            }
        } else {
            secondtry = false;
            callback(result);
        }
    });
}