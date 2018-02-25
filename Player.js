import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import Expo from 'expo'
import Controls from './Controls';
import Main from './Main';
import SlideUpView from 'slide-up-view'

export default class Player extends React.Component {
  render() {
    return (
    <View style={[StyleSheet.absoluteFill,{paddingTop: Expo.Constants.statusBarHeight,backgroundColor:'#aa0033'}]}>
      <StatusBar backgroundColor='#aa0033' barStyle = "light-content" hidden = {false}/>

      <Main />
      <SlideUpView>
      </SlideUpView>
      <Controls />
    </View>
  );
  }
}
