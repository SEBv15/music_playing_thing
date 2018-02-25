const cheerio = require("cheerio");
var fs = require("fs")
var request = require('request');
var stations = require("./station")


/*
 * Contains cross file variables such as vars.playlists 
 */
var vars = require("./vars")

module.exports = function(app,youtube) {
	let root = "/api/v1/";
	app.all(root,(req,res)=> {
		res.json({error:null,msg:"This is the v1 API!"});
	});

	/*
	 * YouTube Video Search (search)
	 * Needs parameters: q (search term)
	 * Returns first 10 matches 
	 */
	app.post(root+"search", (req,res)=> {
		if(!req.body.q) {
			res.status(400).send({error:400,msg:"parameter 'q' must be set"})
			return
		}
		youtube.search.list({
			part: 'snippet',
			q: req.body.q,
			type:'video',
			maxResults:10
		}, function (err, data) {
			if (err) {
			  console.error('Error: ' + err);
			  res.status(500).send({error:500,msg:"Internal Server Error"})
			}
			if (data) {
			  res.json(data.items);
			}
		});
	})
	
	/*
	 * List Playlists (playlists)
	 * Needs parameters: none
	 * Returns all playlists available (from YouTube account or manually added)
	 */
	app.post(root+"playlists",(req,res)=> {
		res.json((vars.playlists));
	})
	
	/*
	 * List Videos in Playlist (playlistItems)
	 * Needs parameters: id (playlist id)
	 * Returns videos in specified playlist
	 */
	app.post(root+"playlistItems",(req,res) => {
		if(!req.body.id) {
			res.status(400).send({error:400,msg:"parameter 'id' must be set"})
			return
		}
		function getItems(items,token) {
			youtube.playlistItems.list({
				'maxResults': '10',
				'part': 'snippet,contentDetails',
				'playlistId': req.body.id,
				'pageToken': (token && token !== true)?token:undefined
			}, (err,data) => {
				if(err != null) {
					res.status(500).send({error:500,msg:"Internal Server Error"});
					return
				}
				items = items.concat(data.items)
				//console.log(data.items)
				if(data.nextPageToken) {
					getItems(items,data.nextPageToken)
				} else {
					res.json(items);
				}
			});
		}
		getItems([],true)
	}) 
	
	/*
	 * Play Song (play)
	 * Needs parameters: id (YT video id)
	 * Optional parameters: playlist (YT Playlist id - 'undefined' if from search), index (the index within the playlist)
	 * Returns next song
	 */
	app.post(root+"play",(req,res) => {
		if(!req.body.id) {
			res.status(400).send({error:400,msg:"parameter 'id' must be set"})
			return
		}
		res.send({error:null,msg:"playing "+req.body.id})
		vars.player.play(req.body.id,req.body.playlist?req.body.playlist:false,req.body.index?req.body.index:undefined)
	}); 
	
	/*
	 * Pause Music (pause)
	 * Needs parameters: none
	 * Returns nothing
	 */
	app.post(root+"pause",(req,res) => {
		vars.player.pause()
		res.json({error:null,msg:"paused"})
	})
	
	/*
	 * Unpause Music (unpause)
	 * Needs parameters: none
	 * Returns nothing
	 */
	app.post(root+"unpause",(req,res) => {
		vars.player.unpause()
		res.json({error:null,msg:"unpaused"})
	})
	
	
	/*
	 * Get Volume (getVolume)
	 * Needs parameters: none
	 * Returns current volume (0 - 2)
	 */
	app.post(root+"getVolume", (req,res) => {
		try {
			res.send(vars.player.getVolume())
		} catch(err) {
			//console.log(err)
			res.status(500).send({error:500,msg:"Internal Server Error"})
		}
	})
	
	/*
	 * Set Volume (setVolume)
	 * Needs parameters: volume (0-100, 100 is 100%)
	 * Returns nothing
	 */
	app.post(root+"setVolume", (req,res) => {
		if((!req.body.volume && !(req.body.volume === 0)) || req.body.volume < 0 || req.body.volume > 100) {
			res.status(400).send({error:400,msg:"parameter 'volume' must be set and between 0 and 100"});
			return
		}
		try {
			vars.player.setVolume(req.body.volume)
			res.json({error:null,msg:"Volume set",volume:req.body.volume})
		} catch(err) {
			res.status(500).send({error:500,msg:"Internal Server Error"})
		}
	})
	
	/*
	 * Get Playback time (getTime)
	 * Needs parameters: none
	 * Returns current playback time in seconds
	 */
	app.post(root+"getTime",(req,res) => {
		if(vars.player) {
			res.send(vars.player.getTime().toString())
		} else {
			res.status(500).send({error:500,msg:"Internal Server Error"})
		}
	})
	
	/*
	 * Skip to specific time (seek)
	 * Needs parameters: time (# of seconds from beginning)
	 * Returns nothing
	 */
	app.post(root+"seek",(req,res) => {
		if(!req.body.time && !(req.body.time === 0)) {
			res.status(400).send({error:400,msg:"parameter 'time' must be set"});
			return
		}
		vars.player.seek(req.body.time)
		res.json({error:null,msg:"seeked"});
	})
	
	/*
	 * Play Next Song (next)
	 * Needs parameters: none
	 * Returns songId, playlist and songTitle
	 */
	app.post(root+"next",(req,res) => {
		res.json({error:null,songId:vars.playing.nextSongId,songTitle:vars.playing.nextSongTitle,playlist:vars.playing.playlist})
		vars.player.next()
	})
	
	/*
	 * Add playlist (addPlaylist)
	 * Needs parameters: id (playlist-to-add's id)
	 * Returns playlists
	 */
	app.post(root+"addPlaylist",(req,res) => {
		if(!req.body.id) {
			res.status(400).send({error:400,msg:"parameter 'id' must be set"});
			return
		}
		fs.readFile("static/data.json",(err,data) => {
			data = JSON.parse(data);
			data.playlists.push(req.body.id)
			fs.writeFile("static/data.json",JSON.stringify(data),() => {
				vars.refreshPlaylists((playlists) => {
					res.json(playlists)
				})
			})
		})
	})
	
	/*
	 * Delete Playlist (deletePlaylist)
	 * Needs parameters: id (playlist's id)
	 * Returns playlists
	 */
	app.post(root+"deletePlaylist",(req,res) => {
		if(!req.body.id) {
			res.status(400).send({error:400,msg:"parameter 'id' must be set"});
			return
		}
		fs.readFile("static/data.json",(err,data) => {
			data = JSON.parse(data);
			data.playlists = data.playlists.filter(function(x) {return x != req.body.id})
			fs.writeFile("static/data.json",JSON.stringify(data),() => {
				vars.refreshPlaylists((playlists) => {
					res.json(playlists)
				})
			})
		})
	})
	 
	/*
	 * Get Bulk Data (getBulk)
	 * Needs parameters: none
	 * Returns vars.playing, volume, time, duration, isPlaying, playlists
	 */
	app.post(root+"getBulk",(req,res) => {
		var out = {}
		out.playing = vars.playing
		out.volume = vars.player.getVolume()
		out.time = vars.player.getTime()
		out.duration = vars.player.duration
		out.isPlaying = (vars.playing.station)?vars.playing.playing:vars.player.playing
		out.playlists = vars.playlists
		out.avr = vars.avr
		res.json(out)
	});
	
	/*
	 * AVR On/Off (avr)
	 * Needs parameters: none
	 * Returns avr status
	 */
	app.post(root+"avr",(req,res) => {
		//console.log(vars)
		if(vars.avr) {
			console.log("ON")

			var url = 'http://192.168.1.88/MainZone/index.put.asp';
			var headers = { 
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
				'Content-Type' : 'application/x-www-form-urlencoded' 
			};
			var formdata = {cmd0:"PutZone_OnOff/OFF"}

			request.post({ url: url, form: formdata, headers: headers }, function (e, r, body) {
			});
		} else {
			var url = 'http://192.168.1.88/MainZone/index.put.asp';
			var headers = { 
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
				'Content-Type' : 'application/x-www-form-urlencoded' 
			};
			var formdata = {cmd0:"PutZone_OnOff/ON",cmd1:"PutZone_InputFunction/MPLAY"}

			request.post({ url: url, form: formdata, headers: headers }, function (e, r, body) {
			});
		}
		// vars.avr = !vars.avr
		res.send({err:null,msg:"switched avr state to " + (vars.avr)?"OFF":"ON",state:!vars.avr})
	})
	
	/*
	 * Search Stations (stationSearch)
	 * Needs parameters: q (search value)
	 * Returns first 10 elements found
	 */
	app.post(root+"stationSearch",(req,res) => {
		if(!req.body.q) {
			res.status(400).send({error:400,msg:"parameter 'q' must be set"});
			return
		}
		stations.search(req.body.q,function(data) {
			res.send({error:null,stations:data,msg:"Found some"})
		})
	})
	
	/*
	 * Play Station (stationPlay)
	 * Needs parameters: id (station id)
	 * Returns nothing
	 */
	app.post(root+"stationPlay",(req,res) => {
		if(!req.body.id) {
			res.status(400).send({error:400,msg:"parameter 'id' must be set"});
			return
		}
		stations.play(req.body.id)
		res.send({error:null,msg:"Hopefully playin' it right now"})
	})
	
	/*
	 * Pause Station (stationPause)
	 * Needs parameters: none
	 * Returns nothing
	 */
	app.post(root+"stationPause",(req,res) => {
		console.log("PAUSE")
		stations.stop()
		res.send({error:null,msg:"Paused it"})
	})
	
	/*
	 * Unpause Station (stationUnpause)
	 * Needs parameters: none
	 * Returns nothing
	 */
	app.post(root+"stationUnpause",(req,res) => {
		console.log("UNPAUSE")
		stations.resume()
		res.send({error:null,msg:"Unpaused it"})
	})
}
