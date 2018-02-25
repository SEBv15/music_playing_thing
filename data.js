import EventEmitter from 'EventEmitter';

data = {
  ee: new EventEmitter(),
  volume: 50,
  playing: {},
  playlists: []
}

setInterval(function() {
  fetch('http://192.168.1.83/api/v1/getBulk', {
    method: 'POST',
    body: JSON.stringify({}),
  }).then((response) => {try { return response.json() } catch(err) {console.log(err); return undefined }} )
    .then((res) => {
      //console.log(responseJson)
      if(!res) {
        return
      }
      if(data.playing.songId != res.playing.songId || data.playing.songIndex != res.playing.songIndex) {
        data.playing = res.playing
        data.ee.emit("new-song")
      }
      data.playing = res.playing
      // Don't update playlists when their length is not different since the order changes every time
      if(data.playlists.length != res.playlists.length) {
        data.playlists = res.playlists
        for (let i in data.playlists) {
          data.playlists[i].index = i
        }
        data.ee.emit("playlists-updated")
      }
      //data.playlists = res.playlists
      data.duration = res.duration
      data.isPlaying = res.isPlaying
      data.time = res.time
      data.volume = res.volume
      data.avr = res.avr
      data.ee.emit("got-bulk")
    })
    .catch((error) => {
      console.log(error);
    });
},1000)

export default data
