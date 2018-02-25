import { AppLoading } from 'expo';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Player from './Player';

export default class App extends React.Component {
  /*
   * If some sort of asset loading is needed before starting:
   * Place code into componentWillMount
   * switch this.assetsLoaded to true when finished
   */
  state = { assetsLoaded: true };

  render() {
    return this.state.assetsLoaded ? <Player /> : <AppLoading />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
