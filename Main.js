import React from 'react';
import { Platform, StyleSheet, Text, View, StatusBar, FlatList, Image, TouchableNativeFeedback, ActivityIndicator } from 'react-native';
import Expo from 'expo'
import { Ionicons } from '@expo/vector-icons';
import data from './data';
import {
  StackNavigator,
  NavigationActions
} from 'react-navigation';
import { SearchBar, Icon } from 'react-native-elements'
import Swipeout from 'react-native-swipeout';
import Touchable from 'react-native-touchable-safe'

class DeleteButton extends React.Component {
  render() {
    return (
      <View style={{backgroundColor: 'red',flex:1}}>
        <Icon
          name='delete'
          size={48}
          color='#fff'
          containerStyle={{flex:1}}
          onPress={this.props.delete}
          underlayColor='rgba(0,0,0,0.1)'
         />
      </View>
    )
  }
}

class Playlist extends React.Component {
  constructor(props) {
    super(props)

    this.state = {}
    //console.log("PROPS", props.list)
  }
  deleteItem(id) {
    //var that = this
    //data.playlists = data.playlists.filter(x => x.id != id)
    fetch('http://music_playing_thing/api/v1/deletePlaylist', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({id:id}),
      }).catch((error) => {
        console.log(error)
      })
    data.ee.emit("playlists-updated")
  }

  showItems(props) {
    console.log(props)
    props.navigation.navigate("PlaylistItems",{id:props.list.id})
  }
  componentWillMount() {
    data.ee.addListener("new-song",this.updateActive)
  }
  componentWillUnmount() {
    data.ee.removeListener("new-song",this.updateActive)
  }
  updateActive = () => {
    this.forceUpdate()
  }

  render() {
    return (
      <Swipeout backgroundColor='#E8EAF6' style={{flex:1}} right={(this.props.list.nonRemovable)?[]:[{text:"Delete",component:<DeleteButton delete={()=>this.deleteItem(this.props.list.id)} />}]}>
      <Touchable
        android="native"
        ios="opacity"
        opacityProps={{activeOpacity:0.8}}
         onPress={()=>this.showItems(this.props)}
         /*background={TouchableNativeFeedback.SelectableBackground()}*/
        >

          <View style={[mainStyle.playlist,(this.props.list.id == data.playing.playlist)?{backgroundColor:'#c6c8d4'}:null]}>
            <Image source={{uri:this.props.list.snippet.thumbnails.high.url}}
            style={mainStyle.playlistThumb}
             />
            <View style={{marginRight:8, flex:1,marginTop:4,marginBottom:8}}>
              <Text style={{fontSize: 18, fontWeight: 'bold' }}>{this.props.list.snippet.title}</Text>
              <Text>{this.props.list.snippet.description}</Text>
            </View>
          </View>

        </Touchable>
      </Swipeout>
    )
  }
}

class Song extends React.Component {
  play(props) {
    console.log(props)
    if(props.song.station) {
      fetch('http://music_playing_thing/api/v1/stationPlay', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({id:props.song.id.videoId}),
        }).catch((error) => {
          console.log(error)
        })
    } else {
      fetch('http://music_playing_thing/api/v1/play', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({id:((props.song.contentDetails)?props.song.contentDetails.videoId:props.song.id.videoId),playlist:((props.playlistId)?props.playlistId:undefined),index:((props.index)?props.index:undefined)}),
        }).catch((error) => {
          console.log(error)
        })
      }
  }
  componentWillMount() {
    data.ee.addListener("new-song",this.updateActive)
  }
  componentWillUnmount() {
    data.ee.removeListener("new-song",this.updateActive)
  }
  updateActive = () => {
    this.forceUpdate()
  }
  render() {
    //console.log(this.props.song,data.playing, this.props.index)
    //console.log((((this.props.song.contentDetails)?this.props.song.contentDetails.videoId:this.props.song.id.videoId) == data.playing.songId && (!(this.props.index || this.props.index == 0) || this.props.index == data.playing.songIndex)))
    if(this.props.song && this.props.song.snippet.thumbnails) {
      return (
        <Touchable
          android="native"
          ios="opacity"
          opacityProps={{activeOpacity:0.8}}
           onPress={()=>this.play(this.props)}
          >

            <View style={[mainStyle.playlist,(((this.props.song.contentDetails)?this.props.song.contentDetails.videoId:this.props.song.id.videoId) == data.playing.songId && (!(this.props.index || this.props.index == 0) || this.props.index == data.playing.songIndex))?{backgroundColor:'#c6c8d4'}:null]}>
              <Image source={(this.props.song.snippet.thumbnails.high.url.charAt(0) == ".")?require("./station-placeholder.png"):{uri:this.props.song.snippet.thumbnails.high.url}}
              style={mainStyle.playlistThumb}
               />
              <View style={{marginRight:8, flex:1,marginTop:4,marginBottom:8}}>
                <Text style={{fontSize: 18, fontWeight: 'bold' }}>{this.props.song.snippet.title}</Text>
                <Text>{this.props.song.snippet.description}</Text>
              </View>
            </View>

          </Touchable>
      )
    } else {
      return (<View></View>)
    }
  }
}

class Playlists extends React.Component {
  constructor(props) {
    super(props)
    var that = this
    data.ee.addListener("playlists-updated",function() {
      that.forceUpdate()
    })
  }
  componentWillMount() {
    data.navi = this.props.navigation
    console.log("PLAYLISTS MOUNTED")
  }
  render() {
    return (
      <View>
        <FlatList
          data={data.playlists}
          keyExtractor={(item)=>item.id }
          renderItem={({item}) => <Playlist list={item} navigation={this.props.navigation}/>}
        />
      </View>
    )
  }
}

class PlaylistItems extends React.Component {
  state = {id:undefined}
  componentWillMount() {
    var that = this
    this.state.id = this.props.navigation.state.params.id
    data.navi = this.props.navigation
    console.log(that.props)
    fetch('http://music_playing_thing/api/v1/playlistItems', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({id:that.state.id}),
      }).then(res => res.json()).then(res => {
        //console.log(res)
        this.setState({loaded:true,items:res})
      }).catch((error) => {
        console.log(error)
      })
  }
  render() {
    return (
      <View style={{flex:1}}>
        <Touchable /*background={TouchableNativeFeedback.SelectableBackground()}*/
          android="native"
          ios="opacity"
          opacityProps={{activeOpacity:0.8}}
          onPress={()=>this.props.navigation.goBack()}>

          <View style={mainStyle.songHeader}>
            <Icon name="keyboard-arrow-left" size={24} color='#fff' containerStyle={{marginLeft:16,marginRight:16,flex:0}} />
            <Text style={{color:'#fff',lineHeight:((Platform.OS=='ios')?40:34),height:48,fontSize:16,fontWeight:'bold'}} numberOfLines={1}>{data.playlists.find(x=>x.id==this.state.id).snippet.title}</Text>
          </View>
        </Touchable>
        {(!this.state.loaded)? <ActivityIndicator style={{flex:1}} size="large" color="#0000ff" />:(
        <FlatList
          data={this.state.items}
          keyExtractor={(item)=>item.id }
          renderItem={({item}) => <Song song={item} playlistId={this.state.id} index={this.state.items.findIndex(x=>x.id==item.id)} />}
        />
      )}
      </View>
    )
  }
}

class Search extends React.Component {
  state = {items:[],lastChanged:0}
  timeout
  componentWillMount() {
    //var timeout
    var that = this
    data.ee.removeAllListeners('search-radio');

    data.ee.addListener("search-changed", this.searchChanged)
    data.ee.addListener("search-radio", this.searchRadio)
  }
  componentWillUnmount() {
    data.ee.removeListener("search-changed", this.searchChanged)
    data.ee.removeListener("search-radio", this.searchRadio)
  }
  searchRadio = () => {
    var that = this
    fetch("http://music_playing_thing/api/v1/stationSearch", {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({q:data.search}),
    }).then(res=>res.json()).then(res => {
      //console.log(res)
      res = res.stations
      console.log("LOADED",res)
      var obj = []
      for(let i in res) {
        obj.push({})
        obj[i].etag = res[i].id
        obj[i].id = {}
        obj[i].id.videoId = res[i].id
        obj[i].snippet = {}
        obj[i].snippet.thumbnails = {high:{url:((res[i].image.thumb.url)?res[i].image.url:"./station-placeholder.png")}}
        obj[i].snippet.title = res[i].name
        obj[i].snippet.description = res[i].categories.map(function(elem){return elem.title;}).join(", ");
        obj[i].station = true
      }
      that.setState({items:obj})
      console.log(that.state.items)
    }).catch((error) => {
      console.log(error)
    })
  }
  searchChanged = () => {
    // Only update when not typed for 0.3 seconds
    var that = this
    if(this.timeout) {
      clearTimeout(this.timeout)
    }
    this.timeout = setTimeout(function() {
      console.log("asjhdga")
      fetch('http://music_playing_thing/api/v1/search', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({q:data.search}),
        }).then(res=>res.json()).then(res => {
          //console.log(res)
          console.log("LOADED")
          that.setState({items:res})
          console.log(that.state.items)
        }).catch((error) => {
          console.log(error)
        })
    },300)
  }
  render() {
    return (
      <View>
        <FlatList
          data={this.state.items}
          keyExtractor={(item)=>item.etag }
          renderItem={({item}) => <Song song={item} />}
        />
      </View>
    )
  }
}


const resetAction = NavigationActions.reset({
  index: 0,
  actions: [
    NavigationActions.navigate({ routeName: 'Playlists'})
  ]
})
const Screens = StackNavigator({
  Playlists: { screen: Playlists },
  Search: { screen: Search },
  PlaylistItems: { screen: PlaylistItems },
},{
  headerMode: 'none',
  cardStyle: {backgroundColor: '#E8EAF6'},
});

export default class Main extends React.Component {
  searchInput = (text) => {
    this.setState({searchVal:text})
    data.search = text
    //console.log(text)
    if(this.state.searching == false) {
      data.navi.navigate("Search")
      this.setState({searching:true})
    }
    data.ee.emit("search-changed")

    if(text == "") {
      this.setState({searching:false})
      //console.log(this.state.prevRoute)
      if(data.prevNavState.routes[data.prevNavState.routes.length-1].routeName == "Playlists") {
        //console.log("RESET")
        data.navi.dispatch(resetAction)
      } else {
        data.navi.goBack()
        data.navi.navigate(data.prevNavState.routes[data.prevNavState.routes.length-1].routeName,data.prevNavState.routes[data.prevNavState.routes.length-1].params)
      }
    }
  }
  constructor(props) {
    super(props)
    this.state = {searching:false,prevRoute:"Playlists"}

  }
  navigationChange = (prev,now) => {
    data.prevNavState = prev
    data.currentNavState = now
    if(now.routes[now.routes.length-1].routeName != "Search") {
      this.setState({searching:false})
    }
    console.log(data.currentNavState)
  }
  addPlaylist = () => {
    var id = data.search
    if(id.indexOf("list=") > 0) {
      id = id.substr(id.indexOf("list=")+5)
      var end = id.indexOf("&")
      if(end > 0) {
        id = id.substr(0,end)
      }
      fetch('http://music_playing_thing/api/v1/addPlaylist', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({id:id}),
        }).catch((error) => {
          console.log(error)
        })
      this.searchInput("")
    }
  }
  searchRadio = () => {
      if(this.state.searching == false) {
        data.navi.navigate("Search")
        setTimeout(function() {
          data.ee.emit("search-radio")
        },500)
        this.setState({searching:true})
      } else {
        data.ee.emit("search-radio")
      }
  }

  render() {
    return (
      <View style={{flex:1,backgroundColor:'red'}}>
        <View style={mainStyle.header}>
          <SearchBar
            onChangeText={this.searchInput}
            onClearText={()=>{}}
            onFocus={()=>this.setState({searching:false})}
            onEndEditing={()=>this.setState({searching:false})}
            containerStyle={mainStyle.searchBar}
            inputStyle={mainStyle.searchInput}
            icon={{name:'search'}}
            value={this.state.searchVal}
            clearIcon={{name:'clear'}}
            placeholder='Search YouTube / Add Playlist' />
          <Icon
            name='playlist-add'
            size={28}
            onPress={this.addPlaylist}
            underlayColor='rgba(0,0,0,0.05)'
            containerStyle={mainStyle.addPlaylistButton}
            color='#fff' />
          <Icon
            name='radio'
            size={28}
            onPress={this.searchRadio}
            underlayColor='rgba(0,0,0,0.05)'
            containerStyle={mainStyle.addPlaylistButton}
            color='#fff' />
        </View>
        <Screens onNavigationStateChange={this.navigationChange} />
      </View>
    )
  }
}

const mainStyle = StyleSheet.create({
  header: {
    backgroundColor: '#aa0033',
    height: 60,
    flex:0,
    borderWidth:0,
    flexDirection: 'row'
  },
  searchBar: {
    flex:1,
    backgroundColor:'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    marginTop: (Platform.OS == 'ios')?6:2,
    marginLeft: (Platform.OS == 'ios')?6:2
  },
  searchInput: {
    backgroundColor: '#fff'
  },
  addPlaylistButton: {
    width: 48,
    flex: 0,
  },
  playlist: {
    flex:0,
    flexDirection:'row',
    height: 128
  },
  playlistThumb: {
    height: 112,
    width: 149,
    flex: 0,
    marginTop: 8,
    marginLeft: 8,
    marginRight: 8
  },
  songHeader: {
    backgroundColor: '#aa0033',
    flexDirection: 'row',
    height: 48
  }
})
