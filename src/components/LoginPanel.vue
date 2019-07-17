<template lang="pug">
.page-content
    .login-area(v-if="!loggedIn")
      hr
      h4.title.is-4 Sign into MATSim-Viz to access your account.
      hr
      #firebaseui-auth-container
</template>

<script lang="ts">
import sharedStore from '@/SharedStore'
import { Vue, Component, Prop } from 'vue-property-decorator'

import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebaseui/dist/firebaseui.css'
import * as firebaseui from 'firebaseui'

@Component
export default class StartPage extends Vue {
  private loggedIn: boolean = false

  public mounted() {
    const parent = this
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        console.log({ user })
        parent.loggedIn = true
        // User is signed in.
      } else {
        // No user is signed in.
        parent.loggedIn = false
        parent.showLoginPanel()
      }
    })
  }

  private showLoginPanel() {
    const ui = new firebaseui.auth.AuthUI(firebase.auth())

    //    if (ui.isPendingRedirect()) {
    ui.start('#firebaseui-auth-container', {
      signInOptions: [
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
          requireDisplayName: true,
        },
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      ],
    })
  }

  private logout() {
    const user = firebase.auth().currentUser
    if (user) {
      firebase
        .auth()
        .signOut()
        .then(() => {
          // sign out successful
          console.log('logged out')
          this.loggedIn = false
        })
        .catch(e => {
          // failed
          console.error(e)
        })
    }
  }
}
</script>

<style scoped>
.page-content {
  margin: 5rem auto;
  background-color: white;
}
</style>
