
import {client} from "../main.js";
import edge from "edge-js";

let failcounter = 0;

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

export function fetchWindowTitleAndAlbum(callback) {
    getWindowTitle(null, function (error, result) {
        if (error) throw error;

        if (result === "TIDAL") {
            console.log("TIDAL is open, but no song is playing.");
            callback(null);
        } else if (result === "") {
            console.log("TIDAL is not open.");
            callback(null);
        } else {
            console.log("Main Window Title: " + result);
            callback(result);
        }
    });
}