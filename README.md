# Discord Rich Presence for TIDAL
This is a simple program that allows you to show what you're listening to on TIDAL on Discord, **with** support for animated covers.

![animatedcover](https://github.com/user-attachments/assets/c985ec5c-fcf4-45f6-b89e-8f95423a6d76)

![image](https://github.com/user-attachments/assets/2b3eb1f3-0ce6-4eea-9a7f-49579e970fa7)

This implementation uses .NET code via the [edge.js](https://www.npmjs.com/package/edge-js) library to scrape the main window title, which it then uses to call the TIDAL API and get basic info about your song, as well as the album cover. <br />

This app was designed with Windows in mind. If you want a similar experience on Linux, please check out the fantastic [Tidal Hi-Fi](https://github.com/Mastermindzh/tidal-hifi) project, which has excellent built-in Discord RPC support.

# Installation

1. Clone the repository:
```git clone https://github.com/AleksandarN-BG/PublicDiscordTidalRPC.git```
2. Install the required packages:
```npm install```
3. Put your **two-letter** country code in the `country_code` field, whether you wish to have versions shown (aka what's in the parentheses if you're listening to a different version of the same track) in the `display_versions` field, and if you want the artist's photo to display in the "small image key" (that's that little circular cutout on the bottom right of the album cover on your profile) in `display_artist_photo`.

# Usage

1. Run the program:
```npm run-script run```

# To-do

- Add handling for the discord client restarting 

# License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
