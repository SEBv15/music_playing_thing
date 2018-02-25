import React from 'react';
import { StyleSheet, Text, View, StatusBar, Dimensions } from 'react-native';
import Expo from 'expo'
import { Ionicons } from '@expo/vector-icons';
import { Button, Icon, Slider } from 'react-native-elements';
import data from './data';

function timeToStr(time) {
  if(!time) {
    return "0:00"
  }
	var minutes = parseInt(time/60)
	var seconds = parseInt(time%60)
	var hours = parseInt(minutes/60)
	minutes = minutes%60
	return ((hours)?hours+":":"") + ((minutes)?("0" + minutes).slice(-2)+":":((hours)?"00:":"0:")) + ("0" + seconds).slice(-2);
}

export default class Controls extends React.Component {
  // state = {volume:.57, volumeSlider: false, volumeIcon:'volume-up'}
  constructor(props) {
    super(props)
    this.state = {volume:.57, volumeSlider: false, volumeIcon:'volume-up',playIcon:'play-arrow'}

    var that = this
    data.ee.addListener("got-bulk",function() {
      try {
        if(!that.state.volumeSlider) {
          if(data.volume || data.volume == 0) {
            that.setState({volume:parseFloat(data.volume)})
          }
          //console.log(data.volume,((data.volume==0)?'volume-off':(data.volume < 33)?'volume-mute':(data.volume<66)?'volume-down':'volume-up'))
          that.setState({volumeIcon:((data.volume==0)?'volume-off':(data.volume < 33)?'volume-mute':(data.volume<66)?'volume-down':'volume-up')})
          that.setState({playIcon:(data.isPlaying)?'pause':'play-arrow'})
          var time = data.time/data.duration*100
          that.setState({time:(data.time == data.duration)?100:time})
        }
      } catch(error) {
        console.log(error)
      }
    })
  }

  nextSong() {
    if(!data.playing.station && data.playing.nextSongId) {
      fetch('http://music_playing_thing/api/v1/next', {
        method: 'POST',
        body: JSON.stringify({}),
      }).catch(err => { console.log(err) })
    }
  }

  playButton() {
    if(data.playing.station) {
      //console.log('http://music_playing_thing/api/v1/station'+((data.isPlaying)?"Pause":"Unpause"))
      fetch('http://music_playing_thing/api/v1/station'+((data.isPlaying)?"Pause":"Unpause"), {
        method: 'POST',
        body: JSON.stringify({}),
      }).catch(err => { console.log(err) })
    } else {
      fetch('http://music_playing_thing/api/v1/'+((data.isPlaying)?"pause":"unpause"), {
        method: 'POST',
        body: JSON.stringify({}),
      }).catch(err => { console.log(err) })
    }
  }

  avr = () => {
    if(data.avr) {
      console.log("OFF")

    } else {
      console.log("ON")

    }
    fetch('http://music_playing_thing/api/v1/avr', {
      method: 'POST',
      body: JSON.stringify({}),
    }).catch(err => { console.log(err) })
  }

  render() {
    //console.log(data)

    return (
      <View style={{flex:0,height:128,backgroundColor:'#aa0033'}}>
        <Text numberOfLines={1} style={controls.currentTitle}>{(data.playing.songTitle)?((this.state.showNextTitle)?data.playing.nextSongTitle:data.playing.songTitle):"Nothin' Playin' Right Now!"}</Text>
        <View style={controls.time}>
          <Text style={{fontWeight:'bold',flex:0,width:72,color:'#fff',textAlign:'center'}}>{timeToStr(data.time)}</Text>
          <Slider
            value={this.state.time}
            minimumValue={0}
            maximumValue={100}
            step={0.2}
            style={{flex:1,marginTop:2}}
            minimumTrackTintColor='#fff'
            maximumTrackTintColor='#444'
            thumbTintColor='#fff'
            disabled={data.playing.station}
            onSlidingComplete={(time)=> {
              console.log(time)
              fetch('http://music_playing_thing/api/v1/seek', {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({time:time/100*data.duration}),
                }).catch((error) => {
                  console.log(error)
                })
            }}
            onValueChange={(time) => {
              data.time = time
              //this.setState({time: data.time/100*data.duration})
            }} />
          <Text style={{fontWeight:'bold',flex:0,width:72,color:'#fff',textAlign:'center'}}>{timeToStr(data.duration)}</Text>
        </View>
        <View style={{height: 64,flex:0, flexDirection:'row'}}>
          <Icon
              name="power-settings-new"
              containerStyle={controls.button}
              size={32}
              onPress={this.avr}
              color={data.avr?'#fff':'#ffffff50'}
              underlayColor='rgba(0,0,0,0.05)'
            />
          <Icon
              name={this.state.volumeIcon}
              containerStyle={controls.button}
              size={32}
              onPress={()=>{this.setState({volumeSlider:true})}}
              color='#fff'
              underlayColor='rgba(0,0,0,0.05)'
            />
          <Icon
              name={this.state.playIcon}
              containerStyle={controls.button}
              onPress={this.playButton}
              size={32}
              color='#fff'
              underlayColor='rgba(0,0,0,0.05)'
            />
          <Icon
              name='skip-next'
              size={32}
              containerStyle={controls.button}
              onPress={this.nextSong}
              onLongPress={()=>{if(!data.playing.station) { this.setState({showNextTitle:true}) }}}
              onPressOut={()=>{if(!data.playing.station) { this.setState({showNextTitle:false}) }}}
              color={data.playing.station?'#ffffff50':'#fff'}
              underlayColor={data.playing.station?'rgba(0,0,0,0)':'rgba(0,0,0,0.05)'}
            />
        </View>
        <View style={[controls.volume,{display:(this.state.volumeSlider)?'flex':'none'}]}>
          <Icon
              name={this.state.volumeIcon}
              color='#517fa4'
              containerStyle={controls.volumeIcon}
              size={32}
              color='#fff'
            />
          <Slider
            value={this.state.volume}
            minimumValue={0}
            maximumValue={100}
            step={0.2}
            style={controls.volumeSlider}
            minimumTrackTintColor='#fff'
            maximumTrackTintColor='#444'
            thumbTintColor='#fff'
            onSlidingComplete={(volume)=> {
              console.log(volume)
              fetch('http://music_playing_thing/api/v1/setVolume', {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({volume:volume}),
                }).catch((error) => {
                  console.log(error)
                })
            }}
            onValueChange={(volume) => {
              data.volume = volume
              this.setState({volumeIcon:(volume==0)?'volume-off':(volume < 33)?'volume-mute':(volume<66)?'volume-down':'volume-up'})
            }} />
          <Icon
              name='close'
              color='#517fa4'
              containerStyle={[controls.volumeIcon,{width:96}]}
              size={32}
              onPress={()=>{this.setState({volumeSlider:false})}}
              color='#fff'
              underlayColor='rgba(0,0,0,0.05)'
            />
        </View>
      </View>
    )
  }
}

const controls = StyleSheet.create({
  button: {
    flex: 1,
    height: 64,
    marginRight: 0,
    backgroundColor: 'transparent',
  },
  currentTitle: {
    height: 32,
    textAlign:'center',
    color: '#fff',
    lineHeight:32,
    fontWeight:'bold',
    paddingLeft: 8,
    paddingRight: 8
  },
  volume: {
    position: 'absolute',
    width: '100%',
    height: 128,
    top: 0,
    left: 0,
    backgroundColor: '#aa0033',
    flexDirection:'row'
  },
  volumeIcon: {
    width: 72,
    height: 128,
    flex:0
  },
  volumeSlider: {
    width: '70%',
    flex:1,
    marginTop: 45,
  },
  time: {
    height: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
