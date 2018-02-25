var lame = require('lame');
var Speaker = require('speaker');
var url = require('url');
var ytdl = require("ytdl-core")
var through = require("through2");
var FFmpeg = require('fluent-ffmpeg')
var audioVolume = require("pcm-volume");
var loudness  = require("loudness")
var vars = require("./vars")
var stations = require("./station")

var v = new audioVolume();

var ffmpeg
var speaker
var playing = false
var decoder
	
module.exports = {
	playing: false,
	volume: 1,
	duration: 0,
	time: 0,
	startTime: 0,
	play: function(id,playlist=false,playlistIndex=undefined,seek=0) {
		// RESET VARIABLES
		stations.stop()
		//console.log("ASKODUASDGAUSDJISA",vars.playing,id)
		console.log("ASKODUASDGAUSDJISA",id)
		vars.playing = {}
		this.duration = 0
		this.time = 0
		this.startTime = 0
		var those = this;
		vars.playing.playlist = playlist?playlist:undefined
		vars.playing.songId = id
		ytdl.getInfo(id,function(err,d) {
			//console.log("info",d)
			if(!err) {
				those.duration = d.length_seconds
				vars.playing.duration = those.duration
				vars.playing.songTitle = d.title.trim()
				if(!playlist) {
					vars.playing.nextSongId = d.related_videos[0].id
					vars.playing.nextSongTitle = d.related_videos[0].title.trim()
				}
			} else {
				console.log(err)
				those.playNextNow = true
			}
		});
		if(playlist) {
			vars.fx.playlistItems(playlist,vars.youtube,function(items) {
				//console.log(items)
				fallback = false
				playlistIndex = playlistIndex%items.length
				if(playlistIndex || playlistIndex === 0) {
					var testing = items[playlistIndex]
					//console.log(playlistIndex,items)
					if(testing.contentDetails.videoId == id) {
						vars.playing.songIndex = playlistIndex
						vars.playing.nextSongId = items[(playlistIndex+1)%items.length].contentDetails.videoId
						vars.playing.nextSongTitle = items[(playlistIndex+1)%items.length].snippet.title.trim()
					} else { fallback = true}
				} else {fallback = true}
				if(fallback) {
					playlistIndex = items.findIndex(elem => elem.contentDetails.videoId == id)
					if(!(playlistIndex>0)) {
						playlistIndex = 0
					}
					vars.playing.songIndex = playlistIndex
					vars.playing.nextSongId = items[(playlistIndex+1)%items.length].contentDetails.videoId
					vars.playing.nextSongTitle = items[(playlistIndex+1)%items.length].snippet.title.trim()
				}
				// if an error occurred with this song
				if(those.playNextNow) {
					those.playNextNow = undefined
					//console.log("play next",vars.playing)
					those.next()
				}
			});
		}
		
		setTimeout(function() {
		//console.log(vars.playing)
		},3000)
		
		
		
		if(ffmpeg) {
			ffmpeg.kill()
			speaker.end()
			//decoder.end();
		}
		this.playing = true
		//console.log(this.playing);
		decoder = new lame.Decoder();
		speaker = new Speaker();
		speaker.on("error",function(err) {
			console.log("Speaker",err)
		})
		decoder.on("error",function(err) {
			console.log("Decoder",err)
		})
		var ystream = ytdl(id,{
			quality:'lowest',
			filter: 'audioonly'
		})

		ystream.on('error',function(err) {
			console.log("YSTREAM",err)
		})
		var stream = through();
		stream.on('error',function(err) {
			console.log("Stream",err)
		})
		ffmpeg = new FFmpeg(ystream).format("mp3")

		// skip given amount of seconds at beginning
		this.time = parseFloat(seek)
		ffmpeg.seekInput(parseFloat(seek))
		
		ffmpeg.pipe(stream)

		//ffmpeg.audioFilters('volume=1.0')
		ffmpeg.on('error', function(err) {
			console.log('Ffmpeg has been killed',err);
		});
		
		this.startTime = Date.now()
		var that = this;
		ffmpeg.on('codecData', function(data) {
			// start counting time after this event since I THINK it gets fired after the data is loaded
			that.startTime = Date.now()
		});

		decoder.pipe(speaker)
		stream.pipe(decoder)
		var that = this
		decoder.on('end',function() {
			console.log("end")
			//console.log(vars.playing)
			if(vars.playing.nextSongId) {
				that.play(vars.playing.nextSongId,vars.playing.playlist,(vars.playing.songIndex)?(vars.playing.songIndex+1):undefined)
			}
		})
	},
	pause: function() {
		if(ffmpeg) {
			ffmpeg.kill('SIGSTOP')
			decoder.unpipe()
			this.playing = false
			this.time += (Date.now() - this.startTime)/1000
		}
	},
	kill: function() {
		if(ffmpeg) {
			ffmpeg.kill('SIGKILL')
			decoder.unpipe()
			speaker.end()
			this.playing = false
			this.time = 0
			this.duration = 0
			this.startTime = 0
			vars.playing.nextSongId = undefined
			vars.playing.nextSongTitle = undefined
			vars.playing.songId = undefined
			vars.playing.songTitle = undefined
			vars.playing.songIndex = undefined
			vars.playing.playlist = undefined
			vars.playing.duration = undefined
		}
	},
	unpause: function() {
		if(ffmpeg) {
			ffmpeg.kill('SIGCONT')
			decoder.pipe(speaker)
			this.playing = true
			this.startTime = Date.now()
		}
	},
	setVolume:function(vol) {
		// modify volume to make the increase in volume more linear
		this.volume = vol
		vol = Math.log10(vol+1)*100/2.00432
		loudness.setVolume(vol, function (err) {
		});
	},
	getVolume:function() {
		return this.volume
	},
	getTime:function() {
		if(this.playing) {
			return this.time + (Date.now() - this.startTime)/1000
		} else {
			return this.time
		}
	},
	seek:function(time) {
		if(vars.player.playing) {
			this.play(vars.playing.songId,vars.playing.playlist,vars.playing.songIndex,time)
		}
	},
	next: function() {
		this.play(vars.playing.nextSongId,vars.playing.playlist,(vars.playing.songIndex)?(vars.playing.songIndex+1):undefined)
	}
}