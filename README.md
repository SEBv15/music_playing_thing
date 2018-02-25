# music playing thing
Use a Raspberry Pi to play music from YouTube at home. Includes App and web interface for control

### Installation
This project uses a raspberry pi which is hooked up to your audio system (via HDMI or aux) and acts as server.
Upload the contents of the `raspberry-pi` folder to that raspberry pi, run `npm install` and start the server via `node player.js`.

To automatically start the server on reboot, run `crontab -e` as root and add this line at the bottom:

    @reboot cd [path to project folder] && nohup nodemon player.js &
### App
It is most likely that the pre-build app won't work for you since it accesses the raspberry pi on a specific IP address (192.168.1.83). Therefore you will have to change the IP address in the `fetch` functions to your raspberry pi's IP address or host name (host name for some reason didn't work with iOS for me).
Then rebuild it using `exp build android`.
### Usage
To access the web interface, type the IP or host name of your raspberry into your browser's URL bar. To make it access easier, it is a good idea to change the host name to something like `music_playing_thing` or `player`.
**To be able to access the server using the web interface or the app, you have to be in the same network!**


----------


Since this README isn't anything close to being thorough enough (in my opinion), feel free to contact me with any questions or if you found any bugs (which is very likely to happen).
