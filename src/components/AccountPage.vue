<template lang="pug">
.content-area
  .center-area
    .main-area
      .login-area(v-if="!loggedIn")
        hr
        h4.title.is-4 Sign into MATSim-Viz to access your account.
        hr
        #firebaseui-auth-container
      .account-area(v-else)
        h3.title.is-3 Account Page - {{account}}
        hr

        p
          b User:&nbsp;
          | {{account}}

        p
          b Member of:&nbsp;
          | (tba)

        hr
        button.button.right.is-link(v-if="loggedIn" @click="logout()") Logout
</template>

<script lang="ts">
import sharedStore from '@/SharedStore'
import { Vue, Component, Prop } from 'vue-property-decorator'

import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebaseui/dist/firebaseui.css'
import * as firebaseui from 'firebaseui'

@Component
export default class AccountPage extends Vue {
  private loggedIn: boolean = false
  private account: string = ''

  public mounted() {
    const parent = this
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        console.log({ user })
        parent.loggedIn = true
        if (user.displayName) {
          parent.account = user.displayName
        } else if (user.email) {
          parent.account = user.email
        }

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
          // signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
          requireDisplayName: true,
        },
        // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
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
.content-area {
  background-color: #fff;
}

.center-area {
  width: 100%;
  overflow-y: auto;
}

.main-area {
  max-width: 60rem;
  margin: 0px auto;
  padding-top: 1rem;
}

.login-area {
  margin: auto auto;
}
</style>
