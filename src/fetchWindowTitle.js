import edge from "edge-js";

let current = "";

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
            callback(null);
        } else {
            callback(result);
        }
    });
}